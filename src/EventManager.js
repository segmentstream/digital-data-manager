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

let _callbacks = {};
let _ddListener = [];
let _previousDigitalData = {};
let _digitalData = {};
let _checkForChangesIntervalId;
let _autoEvents;
let _isInitialized = false;

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

    if (_autoEvents) {
      _autoEvents.onInitialize();
    }
    _checkForChangesIntervalId = setInterval(() => {
      this.fireDefine();
      this.checkForChanges();
    }, 100);

    _isInitialized = true;
  }

  setAutoEvents(autoEvents) {
    _autoEvents = autoEvents;
    _autoEvents.setDigitalData(_digitalData);
    _autoEvents.setDDListener(_ddListener);
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
      const asyncHandler = async.asyncify(callbackInfo[2]);
      this.on(callbackInfo[1], asyncHandler, processPastEvents);
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

  fireEvent(event) {
    let eventCallback;
    event.time = (new Date()).getTime();

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
    _callbacks[type] = _callbacks[type] || [];
    if (key) {
      _callbacks[type].push({
        key,
        handler,
      });
    } else {
      _callbacks[type].push({
        handler,
      });
    }
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
    const enrichableVars = [
      'product',
      'listItems',
      'transaction',
      'campaign',
      'campaigns',
      'user',
      'page',
    ];

    for (const enrichableVar of enrichableVars) {
      if (event[enrichableVar]) {
        const enricherMethod = EventDataEnricher[enrichableVar];
        const eventVar = event[enrichableVar];
        event[enrichableVar] = enricherMethod(eventVar, _digitalData);
      }
    }

    return event;
  }

  reset() {
    clearInterval(_checkForChangesIntervalId);
    while (_ddListener.length) {
      _ddListener.pop();
    }
    _ddListener.push = Array.prototype.push;
    _callbacks = {};
    _autoEvents = null;
  }
}

export default EventManager;
