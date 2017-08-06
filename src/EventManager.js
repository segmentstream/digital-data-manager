import clone from 'driveback-utils/clone';
import deleteProperty from 'driveback-utils/deleteProperty';
import size from 'driveback-utils/size';
import after from 'driveback-utils/after';
import jsonIsEqual from 'driveback-utils/jsonIsEqual';
import { error as errorLog } from 'driveback-utils/safeConsole';
import DDHelper from './DDHelper';
import EventDataEnricher from './enrichments/EventDataEnricher';
import CustomEvent from './events/CustomEvent';
import { VIEWED_PAGE } from './events/semanticEvents';

let _callbacks = {};
let _ddListener = [];
let _previousDigitalData = {};
let _digitalData = {};
let _checkForChangesIntervalId;
let _isInitialized = false;
let _sendViewedPageEvent = false;
const _customEvents = [];

function _getCopyWithoutEvents(digitalData) {
  // not a deep copy for performance optimization and removal of events and changes
  const unsafeDigitalDataCopy = Object.assign({}, digitalData);
  deleteProperty(unsafeDigitalDataCopy, 'events');
  deleteProperty(unsafeDigitalDataCopy, 'changes');

  const digitalDataCopy = clone(unsafeDigitalDataCopy);
  return digitalDataCopy;
}

class EventManager {
  constructor(digitalData, ddListener) {
    _digitalData = digitalData || _digitalData;
    if (!Array.isArray(_digitalData.events)) {
      _digitalData.events = [];
    }
    if (!Array.isArray(_digitalData.changes)) {
      _digitalData.changes = [];
    }
    _ddListener = ddListener || _ddListener;
    _previousDigitalData = _getCopyWithoutEvents(_digitalData);
  }

  import(eventsConfig) {
    eventsConfig = eventsConfig || [];
    eventsConfig.forEach((eventConfig) => {
      const customEvent = new CustomEvent(
        eventConfig.name,
        eventConfig.trigger,
        eventConfig.event || eventConfig.selector,
        eventConfig.handler,
        _digitalData,
        this,
      );
      _customEvents.push(customEvent);
    });
  }

  addEvent(name, trigger, setting, handler) {
    const customEvent = new CustomEvent(name, trigger, setting, handler, _digitalData, this);
    _customEvents.push(customEvent);
  }

  initialize() {
    const events = _digitalData.events;

    // initialize custom events tracking
    _customEvents.forEach((customEvent) => {
      customEvent.track();
    });

    // process callbacks
    this.addEarlyCallbacks();
    this.fireDefine();
    _ddListener.push = (callbackInfo) => {
      this.addCallback(callbackInfo);
      _ddListener[_ddListener.length] = callbackInfo;
    };

    // process changes
    // IMPORTANT: should be processed before events
    this.applyEarlyChanges();
    this.enableChangesTracking();

    // process events
    // TODO: refactoring
    if (this.isViewedPageSent()) {
      this.fireUnfiredEvents();
      this.enableEventsTracking();
    } else if (_sendViewedPageEvent && !this.isViewedPageSent()) {
      this.addViewedPageEvent();
      this.fireUnfiredEvents();
      this.enableEventsTracking();
    } else {
      events.push = (event) => {
        // waiting for "Viewed Page" event
        if (event.name === VIEWED_PAGE) {
          this.addViewedPageEvent(event);
          this.enableEventsTracking();
          this.fireUnfiredEvents();
        } else {
          events[events.length] = event;
        }
      };
    }

    _isInitialized = true;
  }

  enableEventsTracking() {
    const events = _digitalData.events;
    events.push = (event) => {
      events[events.length] = event;
      this.fireEvent(event);
    };
  }

  enableChangesTracking() {
    const changes = _digitalData.changes;

    changes.push = (changeInfo) => {
      changes[changes.length] = changeInfo;
      this.applyChange(changeInfo);
    };

    _checkForChangesIntervalId = setInterval(() => {
      this.fireDefine();
      this.checkForChanges();
    }, 100);
  }

  setSendViewedPageEvent(sendViewedPageEvent) {
    _sendViewedPageEvent = sendViewedPageEvent;
  }

  getSendViewedPageEvent() {
    return _sendViewedPageEvent;
  }

  checkForChanges() {
    if (
      (_callbacks.change && _callbacks.change.length > 0) ||
      (_callbacks.define && _callbacks.define.length > 0)
    ) {
      const digitalDataWithoutEvents = _getCopyWithoutEvents(_digitalData);
      if (!jsonIsEqual(_previousDigitalData, digitalDataWithoutEvents)) {
        const previousDigitalDataWithoutEvents = _getCopyWithoutEvents(_previousDigitalData);
        _previousDigitalData = clone(digitalDataWithoutEvents);
        this.fireDefine();
        this.fireChange(digitalDataWithoutEvents, previousDigitalDataWithoutEvents);
      }
    }
  }

  addCallback(callbackInfo, processPastEvents) {
    if (processPastEvents !== false) {
      processPastEvents = true;
    }

    if (!Array.isArray(callbackInfo) || callbackInfo.length < 2) {
      return;
    }

    if (callbackInfo[0] === 'on') {
      if (callbackInfo.length < 3) {
        return;
      }
      const handler = callbackInfo[2];
      this.on(callbackInfo[1], handler, processPastEvents);
    } else if (callbackInfo[0] === 'off') {
      // TODO
    }
  }

  isViewedPageSent() {
    const events = _digitalData.events;
    return events.some(event => event.name === VIEWED_PAGE);
  }

  addViewedPageEvent(event) {
    if (!event) {
      event = { name: VIEWED_PAGE, source: 'DDManager' };
    }
    _digitalData.events.unshift(event);
  }

  fireDefine() {
    if (_callbacks.define && _callbacks.define.length > 0) {
      _callbacks.define.forEach((callback) => {
        let value;
        if (callback.key) {
          const key = callback.key;
          value = DDHelper.get(key, _digitalData);
        } else {
          value = _digitalData;
        }
        if (value !== undefined) {
          try {
            callback.handler(value);
          } catch (e) {
            errorLog(e);
          }
          _callbacks.define.splice(_callbacks.define.indexOf(callback), 1);
        }
      });
    }
  }

  fireChange(newValue, previousValue) {
    const callHandler = (handler, nv, pv) => {
      try {
        handler(nv, pv);
      } catch (e) {
        errorLog(e);
      }
    };

    if (_callbacks.change && _callbacks.change.length > 0) {
      _callbacks.change.forEach((callback) => {
        if (callback.key) {
          const key = callback.key;
          const newKeyValue = DDHelper.get(key, newValue);
          const previousKeyValue = DDHelper.get(key, previousValue);
          if (!jsonIsEqual(newKeyValue, previousKeyValue)) {
            callHandler(callback.handler, newKeyValue, previousKeyValue);
          }
        } else {
          callHandler(callback.handler, newValue, previousValue);
        }
      });
    }
  }

  applyEarlyChanges() {
    const changes = _digitalData.changes;
    changes.forEach((changeInfo) => {
      this.applyChange(changeInfo);
    });
  }

  applyChange(changeInfo) {
    const [key, value] = changeInfo;
    DDHelper.set(key, value, _digitalData);
  }

  beforeFireEvent(event) {
    if (!_callbacks.beforeEvent) {
      return true;
    }

    let result = true;

    _callbacks.beforeEvent.forEach((beforeEventCallback) => {
      if (beforeEventCallback.handler(event) === false) {
        result = false;
      }
    });

    return result;
  }

  fireEvent(event) {
    if (!event.timestamp) { // do not override if defined in unit tests
      event.timestamp = Date.now();
    }

    if (!this.beforeFireEvent(event)) {
      return;
    }
    if (_callbacks.event) {
      const results = [];
      const errors = [];

      const ready = after(size(_callbacks.event), () => {
        if (typeof event.callback === 'function') {
          event.callback(results, errors);
        }
      });

      const eventCallbackOnComplete = (error, result) => {
        if (result !== undefined) {
          results.push(result);
        }
        if (error) {
          errors.push(error);
        }
        ready();
      };

      _callbacks.event.forEach((eventCallback) => {
        let eventCopy = clone(event, true);
        deleteProperty(eventCopy, 'callback');
        if (eventCopy.enrichEventData !== false) {
          eventCopy = this.enrichEventWithData(eventCopy);
        }
        try {
          const result = eventCallback.handler(eventCopy);
          eventCallbackOnComplete(null, result);
        } catch (e) {
          eventCallbackOnComplete(e);
          errorLog(e);
        }
      });
    } else if (typeof event.callback === 'function') {
      event.callback();
    }

    event.hasFired = true;
  }

  on(eventInfo, handler, processPastEvents) {
    const [type, key] = eventInfo.split(':');

    _callbacks[type] = _callbacks[type] || [];
    _callbacks[type].push({
      key,
      handler,
    });
    if (_isInitialized && type === 'event' && processPastEvents) {
      this.applyCallbackForPastEvents(handler);
    }
  }

  applyCallbackForPastEvents(handler) {
    const events = _digitalData.events;
    events.forEach((event) => {
      if (event.hasFired) {
        let eventCopy = clone(event, true);
        deleteProperty(eventCopy, 'callback');
        if (eventCopy.enrichEventData !== false) {
          eventCopy = this.enrichEventWithData(eventCopy);
        }
        try {
          handler(eventCopy);
        } catch (e) {
          errorLog(e);
        }
      }
    });
  }

  fireUnfiredEvents() {
    const events = _digitalData.events;
    events.forEach((event) => {
      if (!event.hasFired) {
        this.fireEvent(event);
      }
    });
  }

  addEarlyCallbacks() {
    _ddListener.forEach((callbackInfo) => {
      this.addCallback(callbackInfo);
    });
  }

  enrichEventWithData(event) {
    return EventDataEnricher.enrichCommonData(event, _digitalData);
  }

  reset() {
    clearInterval(_checkForChangesIntervalId);
    while (_ddListener.length) {
      _ddListener.pop();
    }
    while (_digitalData.changes.length) {
      _digitalData.changes.pop();
    }
    _ddListener.push = Array.prototype.push;
    _digitalData.changes.push = Array.prototype.push;
    _callbacks = {};
    _sendViewedPageEvent = false;
  }
}

export default EventManager;
