(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (typeof Array !== "undefined" && !Array.isArray) {
// Array.isArray
Array.isArray = function isArray(array) {
	return array && Object.prototype.toString.call(array) === '[object Array]';
};

}
'use strict';

function _typeof2(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

exports.__esModule = true;

var _EventManager = require('./EventManager.js');

var _EventManager2 = _interopRequireDefault(_EventManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _typeof(obj) {
  return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj === 'undefined' ? 'undefined' : _typeof2(obj);
}

var _digitalDataNamespace = 'digitalData';
var _ddListenerNamespace = 'ddListener';
var _digitalData = {};
var _ddListener = [];
var _global = window;

function _prepareGlobals() {
  if (_typeof(_global[_digitalDataNamespace]) === 'object') {
    _digitalData = _global[_digitalDataNamespace];
  } else {
    _global[_digitalDataNamespace] = _digitalData;
  }

  if (Array.isArray(_global[_ddListenerNamespace])) {
    _ddListener = _global[_ddListenerNamespace];
  } else {
    _global[_ddListenerNamespace] = _ddListener;
  }

  if (!Array.isArray(_digitalData.events)) {
    _digitalData.events = [];
  }
}

var DDManager = function DDManager(digitalDataNamespace, ddListenerNamespace, global) {
  _classCallCheck(this, DDManager);

  if (ddListenerNamespace) {
    _digitalDataNamespace = digitalDataNamespace;
  }
  if (ddListenerNamespace) {
    _ddListenerNamespace = ddListenerNamespace;
  }
  if (global) {
    _global = global;
  }

  _prepareGlobals();

  this.eventManager = new _EventManager2['default'](_digitalData, _ddListener);
  this.eventManager.init();
};

exports['default'] = DDManager;

},{"./EventManager.js":2}],2:[function(require,module,exports){
if (typeof Array !== "undefined" && !Array.isArray) {
// Array.isArray
Array.isArray = function isArray(array) {
	return array && Object.prototype.toString.call(array) === '[object Array]';
};

}
'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var _callbacks = {};
var _ddListener = [];
var _digitalData = {};

var EventManager = (function () {
  function EventManager(digitalData, ddListener) {
    _classCallCheck(this, EventManager);

    _digitalData = digitalData || _digitalData;
    _ddListener = ddListener || _ddListener;
  }

  EventManager.prototype.init = function init() {
    var _this = this;

    var events = _digitalData.events;
    // process callbacks
    this.addEarlyCallbacks();
    _ddListener.push = function (callbackInfo) {
      _this.addCallback(callbackInfo);
      _ddListener[_ddListener.length] = callbackInfo;
    };

    // process events
    this.fireUnfiredEvents();
    events.push = function (event) {
      _this.fireEvent(event);
      events[events.length] = event;
    };
  };

  EventManager.prototype.addCallback = function addCallback(callbackInfo) {
    if (!Array.isArray(callbackInfo) || callbackInfo.length < 2) {
      return;
    }

    if (callbackInfo[0] === 'on') {
      if (callbackInfo.length < 3) {
        return;
      }
      this.on(callbackInfo[1], callbackInfo[2]);
    }if (callbackInfo[0] === 'off') {
      // TODO
    }
  };

  EventManager.prototype.fireEvent = function fireEvent(event) {
    var eventCallback = undefined;
    event.time = new Date().getTime();
    if (_callbacks.event) {
      for (var _iterator = _callbacks.event, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        if (_isArray) {
          if (_i >= _iterator.length) break;
          eventCallback = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          eventCallback = _i.value;
        }

        eventCallback.handler(event);
      }
    }
    event.hasFired = true;
  };

  EventManager.prototype.on = function on(eventInfo, handler) {
    var _eventInfo$split = eventInfo.split(':');

    var type = _eventInfo$split[0];
    var key = _eventInfo$split[1];

    _callbacks[type] = _callbacks[type] || [];
    if (key) {
      _callbacks[type].push({
        key: key,
        handler: handler
      });
    } else {
      _callbacks[type].push({
        handler: handler
      });
    }
  };

  EventManager.prototype.fireUnfiredEvents = function fireUnfiredEvents() {
    var events = _digitalData.events;
    var event = undefined;
    for (var _iterator2 = events, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        event = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        event = _i2.value;
      }

      if (!event.hasFired) {
        this.fireEvent(event);
      }
    }
  };

  EventManager.prototype.addEarlyCallbacks = function addEarlyCallbacks() {
    var callbackInfo = undefined;
    for (var _iterator3 = _ddListener, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        callbackInfo = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        callbackInfo = _i3.value;
      }

      this.addCallback(callbackInfo);
    }
  };

  return EventManager;
})();

exports['default'] = EventManager;

},{}],3:[function(require,module,exports){
'use strict';

var _DDManager = require('./DDManager.js');

var _DDManager2 = _interopRequireDefault(_DDManager);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { 'default': obj };
}

window.ddManager = new _DDManager2['default']();

},{"./DDManager.js":1}]},{},[3]);
