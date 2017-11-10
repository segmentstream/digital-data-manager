import CustomScript from './CustomScript';

let storage = {};

class CustomScripts {
  constructor(digitalData) {
    this.digitalData = digitalData;
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
      let fireOnce = scriptConfig.fireOnce;
      if (!eventName) {
        eventName = 'Viewed Page'; // support legacy
        fireOnce = true;
      }
      const customScript = new CustomScript(
        scriptConfig.name,
        eventName,
        scriptConfig.handler,
        fireOnce,
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
      customScript.run(event);
    });
  }

  reset() {
    storage = {};
  }
}

export default CustomScripts;
