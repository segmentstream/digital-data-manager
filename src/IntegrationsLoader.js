import size from 'driveback-utils/size';
import each from 'driveback-utils/each';
import after from 'driveback-utils/after';
import { warn } from 'driveback-utils/safeConsole';
import Integration from './Integration';
import clone from 'driveback-utils/clone';
import { bind } from 'driveback-utils/eventListener';

/**
 * @type {Object}
 * @private
 */
let _availableIntegrations;

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

  getIntegrations: () => {
    return _integrations;
  },

  addIntegrations: (integrationSettings, ddManager) => {
    if (integrationSettings) {
      if (Array.isArray(integrationSettings)) {
        for (const integrationSetting of integrationSettings) {
          const name = integrationSetting.name;
          const options = clone(integrationSetting.options, true);
          if (typeof _availableIntegrations[name] === 'function') {
            const integration = new _availableIntegrations[name](ddManager.getDigitalData(), options || {});
            IntegrationsLoader.addIntegration(name, integration, ddManager);
          }
        }
      } else {
        each(integrationSettings, (name, options) => {
          if (typeof _availableIntegrations[name] === 'function') {
            const integration = new _availableIntegrations[name](ddManager.getDigitalData(), clone(options, true));
            IntegrationsLoader.addIntegration(name, integration, ddManager);
          }
        });
      }
    }
  },

  initializeIntegrations(version) {
    // initialize integrations
    if (size(_integrations) > 0) {
      each(_integrations, (name, integration) => {
        if (
          !integration.isLoaded()
          || integration.getOption('noConflict')
          || integration.allowNoConflictInitialization()
        ) {
          integration.initialize(version);
          integration.setInitialized(true);
        } else {
          warn(`Integration "${name}" can't be initialized properly because of the conflict`);
        }
      });
    }
  },

  loadIntegrations: (integrationsPriority, pageLoadTimeout, callback) => {
    integrationsPriority = integrationsPriority || {};

    let beforeList = integrationsPriority.before || [];
    const afterList = integrationsPriority.after || [];
    const beforeAndAfter = beforeList.concat(afterList);
    const allIntegrations = Object.keys(_integrations);
    const diff = allIntegrations.filter(x => beforeAndAfter.indexOf(x) === -1);

    // add integrations to beforeList if were not defined in before or after
    beforeList = beforeList.concat(diff);
    const onLoad = () => {
      callback();
    };
    const loaded = after(size(_integrations), onLoad);

    // before
    IntegrationsLoader.loadIntegrationsFromList(beforeList, loaded);

    // after
    const pageLoaded = window.document.readyState === 'complete';
    let integrationsLoaded = false;

    if (!pageLoaded) {
      // set page load timeout
      const timeoutId = setTimeout(() => {
        if (integrationsLoaded) return;
        integrationsLoaded = true;
        IntegrationsLoader.loadIntegrationsFromList(afterList, loaded);
      }, pageLoadTimeout || 3000);

      // wait for page load
      bind(window, 'load', () => {
        if (integrationsLoaded) return;
        integrationsLoaded = true;
        clearTimeout(timeoutId);
        IntegrationsLoader.loadIntegrationsFromList(afterList, loaded);
      });
    } else {
      IntegrationsLoader.loadIntegrationsFromList(afterList, loaded);
    }
  },

  loadIntegrationsFromList(list, loaded) {
    for (const integrationName of list) {
      IntegrationsLoader.loadIntegration(integrationName, loaded);
    }
  },

  loadIntegration(integrationName, callback) {
    if (_integrations[integrationName]) {
      const integration = _integrations[integrationName];
      integration.flushEventQueue();
      if (!integration.isLoaded()) {
        integration.load(integration.onLoad);
        integration.once('load', callback);
      } else {
        integration.onLoad();
        callback();
      }
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
