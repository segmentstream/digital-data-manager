import clone from 'component-clone';
import async from 'async';
import debug from 'debug';
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
      this.checkForChanges();
    }, 100);
  }

  setAutoEvents(autoEvents) {
    _autoEvents = autoEvents;
    _autoEvents.setDigitalData(_digitalData);
    _autoEvents.setDDListener(_ddListener);
  }

  checkForChanges() {
    if (_callbacks.change && _callbacks.change.length > 0) {
      const digitalDataWithoutEvents = _getCopyWithoutEvents(_digitalData);
      if (!jsonIsEqual(_previousDigitalData, digitalDataWithoutEvents)) {
        const previousDigitalDataWithoutEvents = _getCopyWithoutEvents(_previousDigitalData);
        _previousDigitalData = clone(digitalDataWithoutEvents);
        this.fireChange(digitalDataWithoutEvents, previousDigitalDataWithoutEvents);
      }
    }
  }

  addCallback(callbackInfo) {
    if (!Array.isArray(callbackInfo) || callbackInfo.length < 2) {
      return;
    }

    if (callbackInfo[0] === 'on') {
      if (callbackInfo.length < 3) {
        return;
      }
      const asyncHandler = async.asyncify(callbackInfo[2]);
      this.on(callbackInfo[1], asyncHandler);
    } if (callbackInfo[0] === 'off') {
      // TODO
    }
  }

  fireChange(newValue, previousValue) {
    let changeCallback;
    if (_callbacks.change) {
      for (changeCallback of _callbacks.change) {
        if (changeCallback.key) {
          const key = changeCallback.key;
          const newKeyValue = DDHelper.get(key, newValue);
          const previousKeyValue = DDHelper.get(key, previousValue);
          if (!jsonIsEqual(newKeyValue, previousKeyValue)) {
            changeCallback.handler(newKeyValue, previousKeyValue, _callbackOnComplete);
          }
        } else {
          changeCallback.handler(newValue, previousValue, _callbackOnComplete);
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
        deleteProperty(eventCopy, 'updateDigitalData');
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

  on(eventInfo, handler) {
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
      'transaction',
      'campaign',
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

    _ddListener.push = Array.prototype.push;
    _callbacks = {};
  }
}

export default EventManager;
