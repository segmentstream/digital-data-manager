import EventManager from './EventManager.js';

let _digitalDataNamespace = 'digitalData';
let _ddListenerNamespace = 'ddListener';
let _digitalData = {};
let _ddListener = [];

function _prepareGlobals() {
  window[_digitalDataNamespace] = window[_digitalDataNamespace] || {};
  window[_digitalDataNamespace].events = window[_digitalDataNamespace].events || [];
  window[_ddListenerNamespace] = window[_ddListenerNamespace] || [];
}

class DigitalDataHelper {

  constructor(digitalDataNamespace, ddListenerNamespace) {
    _digitalDataNamespace = digitalDataNamespace || 'digitalData';
    _ddListenerNamespace = ddListenerNamespace || 'ddListener';

    _prepareGlobals();

    _digitalData = window[_digitalDataNamespace] || _digitalData;
    _ddListener = window[_ddListenerNamespace] || _ddListener;

    this.eventManager = new EventManager(_digitalData, _ddListener);
    this.eventManager.init();
  }

  test() {
    return this.digitalData;
  }

}

export default DigitalDataHelper;
