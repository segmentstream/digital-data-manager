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
 * @type {Object}
 * @private
 */
let _availableIntegrations;

/**
 * @type {EventManager}
 * @private
 */
let _eventManager;

/**
 * @type {Object}
 * @private
 */
let _integrations = {};


/**
 * @type {boolean}
 * @private
 */
let _isInitialized = false;

/**
 * @type {boolean}
 * @private
 */
let _isReady = false;

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


const ddManager = {

  setAvailableIntegrations: (availableIntegrations) => {
    _availableIntegrations = availableIntegrations;
  },

  processEarlyStubCalls: () => {
    const earlyStubCalls = window[_ddManagerNamespace] || [];
    while (earlyStubCalls.length > 0) {
      const args = earlyStubCalls.shift();
      const method = args.shift();
      if (ddManager[method]) {
        ddManager[method].apply(undefined, args);
      }
    }
  },

  /**
   * Initialize Digital Data Manager
   * @param settings
   *
   * Example:
   *
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
  initialize: (settings) => {
    if (_isInitialized) {
      throw new Error('ddManager is already initialized');
    }

    _prepareGlobals();

    _eventManager = new EventManager(_digitalData, _ddListener);

    if (settings && typeof settings === 'object') {
      const integrationSettings = settings.integrations;
      if (integrationSettings) {
        each(integrationSettings, (name, options) => {
          const integration = new _availableIntegrations[name](_digitalData, clone(options));
          ddManager.addIntegration(integration);
        });
      }
    }

    const ready = after(size(_integrations), () => {
      _eventManager.initialize();
      _isReady = true;
      ddManager.emit('ready');
    });

    if (size(_integrations) > 0) {
      each(_integrations, (name, integration) => {
        integration.once('ready', ready);
        integration.initialize();
        // add event listeners for integration
        _eventManager.addCallback(['on', 'event', integration.trackEvent]);
      });
    } else {
      ready();
    }

    _isInitialized = true;
    ddManager.emit('initialize', settings);
  },

  isInitialized: () => {
    return _isInitialized;
  },

  addIntegration: (integration) => {
    if (_isInitialized) {
      throw new Error('Adding integrations after ddManager initialization is not allowed');
    }

    if (!integration instanceof Integration || !integration.getName()) {
      throw new TypeError('attempted to add an invalid integration');
    }
    const name = integration.getName();
    _integrations[name] = integration;
  },

  getIntegration: (name) => {
    return _integrations[name];
  },

  reset: () => {
    if (_eventManager instanceof EventManager) {
      _eventManager.reset();
    }
    _eventManager = null;
    _integrations = {};
    _isInitialized = false;
  }
};

export default EventEmitter(ddManager);
