import clone from 'driveback-utils/clone';
import nextTick from 'async/nextTick';
import cleanObject from 'driveback-utils/cleanObject';
import emitter from 'component-emitter';
import { error as errorLog } from 'driveback-utils/safeConsole';
import { getProp } from 'driveback-utils/dotProp';
import Integration from './Integration';
import EventManager from './EventManager';
import IntegrationsLoader from './IntegrationsLoader';
import EventDataEnricher from './enrichments/EventDataEnricher';
import DDHelper from './DDHelper';
import DigitalDataEnricher from './enrichments/DigitalDataEnricher';
import CustomEnrichments from './enrichments/CustomEnrichments';
import CustomScripts from './scripts/CustomScripts';
import Storage from './Storage';
import DDStorage from './DDStorage';
import CookieStorage from './CookieStorage';
import { isTestMode, showTestModeMessage } from './testMode';
import { VIEWED_PAGE, mapEvent } from './events/semanticEvents';
import { validateIntegrationEvent, trackValidationErrors } from './EventValidator';
import { enableErrorTracking } from './ErrorTracker';
import { trackLink, trackImpression } from './trackers';
import DDManagerStreaming from './integrations/DDManagerStreaming';
import ConsentManager from './ConsentManager';

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

  // if (isTestMode()) {
  //   logEnrichedIntegrationEvent(event, integrationName, result, messages, isInitialized);
  // }

  if (result && isInitialized) {
    integration.pushEventQueue(event);
  } else if (trackValidationErrorsOption) {
    trackValidationErrors(_digitalData, event, integrationName, messages);
  }
}

function _shouldTrackEvent(event, integrationName) {
  if (!ConsentManager.isConsentObtained()) return false;

  const ex = event.excludeIntegrations;
  const inc = event.includeIntegrations;

  if (ex && inc) return false; // TODO: error
  if ((ex && !Array.isArray(ex)) || (inc && !Array.isArray(inc))) return false; // TODO: error

  if (inc) {
    if (inc.indexOf(integrationName) >= 0) return true;
    return false;
  }
  if (ex) {
    if (ex.indexOf(integrationName) < 0) return true;
    return false;
  }
  return true;
}

function _initializeIntegrations(settings) {
  _eventManager.addCallback(['on', 'event', (event) => {
    const mappedEventName = mapEvent(event.name);

    const integrations = IntegrationsLoader.getIntegrationsByPriority();
    // initialization circle (only for "Viewed Page" event)
    if (mappedEventName === VIEWED_PAGE) {
      integrations.forEach((integration) => {
        if (integration.isInitialized()) return;
        const integrationName = integration.getName();
        if (_shouldTrackEvent(event, integrationName)) {
          try {
            if (integration.getIgnoredEvents().indexOf(mappedEventName) >= 0) return;
            let integrationEvent = clone(event, true);
            integrationEvent.name = mappedEventName;
            integrationEvent = EventDataEnricher.enrichIntegrationData(
              integrationEvent, _digitalData, integration,
            );
            if (!integrationEvent.name || integrationEvent.ignore) return;

            // initialize integration if all checks passed
            IntegrationsLoader.initializeIntegration(integration);
            /* TO-DO: remove ignorePriorities after the test is finished 09-01-2019 */
            const ignorePriorities = settings.prioritiesTest
              && settings.prioritiesTestVar
              && getProp(_digitalData, settings.prioritiesTestVar) === 1;
            IntegrationsLoader.queueIntegrationLoad(integration, ignorePriorities);
          } catch (e) {
            errorLog(e);
          }
        }
      });
    }

    // events tracking circle
    integrations.forEach((integration) => {
      const integrationName = integration.getName();
      if (_shouldTrackEvent(event, integrationName)) {
        try {
          if (integration.getIgnoredEvents().indexOf(mappedEventName) >= 0) return;
          if (
            integration.getSemanticEvents().indexOf(mappedEventName) < 0
            && !integration.allowCustomEvents()
          ) {
            return;
          }
          // important! cloned object is returned (not link)
          let integrationEvent = clone(event, true);
          integrationEvent.name = mappedEventName;
          integrationEvent = EventDataEnricher.enrichIntegrationData(
            integrationEvent, _digitalData, integration,
          );
          if (!integrationEvent.name || integrationEvent.ignore) return;
          _trackIntegrationEvent(integrationEvent, integration, settings.trackValidationErrors);
        } catch (e) {
          errorLog(e);
        }
      }
    });
  }, true]);
}

function _initializeCustomScripts(settings) {
  // initialize custom scripts
  _customScripts = new CustomScripts(_digitalData);
  _customScripts.import(settings.scripts);
  _eventManager.addCallback(['on', 'event', (event) => {
    _customScripts.run(event);
  }], true);
}

function _initializeCustomEvents(settings) {
  _eventManager.import(settings.events);
}

function _initializeCustomEnrichments(settings) {
  _customEnricher = new CustomEnrichments(_digitalData, _ddStorage);
  _customEnricher.import(settings.enrichments);
  _eventManager.addCallback(['on', 'beforeEvent', (event) => {
    if (event.name === VIEWED_PAGE) {
      _digitalDataEnricher.enrichDigitalData();
    }
    _customEnricher.enrichDigitalData(_digitalData, event, true);
  }]);
  _eventManager.addCallback(['on', 'event', (event) => {
    _customEnricher.enrichDigitalData(_digitalData, event, false);
  }]);
}

const ddManager = {

  VERSION: '1.2.192',

  setConsent: ConsentManager.setConsent,
  getConsent: ConsentManager.getConsent,

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
      enableMonitoring: true,
      cookieConsent: 'none',
      unpersistContextCampaignOnTransaction: true,
    }, settings);

    if (_isReady) {
      throw new Error('ddManager is already initialized');
    }

    _prepareGlobals();

    if (settings.trackJsErrors) {
      enableErrorTracking(_digitalData);
    }

    const localStorage = new Storage();
    const cookieStorage = new CookieStorage(cleanObject({
      cookieDomain: settings.cookieDomain,
    }));
    if (settings.useCookieStorage || !localStorage.isEnabled()) {
      _ddStorage = new DDStorage(_digitalData, cookieStorage, localStorage);
    } else {
      _ddStorage = new DDStorage(_digitalData, localStorage, cookieStorage);
    }

    ConsentManager.initialize(settings.cookieConsent, _digitalData, _ddStorage);

    // initialize digital data enricher
    _digitalDataEnricher = new DigitalDataEnricher(_digitalData, _ddListener, _ddStorage, {
      sessionLength: settings.sessionLength,
      unpersistContextCampaignOnTransaction: settings.unpersistContextCampaignOnTransaction,
    });

    // initialize event manager
    _eventManager = new EventManager(_digitalData, _ddListener);
    _eventManager.setSendViewedPageEvent(settings.sendViewedPageEvent);

    // initialize custom enrichments
    _initializeCustomEnrichments(settings);

    // import custom events
    _initializeCustomEvents(settings);

    IntegrationsLoader.initialize(settings, ddManager);
    let streaming = IntegrationsLoader.getIntegration('DDManager Streaming');
    if (!streaming && settings.enableMonitoring) {
      try {
        streaming = new DDManagerStreaming(_digitalData, { internal: true });
        IntegrationsLoader.addIntegration('DDManager Streaming', streaming, ddManager);
      } catch (e) {
        errorLog(e);
      }
    }
    if (streaming) {
      streaming.setOption('projectId', settings.projectId);
      streaming.setOption('projectName', settings.projectName);
      streaming.setOption('buildNumber', settings.buildNumber);
      streaming.setOption('library', {
        name: 'ddmanager.js',
        version: ddManager.VERSION,
      });
    }

    _initializeIntegrations(settings);

    // initialize custom scripts
    _initializeCustomScripts(settings);

    _isReady = true;
    ddManager.emit('ready');

    // initialize EventManager after emit('ready')
    // because EventManager starts firing events immediately
    _eventManager.initialize();

    if (isTestMode()) {
      try {
        showTestModeMessage();
      } catch (e) {
        errorLog(e);
      }
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

  trackLink: (elements, handler, followLink = true) => {
    trackLink(elements, handler, followLink);
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

    if (_customEnricher) {
      _customEnricher.reset();
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
