import clone from './functions/clone.js';
import size from './functions/size.js';
import after from './functions/after.js';
import each from './functions/each.js';
import Integration from './Integration.js';
import EventManager from './EventManager.js';
import EventEmitter from 'component-emitter';


/**
 * @type {string}
 * @private
 */
const _digitalDataNamespace = 'digitalData';

/**
 * @type {string}
 * @private
 */
const _ddListenerNamespace = 'ddListener';

/**
 * @type {string}
 * @private
 */
const _ddManagerNamespace = 'ddManager';

/**
 * @type {Object}
 * @private
 */
let _digitalData = {};

/**
 * @type {Array}
 * @private
 */
let _ddListener = [];

/**
 * @type Map
 * @private
 */
let _availableIntegrations;

function _prepareGlobals() {
  if (typeof window[_digitalDataNamespace] === 'object') {
    _digitalData = window[_digitalDataNamespace];
  } else {
    window[_digitalDataNamespace] = _digitalData;
  }

  if (Array.isArray(window[_ddListenerNamespace])) {
    _ddListener = window[_ddListenerNamespace];
  } else {
    window[_ddListenerNamespace] = _ddListener;
  }

  if (!Array.isArray(_digitalData.events)) {
    _digitalData.events = [];
  }
}


class DDManager extends EventEmitter {

  constructor() {
    super();

    this.integrations = {};
    this.isInitialized = false;
    this.isReady = false;
    this.earlyStubCalls = window[_ddManagerNamespace] || [];

    _prepareGlobals();

    this.eventManager = new EventManager(_digitalData, _ddListener);
    this.eventManager.initialize();
  }

  static setAvailableIntegrations(availableIntegrations) {
    _availableIntegrations = availableIntegrations;
  }

  processEarlyStubCalls() {
    while (this.earlyStubCalls.length > 0) {
      const args = this.earlyStubCalls.shift();
      const method = args.shift();
      if (this[method]) {
        this[method].apply(this, args);
      }
    }
  }

  /**
   * Initialize Digital Data Manager
   * @param settings
   * {
   *    integrations: {
   *      'Google Tag Manager': {
   *        containerId: 'XXX'
   *      },
   *      'Google Analytics': {
   *        trackingId: 'XXX'
   *      }
   *    }
   * }
   */
  initialize(settings) {
    if (settings && typeof settings === 'object') {
      const integrationSettings = settings.integrations;
      if (integrationSettings) {
        each(integrationSettings, (name, options) => {
          const integration = new _availableIntegrations[name](clone(options));
          this.addIntegration(integration);
        });
      }
    }

    const ready = after(size(this.integrations), () => {
      this.isReady = true;
      this.emit('ready');
    });

    each(this.integrations, (name, integration) => {
      integration.once('ready', ready);
      integration.initialize();
    });

    this.isInitialized = true;
    this.emit('initialize', settings);

    return this;
  }

  addIntegration(integration) {
    if (!integration instanceof Integration || !integration.getName()) {
      throw new TypeError('attempted to add an invalid integration');
    }
    const name = integration.getName();
    this.integrations[name] = integration;
  }

  reset() {
    this.integrations = [];
  }
}

export default DDManager;
