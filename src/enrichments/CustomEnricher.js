import CustomEnrichmentsCollection from './CustomEnrichmentsCollection';

const ENRICHMENT_TYPE_DIGITAL_DATA = 'digitalData';

const ENRICHMENT_TRIGGER_EVENT = 'event';
const ENRICHMENT_TRIGGER_INIT = 'init';

const storage = {
  [ENRICHMENT_TYPE_DIGITAL_DATA]: {
    [ENRICHMENT_TRIGGER_INIT]: undefined,
    [ENRICHMENT_TRIGGER_EVENT]: {},
  },
};

const prepareCollection = (type, trigger, event) => {
  if (trigger === ENRICHMENT_TRIGGER_EVENT) {
    if (!storage[type][trigger][event]) {
      storage[type][trigger][event] = new CustomEnrichmentsCollection(type, trigger, event);
    }
    return storage[type][trigger][event];
  }
  if (!storage[type][trigger]) {
    storage[type][trigger] = new CustomEnrichmentsCollection(type, trigger);
  }
  return storage[type][trigger];
};

const checkEnrichment = (enrichment) => {
  return (
    typeof enrichment === 'object' &&
    typeof enrichment.handler === 'function' &&
    typeof enrichment.prop === 'string'
  );
};

class CustomEnrichments {
  constructor(ddStorage) {
    this.ddStorage = ddStorage;
  }

  import(enrichments) {
    if (!enrichments || !Array.isArray(enrichments)) return;
    for (const config of enrichments) {
      if (!checkEnrichment(config)) continue;
      this.addEnrichment(config.type, config.prop, config.handler, config.options);
    }
  }

  addEnrichment(type, prop, handler, options) {
    options = options || {};
    const events = options.events || [];
    const enrichment = { prop, handler, options };
    let collection;
    if (events.length === 0) {
      collection = prepareCollection(type, ENRICHMENT_TRIGGER_INIT);
    } else {
      for (const eventName of events) {
        collection = prepareCollection(type, ENRICHMENT_TRIGGER_EVENT, eventName);
      }
    }
    collection.addEnrichment(enrichment, this.ddStorage);
  }

  enrichDigitalData(digitalData, event = null) {
    let collection;
    if (!event) {
      collection = prepareCollection(ENRICHMENT_TYPE_DIGITAL_DATA, ENRICHMENT_TRIGGER_INIT);
    } else {
      const eventName = event.name;
      collection = prepareCollection(ENRICHMENT_TYPE_DIGITAL_DATA, ENRICHMENT_TRIGGER_EVENT, eventName);
    }
    collection.enrich(digitalData, [event]);
  }

  reset() {
    storage[ENRICHMENT_TYPE_DIGITAL_DATA] = {
      [ENRICHMENT_TRIGGER_INIT]: undefined,
      [ENRICHMENT_TRIGGER_EVENT]: {},
    };
  }
}

export default CustomEnrichments;
