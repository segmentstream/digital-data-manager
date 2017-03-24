import clone from './functions/clone';
import async from 'async';
import size from './functions/size';
import cleanObject from './functions/cleanObject';
import after from './functions/after';
import each from './functions/each';
import emitter from 'component-emitter';
import Integration from './Integration';
import EventManager from './EventManager';
import EventDataEnricher from './EventDataEnricher';
import ViewabilityTracker from './ViewabilityTracker';
import DDHelper from './DDHelper';
import DigitalDataEnricher from './DigitalDataEnricher';
import Storage from './Storage';
import DDStorage from './DDStorage';
import CookieStorage from './CookieStorage';
import { isTestMode, logEnrichedIntegrationEvent, showTestModeOverlay } from './testMode';
import { VIEWED_PAGE, mapEvent } from './events';
import { validateEvent } from './EventValidator';
import { warn } from './functions/safeConsole';

let ddManager;

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
 * @type {DigitalDataEnricher}
 * @private
 */
let _digitalDataEnricher;

/**
 * @type {DDStorage}
 * @private
 */
let _ddStorage;

/**
 * @type {Object}
 * @private
 */
let _integrations = {};

/**
 * @type {boolean}
 * @private
 */
let _isLoaded = false;

/**
 * @type {boolean}
 * @private
 */
let _isReady = false;

function _prepareGlobals() {
  if (typeof window.digitalData === 'object') {
    _digitalData = window.digitalData;
  } else {
    window.digitalData = _digitalData;
  }

  if (Array.isArray(window.ddListener)) {
    _ddListener = window.ddListener;
  } else {
    window.ddListener = _ddListener;
  }
}

function _addIntegrations(integrationSettings) {
  if (integrationSettings) {
    if (Array.isArray(integrationSettings)) {
      for (const integrationSetting of integrationSettings) {
        const name = integrationSetting.name;
        const options = clone(integrationSetting.options, true);
        if (typeof _availableIntegrations[name] === 'function') {
          const integration = new _availableIntegrations[name](_digitalData, options || {});
          ddManager.addIntegration(name, integration);
        }
      }
    } else {
      each(integrationSettings, (name, options) => {
        if (typeof _availableIntegrations[name] === 'function') {
          const integration = new _availableIntegrations[name](_digitalData, clone(options, true));
          ddManager.addIntegration(name, integration);
        }
      });
    }
  }
}

function _validateIntegrationEvent(event, integration) {
  const validations = integration.getEventValidations(event);
  if (validations.length) {
    return validateEvent(event, validations);
  }
}

function _trackIntegrationEvent(event, integration) {
  const validationResult = _validateIntegrationEvent(event, integration);
  if (isTestMode()) {
    logEnrichedIntegrationEvent(event, integration.getName(), validationResult);
  }

  if (!validationResult || !validationResult.errors.length) {
    integration.trackEvent(event);
  }
}

function _preparePageEvent(event, name) {
  const namedPageEvent = clone(event);
  namedPageEvent.name = `Viewed ${name} Page`;
  namedPageEvent.nonInteraction = true;
  return namedPageEvent;
}

function _trackIntegrationPageEvent(event, integration) {
  if (integration.trackNamedPages() || integration.trackCategorizedPages()) {
    _trackIntegrationEvent(clone(event), integration);
    if (integration.trackNamedPages() && event.page && event.page.name) {
      const namedPageEvent = _preparePageEvent(event, event.page.name);
      _trackIntegrationEvent(namedPageEvent, integration);
    }
    if (integration.trackCategorizedPages() && event.page && event.page.category) {
      const categorizedPageEvent = _preparePageEvent(event, event.page.category);
      _trackIntegrationEvent(categorizedPageEvent, integration);
    }
  } else {
    _trackIntegrationEvent(event, integration);
  }
}

function _addIntegrationsEventTracking() {
  _eventManager.addCallback(['on', 'event', (event) => {
    each(_integrations, (integrationName, integration) => {
      // TODO: add EventValidator library
      let trackEvent = false;
      const ex = event.excludeIntegrations;
      const inc = event.includeIntegrations;
      if (ex && inc) {
        return; // TODO: error
      }
      if ((ex && !Array.isArray(ex)) || (inc && !Array.isArray(inc))) {
        return; // TODO: error
      }

      if (inc) {
        if (inc.indexOf(integrationName) >= 0) {
          trackEvent = true;
        } else {
          trackEvent = false;
        }
      } else if (ex) {
        if (ex.indexOf(integrationName) < 0) {
          trackEvent = true;
        } else {
          trackEvent = false;
        }
      } else {
        trackEvent = true;
      }

      if (trackEvent) {
        const mappedEventName = mapEvent(event.name);
        if (
          integration.getSemanticEvents().indexOf(mappedEventName) < 0
          && !integration.allowCustomEvents()
        ) {
          return;
        }
        // important! cloned object is returned (not link)
        let integrationEvent = clone(event, true);
        integrationEvent.name = mappedEventName;
        integrationEvent = EventDataEnricher.enrichIntegrationData(integrationEvent, _digitalData, integration);
        if (integrationEvent.name === VIEWED_PAGE) {
          _trackIntegrationPageEvent(integrationEvent, integration);
        } else {
          _trackIntegrationEvent(integrationEvent, integration);
        }
      }
    });
  }], true);
}

function _initializeIntegrations(settings) {
  const version = settings.version;
  const onLoad = () => {
    _isLoaded = true;
    ddManager.emit('load');
  };

  if (settings && typeof settings === 'object') {
    // add integrations
    const integrationSettings = settings.integrations;
    _addIntegrations(integrationSettings);

    // initialize and load integrations
    const loaded = after(size(_integrations), onLoad);
    if (size(_integrations) > 0) {
      each(_integrations, (name, integration) => {
        if (!integration.isLoaded() || integration.getOption('noConflict')) {
          integration.once('load', loaded);
          integration.initialize(version);
        } else {
          warn(`Integration "${name}" can't be initialized properly because of the conflict`);
          loaded();
        }
      });
    } else {
      loaded();
    }

    // add event tracking
    _addIntegrationsEventTracking();
  }
}

ddManager = {

  VERSION: '1.2.22',

  setAvailableIntegrations: (availableIntegrations) => {
    _availableIntegrations = availableIntegrations;
  },

  processEarlyStubCalls: (earlyStubsQueue) => {
    const earlyStubCalls = earlyStubsQueue || [];
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
   */
  initialize: (settings) => {
    settings = Object.assign({
      domain: null,
      websiteMaxWidth: 'auto',
      sessionLength: 3600,
      sendViewedPageEvent: true,
      useCookieStorage: false,
    }, settings);

    if (_isReady) {
      throw new Error('ddManager is already initialized');
    }

    _prepareGlobals();

    let storage;
    if (settings.useCookieStorage) {
      storage = new CookieStorage(cleanObject({
        cookieDomain: settings.cookieDomain,
      }));
    } else {
      storage = new Storage();
    }

    _ddStorage = new DDStorage(_digitalData, storage);

    // initialize digital data enricher
    _digitalDataEnricher = new DigitalDataEnricher(_digitalData, _ddListener, _ddStorage, {
      sessionLength: settings.sessionLength,
    });
    _digitalDataEnricher.enrichDigitalData();

    // initialize event manager
    _eventManager = new EventManager(_digitalData, _ddListener);
    _eventManager.setSendViewedPageEvent(settings.sendViewedPageEvent);
    _eventManager.setViewabilityTracker(new ViewabilityTracker({
      websiteMaxWidth: settings.websiteMaxWidth,
    }));

    _initializeIntegrations(settings);

    _isReady = true;
    ddManager.emit('ready');

    // initialize EventManager after emit('ready')
    // because EventManager startы firing events immediately
    _eventManager.initialize();

    if (isTestMode()) {
      showTestModeOverlay();
    }
  },

  isLoaded: () => {
    return _isLoaded;
  },

  isReady: () => {
    return _isReady;
  },

  addIntegration: (name, integration) => {
    if (_isReady) {
      throw new Error('Adding integrations after ddManager initialization is not allowed');
    }

    if (!integration instanceof Integration || !name) {
      throw new TypeError('attempted to add an invalid integration');
    }

    integration.setName(name);
    integration.setDDManager(ddManager);

    _integrations[name] = integration;
  },

  getIntegration: (name) => {
    return _integrations[name];
  },

  get: (key) => {
    return DDHelper.get(key, _digitalData);
  },

  persist: (key, exp) => {
    return _ddStorage.persist(key, exp);
  },

  unpersist: (key) => {
    return _ddStorage.unpersist(key);
  },

  getProduct: (id) => {
    return DDHelper.getProduct(id, _digitalData);
  },

  getCampaign: (id) => {
    return DDHelper.getCampaign(id, _digitalData);
  },

  getEventManager: () => {
    return _eventManager;
  },

  reset: () => {
    if (_ddStorage) {
      _ddStorage.clear();
    }

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
    _isLoaded = false;
    _isReady = false;
  },

  Integration: Integration,
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
  } else if (event === 'load') {
    if (_isLoaded) {
      handler();
      return;
    }
  }

  originalOn.call(ddManager, event, handler);
};

export default ddManager;
