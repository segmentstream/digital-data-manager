require("babel-polyfill");

import EventManager from './EventManager.js';

let _digitalDataNamespace = 'digitalData';
let _ddListenerNamespace = 'ddListener';
let _digitalData = {};
let _ddListener = [];
let _global = window;

function _prepareGlobals() {
  if (typeof _global[_digitalDataNamespace] === 'object') {
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

class DDManager {

  constructor(digitalDataNamespace, ddListenerNamespace, global) {
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

    this.eventManager = new EventManager(_digitalData, _ddListener);
    this.eventManager.init();
  }

}

export default DDManager;