import each from 'driveback-utils/each';
import { warn, error as errorLog } from 'driveback-utils/safeConsole';
import clone from 'driveback-utils/clone';
import { bind } from 'driveback-utils/eventListener';
import Integration from './Integration';

/**
 * @type {Object}
 * @private
 */
let _availableIntegrations;

let _initializeVersion;

let _integrationsPriority;

let _pageLoadTimeout;

/**
 * @type {Object}
 * @private
 */
let _integrations = {};

const IntegrationsLoader = {
  setAvailableIntegrations: (availableIntegrations) => {
    _availableIntegrations = availableIntegrations;
  },

  addIntegration: (name, integration, ddManager) => {
    if (!(integration instanceof Integration) || !name) {
      throw new TypeError('attempted to add an invalid integration');
    }

    integration.setName(name);
    integration.setDDManager(ddManager);

    _integrations[name] = integration;
  },

  getIntegration: name => _integrations[name],

  getIntegrations: () => _integrations,

  getIntegrationsByPriority: () => {
    const integrationsPriority = _integrationsPriority || {};
    let beforeList = integrationsPriority.before || [];
    const afterList = integrationsPriority.after || [];
    const beforeAndAfter = beforeList.concat(afterList);
    const allIntegrations = Object.keys(_integrations);
    const diff = allIntegrations.filter(x => beforeAndAfter.indexOf(x) === -1);
    // add integrations to beforeList if were not defined in before or after
    beforeList = beforeList.concat(diff);

    return (beforeList.concat(afterList))
      .map(integrationName => _integrations[integrationName])
      .filter(integration => !!integration); // check if integration is not undefined
  },

  initialize: (settings, ddManager) => {
    _initializeVersion = settings.version;
    _integrationsPriority = settings.integrationsPriority;
    _pageLoadTimeout = settings.pageLoadTimeout;

    const integrationSettings = settings.integrations;
    if (integrationSettings) {
      if (Array.isArray(integrationSettings)) {
        integrationSettings.forEach((integrationSetting) => {
          const { name } = integrationSetting;
          const options = clone(integrationSetting.options, true);
          if (typeof _availableIntegrations[name] === 'function') {
            const integration = new _availableIntegrations[name](ddManager.getDigitalData(), options || {});
            IntegrationsLoader.addIntegration(name, integration, ddManager);
          }
        });
      } else {
        each(integrationSettings, (name, options) => {
          if (typeof _availableIntegrations[name] === 'function') {
            try {
              const integration = new _availableIntegrations[name](ddManager.getDigitalData(), clone(options, true));
              IntegrationsLoader.addIntegration(name, integration, ddManager);
            } catch (e) {
              errorLog(e);
            }
          }
        });
      }
    }
  },

  initializeIntegration(integration) {
    if (integration.getOption('disabled')) return; // TODO: implement using conditions
    if (
      !integration.isLoaded()
      || integration.getOption('noConflict')
      || integration.allowNoConflictInitialization()
    ) {
      if (integration.initialize(_initializeVersion) !== false) {
        integration.setInitialized(true);
      }
    } else {
      warn(`Integration "${integration.getName()}" can't be initialized properly because of the conflict`);
    }
  },

  loadIntegration(integration) {
    if (!integration.isInitialized()) return;
    integration.flushEventQueue();
    if (!integration.isLoaded() && !integration.getOption('noConflict')) {
      integration.load(integration.onLoad);
    } else {
      integration.onLoad();
    }
    integration.onLoadInitiated();
  },

  queueIntegrationLoad: (integration) => {
    const integrationsPriority = _integrationsPriority || {};
    const afterList = integrationsPriority.after || [];
    const pageLoaded = window.document.readyState === 'complete';
    let integrationLoaded = false;

    if (afterList.indexOf(integration.getName()) >= 0 && !pageLoaded) {
      // set page load timeout
      const timeoutId = setTimeout(() => {
        if (integrationLoaded) return;
        integrationLoaded = true;
        IntegrationsLoader.loadIntegration(integration);
      }, _pageLoadTimeout || 3000);

      // wait for page load
      bind(window, 'load', () => {
        if (integrationLoaded) return;
        integrationLoaded = true;
        clearTimeout(timeoutId);
        IntegrationsLoader.loadIntegration(integration);
      });
    } else {
      IntegrationsLoader.loadIntegration(integration);
    }
  },

  reset: () => {
    each(_integrations, (name, integration) => {
      integration.removeAllListeners();
      integration.reset();
      integration.eventQueueFlushed = false;
    });
    _integrations = {};
  },
};

export default IntegrationsLoader;
