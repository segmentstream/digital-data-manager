import clone from 'component-clone';
import async from 'async';
import debug from 'debug';
import noop from './functions/noop.js';
import deleteProperty from './functions/deleteProperty.js';
import size from './functions/size.js';
import after from './functions/after.js';
import jsonIsEqual from './functions/jsonIsEqual.js';
import DDHelper from './DDHelper.js';
import EventDataEnricher from './EventDataEnricher.js';
import { VIEWED_PAGE } from './events';

let _callbacks = {};
let _ddListener = [];
let _previousDigitalData = {};
let _digitalData = {};
let _checkForChangesIntervalId;
let _viewabilityTracker;
let _isInitialized = false;
let _sendViewedPageEvent = false;

const _callbackOnComplete = (error) => {
  if (error) {
    debug('ddListener callback error: %s', error);
  }
};

function _getCopyWithoutEvents(digitalData) {
  const digitalDataCopy = clone(digitalData);
  deleteProperty(digitalDataCopy, 'events');
  return digitalDataCopy;
}

class EventManager {

  constructor(digitalData, ddListener) {
    _digitalData = digitalData || _digitalData;
    if (!Array.isArray(_digitalData.events)) {
      _digitalData.events = [];
    }
    _ddListener = ddListener || _ddListener;
    _previousDigitalData = _getCopyWithoutEvents(_digitalData);
  }

  initialize() {
    const events = _digitalData.events;
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
      this.fireEvent(event);
      events[events.length] = event;
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
      let handler = callbackInfo[2];
      if (callbackInfo[1] !== 'beforeEvent') {
        // make handler async if it is not before-handler
        handler = async.asyncify(callbackInfo[2]);
      }
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
          callback.handler(value, _callbackOnComplete);
          _callbacks.define.splice(_callbacks.define.indexOf(callback), 1);
        }
      }
    }
  }

  fireChange(newValue, previousValue) {
    let callback;
    if (_callbacks.change && _callbacks.change.length > 0) {
      for (callback of _callbacks.change) {
        if (callback.key) {
          const key = callback.key;
          const newKeyValue = DDHelper.get(key, newValue);
          const previousKeyValue = DDHelper.get(key, previousValue);
          if (!jsonIsEqual(newKeyValue, previousKeyValue)) {
            callback.handler(newKeyValue, previousKeyValue, _callbackOnComplete);
          }
        } else {
          callback.handler(newValue, previousValue, _callbackOnComplete);
        }
      }
    }
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
    let eventCallback;
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
        _callbackOnComplete(error);
        ready();
      };

      for (eventCallback of _callbacks.event) {
        let eventCopy = clone(event);
        deleteProperty(eventCopy, 'callback');
        if (eventCopy.enrichEventData !== false) {
          eventCopy = this.enrichEventWithData(eventCopy);
        }
        eventCallback.handler(eventCopy, eventCallbackOnComplete);
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
        let eventCopy = clone(event);
        deleteProperty(eventCopy, 'callback');
        if (eventCopy.enrichEventData !== false) {
          eventCopy = this.enrichEventWithData(eventCopy);
        }
        handler(eventCopy, noop);
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
        events.unshift({ name: VIEWED_PAGE });
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
  }
}

export default EventManager;
