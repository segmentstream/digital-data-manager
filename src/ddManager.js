import clone from 'component-clone';
import async from 'async';
import size from './functions/size.js';
import after from './functions/after.js';
import each from './functions/each.js';
import emitter from 'component-emitter';
import Integration from './Integration.js';
import EventManager from './EventManager.js';
import AutoEvents from './AutoEvents.js';
import DDHelper from './DDHelper.js';
import DigitalDataEnricher from './DigitalDataEnricher.js';
import Storage from './Storage.js';

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
 * @type {Storage}
 * @private
 */
let _storage;

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

  _digitalData.page = _digitalData.page || {};
  _digitalData.user = _digitalData.user || {};
  _digitalData.context = _digitalData.context || {};
  if (!_digitalData.page.type || _digitalData.page.type !== 'confirmation') {
    _digitalData.cart = _digitalData.cart || {};
  }

  if (Array.isArray(window[_ddListenerNamespace])) {
    _ddListener = window[_ddListenerNamespace];
  } else {
    window[_ddListenerNamespace] = _ddListener;
  }
}

const ddManager = {

  VERSION: '1.0.7',

  setAvailableIntegrations: (availableIntegrations) => {
    _availableIntegrations = availableIntegrations;
  },

  processEarlyStubCalls: () => {
    const earlyStubCalls = window[_ddManagerNamespace] || [];
    const methodCallPromise = (method, args) => {
      return () => {
        ddManager[method].apply(ddManager, args);
      };
    };

    while (earlyStubCalls.length > 0) {
      const args = earlyStubCalls.shift();
      const method = args.shift();
      if (ddManager[method]) {
        if (method === 'initialize' && earlyStubCalls.length > 0) {
          // run initialize stub after all other stubs
          async.nextTick(methodCallPromise(method, args));
        } else {
          ddManager[method].apply(ddManager, args);
        }
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
   *    autoEvents: {
   *      trackDOMComponents: {
   *        maxWebsiteWidth: 1024
   *      }
   *    },
   *    domain: 'example.com',
   *    sessionLength: 3600,
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
    settings = Object.assign({
      domain: null,
      autoEvents: {
        trackDOMComponents: false,
      },
      sessionLength: 3600,
    }, settings);

    if (_isInitialized) {
      throw new Error('ddManager is already initialized');
    }

    _prepareGlobals();

    // initialize storage
    _storage = new Storage({
      cookieDomain: settings.domain,
    });

    // initialize digital data enricher
    const digitalDataEnricher = new DigitalDataEnricher(_digitalData, _storage, {
      sessionLength: settings.sessionLength,
    });
    digitalDataEnricher.enrichDigitalData();

    // initialize event manager
    _eventManager = new EventManager(_digitalData, _ddListener);
    if (settings.autoEvents !== false) {
      _eventManager.setAutoEvents(new AutoEvents(settings.autoEvents));
    }

    if (settings && typeof settings === 'object') {
      const integrationSettings = settings.integrations;
      if (integrationSettings) {
        each(integrationSettings, (name, options) => {
          if (typeof _availableIntegrations[name] === 'function') {
            const integration = new _availableIntegrations[name](_digitalData, clone(options));
            ddManager.addIntegration(integration);
          }
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
        if (!integration.isLoaded() || integration.getOption('noConflict')) {
          integration.once('ready', ready);
          integration.initialize();
        } else {
          ready();
        }
        // add event listeners for integration
        _eventManager.addCallback(['on', 'event', (event) => {
          integration.trackEvent(event);
        }]);
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

  isReady: () => {
    return _isReady;
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

  get: (key) => {
    return DDHelper.get(key, _digitalData);
  },

  getProduct: (id) => {
    return DDHelper.getProduct(id, _digitalData);
  },

  getCampaign: (id) => {
    return DDHelper.getCampaign(id, _digitalData);
  },

  reset: () => {
    if (_eventManager instanceof EventManager) {
      _eventManager.reset();
    }
    each(_integrations, (name, integration) => {
      integration.removeAllListeners();
      integration.reset();
    });
    ddManager.removeAllListeners();
    _eventManager = null;
    _integrations = {};
    _isInitialized = false;
    _isReady = false;
  },

};

emitter(ddManager);

// fire ready and initialize event immediately
// if ddManager is already ready or initialized
const originalOn = ddManager.on;
ddManager.on = ddManager.addEventListener = (event, handler) => {
  if (event === 'ready') {
    if (_isReady) {
      handler();
      return;
    }
  } else if (event === 'initialize') {
    if (_isInitialized) {
      handler();
      return;
    }
  }

  originalOn.call(ddManager, event, handler);
};

export default ddManager;
