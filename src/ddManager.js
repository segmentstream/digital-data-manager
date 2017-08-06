import clone from './functions/clone';
import each from './functions/each';
import nextTick from 'async/nextTick';
import cleanObject from './functions/cleanObject';
import emitter from 'component-emitter';
import Integration from './Integration';
import EventManager from './EventManager';
import IntegrationsLoader from './IntegrationsLoader';
import EventDataEnricher from './enrichments/EventDataEnricher';
import DDHelper from './DDHelper';
import DigitalDataEnricher from './enrichments/DigitalDataEnricher';
import CustomEnricher from './enrichments/CustomEnricher';
import CustomScripts from './scripts/CustomScripts';
import Storage from './Storage';
import DDStorage from './DDStorage';
import CookieStorage from './CookieStorage';
import { isTestMode, logEnrichedIntegrationEvent, showTestModeOverlay } from './testMode';
import { VIEWED_PAGE, mapEvent } from './events/semanticEvents';
import { validateIntegrationEvent, trackValidationErrors } from './EventValidator';
import { enableErrorTracking } from './ErrorTracker';
import { error as errorLog } from './functions/safeConsole';
import { trackLink, trackImpression } from './trackers';

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
* @type {CustomEnricher}
* @private
*/
let _customEnricher;

/**
* @type {CustomScripts}
* @private
*/
let _customScripts;

/**
 * @type {DDStorage}
 * @private
 */
let _ddStorage;

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

function _trackIntegrationEvent(event, integration, trackValidationErrorsOption) {
  const [result, messages] = validateIntegrationEvent(event, integration);
  const integrationName = integration.getName();
  const isInitialized = integration.isInitialized();

  if (isTestMode()) {
    logEnrichedIntegrationEvent(event, integrationName, result, messages, isInitialized);
  }

  if (result && isInitialized) {
    integration.trackEvent(event);
  } else if (trackValidationErrorsOption) {
    trackValidationErrors(_digitalData, event, integrationName, messages);
  }
}

function _preparePageEvent(event, name) {
  const namedPageEvent = clone(event);
  namedPageEvent.name = `Viewed ${name} Page`;
  namedPageEvent.nonInteraction = true;
  return namedPageEvent;
}

function _trackIntegrationPageEvent(event, integration, trackValidationErrorsOption) {
  if (integration.trackNamedPages() || integration.trackCategorizedPages()) {
    _trackIntegrationEvent(clone(event), integration);
    if (integration.trackNamedPages() && event.page && event.page.name) {
      const namedPageEvent = _preparePageEvent(event, event.page.name);
      _trackIntegrationEvent(namedPageEvent, integration);
    }
    if (integration.trackCategorizedPages() && event.page && event.page.category) {
      const categorizedPageEvent = _preparePageEvent(event, event.page.category);
      _trackIntegrationEvent(categorizedPageEvent, integration, trackValidationErrorsOption);
    }
  } else {
    _trackIntegrationEvent(event, integration, trackValidationErrorsOption);
  }
}

function _addIntegrationsEventTracking(trackValidationErrorsOption) {
  _eventManager.addCallback(['on', 'event', (event) => {
    each(IntegrationsLoader.getIntegrations(), (integrationName, integration) => {
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
        try {
          const mappedEventName = mapEvent(event.name);
          if (integration.getIgnoredEvents().indexOf(mappedEventName) >= 0) {
            return;
          }
          if (integration.getSemanticEvents().indexOf(mappedEventName) < 0 && !integration.allowCustomEvents()) {
            return;
          }
          // important! cloned object is returned (not link)
          let integrationEvent = clone(event, true);
          integrationEvent.name = mappedEventName;
          integrationEvent = EventDataEnricher.enrichIntegrationData(integrationEvent, _digitalData, integration);
          if (integrationEvent.name === VIEWED_PAGE) {
            _trackIntegrationPageEvent(integrationEvent, integration);
          } else {
            _trackIntegrationEvent(integrationEvent, integration, trackValidationErrorsOption);
          }
        } catch (e) {
          errorLog(e);
        }
      }
    });
  }], true);
}

function _initializeCustomScripts(settings) {
  // initialize custom scripts
  _customScripts = new CustomScripts(_digitalData);
  _customScripts.import(settings.scripts);
  _customScripts.run();
  _eventManager.addCallback(['on', 'event', (event) => {
    _customScripts.run(event);
  }]);
}

function _initializeCustomEnrichments(settings) {
  _customEnricher = new CustomEnricher(_digitalData, _ddStorage);
  _customEnricher.import(settings.enrichments);
  _eventManager.addCallback(['on', 'beforeEvent', (event) => {
    if (event.name === VIEWED_PAGE) {
      _digitalDataEnricher.enrichDigitalData();
      _customEnricher.enrichDigitalData(_digitalData);
    }
    _customEnricher.enrichDigitalData(_digitalData, event);
  }]);
}

ddManager = {

  VERSION: '1.2.45',

  setAvailableIntegrations: (availableIntegrations) => {
    IntegrationsLoader.setAvailableIntegrations(availableIntegrations);
  },

  processEarlyStubCalls: (earlyStubsQueue) => {
    const earlyStubCalls = earlyStubsQueue || [];
    const methodCallPromise = (method, args) => () => {
      ddManager[method](...args);
    };

    while (earlyStubCalls.length > 0) {
      const args = earlyStubCalls.shift();
      const method = args.shift();
      if (ddManager[method]) {
        if (method === 'initialize' && earlyStubCalls.length > 0) {
          // run initialize stub after all other stubs
          nextTick(methodCallPromise(method, args));
        } else {
          ddManager[method](...args);
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
      trackValidationErrors: false,
      trackJsErrors: false,
    }, settings);

    if (_isReady) {
      throw new Error('ddManager is already initialized');
    }

    _prepareGlobals();

    if (settings.trackJsErrors) {
      enableErrorTracking(_digitalData);
    }

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

    // initialize event manager
    _eventManager = new EventManager(_digitalData, _ddListener);

    // initialize custom enrichments
    _initializeCustomEnrichments(settings);

    // import custom events
    _eventManager.import(settings.events);

    _eventManager.setSendViewedPageEvent(settings.sendViewedPageEvent);

    IntegrationsLoader.addIntegrations(settings.integrations, ddManager);
    IntegrationsLoader.initializeIntegrations(settings.version);
    IntegrationsLoader.loadIntegrations(settings.integrationsPriority, settings.pageLoadTimeout, () => {
      _isLoaded = true;
      ddManager.emit('load');
    });

    _addIntegrationsEventTracking(settings.trackValidationErrors);

    _initializeCustomScripts(settings);

    _isReady = true;
    ddManager.emit('ready');

    // initialize EventManager after emit('ready')
    // because EventManager startы firing events immediately
    _eventManager.initialize();

    if (isTestMode()) {
      showTestModeOverlay();
    }
  },

  isLoaded: () => _isLoaded,

  isReady: () => _isReady,

  addIntegration: (name, integration) => {
    if (_isReady) {
      throw new Error('Adding integrations after ddManager initialization is not allowed');
    }
    IntegrationsLoader.addIntegration(name, integration, ddManager);
  },

  getIntegration: name => IntegrationsLoader.getIntegration(name),

  get: key => DDHelper.get(key, _digitalData),

  persist: (key, exp) => _ddStorage.persist(key, exp),

  unpersist: key => _ddStorage.unpersist(key),

  getProduct: (id, skuCode) => DDHelper.getProduct(id, skuCode, _digitalData),

  getCampaign: id => DDHelper.getCampaign(id, _digitalData),

  getEventManager: () => _eventManager,

  getDigitalData() {
    return _digitalData;
  },

  trackLink: (elements, handler) => {
    trackLink(elements, handler);
  },

  trackImpression: (elements, handler) => {
    trackImpression(elements, handler);
  },

  addEnrichment: (type, prop, handler, options) => {
    _customEnricher.addEnrichment(type, prop, handler, options);
  },

  addEvent: (name, trigger, setting, handler) => {
    _eventManager.addEvent(name, trigger, setting, handler);
  },

  reset: () => {
    if (_ddStorage) {
      _ddStorage.clear();
    }

    if (_eventManager instanceof EventManager) {
      _eventManager.reset();
    }
    IntegrationsLoader.reset();
    ddManager.removeAllListeners();
    _eventManager = null;
    _isLoaded = false;
    _isReady = false;
  },

  Integration,
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
