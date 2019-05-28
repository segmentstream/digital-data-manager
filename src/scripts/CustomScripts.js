import { bind } from 'driveback-utils/eventListener';
import CustomScript from './CustomScript';

let storage = {};

class CustomScripts {
  constructor(digitalData, pageLoadTimeout) {
    this.digitalData = digitalData;
    this.pageLoadTimeout = pageLoadTimeout;
  }

  import(scriptsConfig) {
    scriptsConfig = scriptsConfig || [];
    scriptsConfig.sort((config1, config2) => {
      let priority1 = config1.priority || 0;
      let priority2 = config2.priority || 0;
      if (!config1.event) priority1 += 1; // support legacy
      if (!config2.event) priority2 += 1; // support legacy
      if (priority1 === priority2) return 0;
      return (priority1 < priority2) ? 1 : -1;
    });
    scriptsConfig.forEach((scriptConfig) => {
      let eventName = scriptConfig.event;
      let { fireOnce } = scriptConfig;
      if (!eventName) {
        eventName = 'Viewed Page'; // support legacy
        fireOnce = true;
      }
      const customScript = new CustomScript(
        scriptConfig.name,
        eventName,
        scriptConfig.handler,
        fireOnce,
        scriptConfig.runAfterPageLoaded,
        this.digitalData,
      );

      this.prepareCollection(eventName).push(customScript);
    });
  }

  prepareCollection(event) {
    if (!storage[event]) {
      storage[event] = [];
    }
    return storage[event];
  }

  run(event) {
    if (event.stopPropagation) return;

    const customScripts = storage[event.name] || [];

    customScripts.forEach((customScript) => {
      const pageLoaded = window.document.readyState === 'complete';
      if (customScript.runAfterPageLoaded && !pageLoaded) {
        // set page load timeout
        const timeoutId = setTimeout(() => {
          customScript.run(event);
        }, this.pageLoadTimeout || 3000);

        // wait for page load
        bind(window, 'load', () => {
          clearTimeout(timeoutId);
          customScript.run(event);
        });
      } else {
        customScript.run(event);
      }
    });
  }

  reset() {
    storage = {};
  }
}

export default CustomScripts;
