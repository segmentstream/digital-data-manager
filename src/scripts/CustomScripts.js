import CustomScript from './CustomScript';

const SCRIPT_TRIGGER_EVENT = 'event';
const SCRIPT_TRIGGER_INIT = 'init';

const storage = {
  [SCRIPT_TRIGGER_INIT]: [],
  [SCRIPT_TRIGGER_EVENT]: {},
};

class CustomScripts {
  constructor(digitalData) {
    this.digitalData = digitalData;
  }

  import(scriptsConfig) {
    scriptsConfig = scriptsConfig || [];
    for (const scriptConfig of scriptsConfig) {
      const eventName = scriptConfig.event;
      const customScript = new CustomScript(
        scriptConfig.name,
        eventName,
        scriptConfig.handler,
        this.digitalData,
      );

      if (!eventName) {
        this.prepareCollection(SCRIPT_TRIGGER_INIT).push(customScript);
      } else {
        this.prepareCollection(SCRIPT_TRIGGER_EVENT, eventName).push(customScript);
      }
    }
  }

  prepareCollection(trigger, event) {
    if (trigger === SCRIPT_TRIGGER_EVENT) {
      if (!storage[trigger][event]) {
        storage[trigger][event] = [];
      }
      return storage[trigger][event];
    }
    return storage[trigger];
  }

  run(event) {
    let customScripts;
    if (event) {
      customScripts = storage[SCRIPT_TRIGGER_EVENT][event.name] || [];
    } else {
      customScripts = storage[SCRIPT_TRIGGER_INIT] || [];
    }
    for (const customScript of customScripts) {
      customScript.run(event);
    }
  }

  reset() {
    storage[SCRIPT_TRIGGER_INIT] = [];
    storage[SCRIPT_TRIGGER_EVENT] = {};
  }
}

export default CustomScripts;
