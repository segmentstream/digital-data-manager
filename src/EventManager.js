import clone from './functions/clone';
import deleteProperty from './functions/deleteProperty.js';
import size from './functions/size.js';
import after from './functions/after.js';
import jsonIsEqual from './functions/jsonIsEqual.js';
import { error as errorLog } from './functions/safeConsole';
import DDHelper from './DDHelper.js';
import EventDataEnricher from './enrichments/EventDataEnricher.js';
import { VIEWED_PAGE } from './events';

let _callbacks = {};
let _ddListener = [];
let _previousDigitalData = {};
let _digitalData = {};
let _checkForChangesIntervalId;
let _viewabilityTracker;
let _isInitialized = false;
let _sendViewedPageEvent = false;

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

  initialize() {
    const events = _digitalData.events;
    const changes = _digitalData.changes;

    // process callbacks
    this.addEarlyCallbacks();
    this.fireDefine();
    _ddListener.push = (callbackInfo) => {
      this.addCallback(callbackInfo);
      _ddListener[_ddListener.length] = callbackInfo;
    };

    // process events
    this.fireUnfiredEvents();
    events.push = (event) => {
      events[events.length] = event;
      this.fireEvent(event);
    };

    // process changes
    this.applyEarlyChanges();
    changes.push = (changeInfo) => {
      changes[changes.length] = changeInfo;
      this.applyChange(changeInfo);
    };

    if (_viewabilityTracker) {
      _viewabilityTracker.initialize();
    }
    _checkForChangesIntervalId = setInterval(() => {
      this.fireDefine();
      this.checkForChanges();
    }, 100);

    _isInitialized = true;
  }

  setSendViewedPageEvent(sendViewedPageEvent) {
    _sendViewedPageEvent = sendViewedPageEvent;
  }

  getSendViewedPageEvent() {
    return _sendViewedPageEvent;
  }

  setViewabilityTracker(viewabilityTracker) {
    _viewabilityTracker = viewabilityTracker;
  }

  checkForChanges() {
    if (_callbacks.change && _callbacks.change.length > 0 || _callbacks.define && _callbacks.define.length > 0 ) {
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
    } if (callbackInfo[0] === 'off') {
      // TODO
    }
  }

  fireDefine() {
    let callback;
    if (_callbacks.define && _callbacks.define.length > 0) {
      for (callback of _callbacks.define) {
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
      }
    }
  }

  fireChange(newValue, previousValue) {
    let callback;
    const callHandler = (handler, nv, pv) => {
      try {
        handler(nv, pv);
      } catch (e) {
        errorLog(e);
      }
    };

    if (_callbacks.change && _callbacks.change.length > 0) {
      for (callback of _callbacks.change) {
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
      }
    }
  }

  applyEarlyChanges() {
    const changes = _digitalData.changes;
    let changeInfo;

    for (changeInfo of changes) {
      this.applyChange(changeInfo);
    }
  }

  applyChange(changeInfo) {
    const [key, value] = changeInfo;
    DDHelper.set(key, value, _digitalData);
  }

  beforeFireEvent(event) {
    if (!_callbacks.beforeEvent) {
      return true;
    }

    let beforeEventCallback;
    let result;
    for (beforeEventCallback of _callbacks.beforeEvent) {
      result = beforeEventCallback.handler(event);
      if (result === false) {
        return false;
      }
    }
    return true;
  }

  fireEvent(event) {
    event.timestamp = Date.now();

    if (!this.beforeFireEvent(event)) {
      return false;
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

      for (const eventCallback of _callbacks.event) {
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
      }
    } else {
      if (typeof event.callback === 'function') {
        event.callback();
      }
    }

    event.hasFired = true;
  }

  on(eventInfo, handler, processPastEvents) {
    const [type, key] = eventInfo.split(':');

    if (type === 'view') {
      _viewabilityTracker.addTracker(key, handler);
      return; // delegate view tracking to ViewabilityTracker
    }

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
    let event;
    for (event of events) {
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
    }
  }

  fireUnfiredEvents() {
    const events = _digitalData.events;
    let event;

    if (_sendViewedPageEvent) {
      let viewedPageEventIsSent = false;
      for (event of events) {
        if (event.name === VIEWED_PAGE) {
          viewedPageEventIsSent = true;
          break;
        }
      }
      if (!viewedPageEventIsSent) {
        events.unshift({ name: VIEWED_PAGE, source: 'DDManager' });
      }
    }

    for (event of events) {
      if (!event.hasFired) {
        this.fireEvent(event);
      }
    }
  }

  addEarlyCallbacks() {
    let callbackInfo;
    for (callbackInfo of _ddListener) {
      this.addCallback(callbackInfo);
    }
  }

  enrichEventWithData(event) {
    return EventDataEnricher.enrichCommonData(event, _digitalData);
  }

  reset() {
    clearInterval(_checkForChangesIntervalId);
    while (_ddListener.length) {
      _ddListener.pop();
    }
    _ddListener.push = Array.prototype.push;
    _callbacks = {};
    _viewabilityTracker = null;
    _sendViewedPageEvent = false;
  }
}

export default EventManager;
