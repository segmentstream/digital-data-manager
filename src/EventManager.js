import clone from './functions/clone.js'
import deleteProperty from './functions/deleteProperty.js';

let _callbacks = {};
let _ddListener = [];
let _previousDigitalData = {};
let _digitalData = {};
let _checkForChangesIntervalId;

function _getCopyWithoutEvents(digitalData) {
  let digitalDataCopy = clone(digitalData);
  deleteProperty(digitalDataCopy, 'events');
  return digitalDataCopy;
}

function _jsonIsEqual(json1, json2) {
  if (typeof json1 !== "string") {
    json1 = JSON.stringify(json1)
  }
  if (typeof json2 !== "string") {
    json2 = JSON.stringify(json2)
  }
  return json1 === json2;
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

    _checkForChangesIntervalId = setInterval(() => {
      this.checkForChanges();
    }, 100);
  }

  checkForChanges() {
    if (_callbacks.change && _callbacks.change.length > 0) {
      let digitalDataWithoutEvents = _getCopyWithoutEvents(_digitalData);
      if (!_jsonIsEqual(_previousDigitalData, digitalDataWithoutEvents)) {
        this.fireChange();
        _previousDigitalData = digitalDataWithoutEvents
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
      this.on(callbackInfo[1], callbackInfo[2]);
    } if (callbackInfo[0] === 'off') {
      // TODO
    }
  }

  fireChange(newValue, previousValue) {
    let changeCallback;
    if (_callbacks.change) {
      for (changeCallback of _callbacks.change) {
        if (changeCallback.key) {
          let key = changeCallback.key;
          //check if only specific key was changed
        } else {
          changeCallback.handler();
        }
      }
    }
  }

  fireEvent(event) {
    let eventCallback;
    event.time = (new Date()).getTime();
    if (_callbacks.event) {
      for (eventCallback of _callbacks.event) {
        eventCallback.handler(clone(event));
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

  reset() {
    clearInterval(_checkForChangesIntervalId);
    _ddListener.push = Array.prototype.push;
    _callbacks = {};
  }
}

export default EventManager;
