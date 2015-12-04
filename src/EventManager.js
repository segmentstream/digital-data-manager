const _callbacks = {};
let _ddListener = [];
let _digitalData = {};

class EventManager {

  constructor(digitalData, ddListener) {
    _digitalData = digitalData || _digitalData;
    _ddListener = ddListener || _ddListener;
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

  fireEvent(event) {
    let eventCallback;
    event.time = (new Date()).getTime();
    if (_callbacks.event) {
      for (eventCallback of _callbacks.event) {
        eventCallback.handler(event);
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
}

export default EventManager;
