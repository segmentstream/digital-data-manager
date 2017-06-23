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

const checkEnrichment = (enrichment) => {
  return (
    typeof enrichment === 'object' &&
    typeof enrichment.handler === 'function' &&
    typeof enrichment.prop === 'string'
  );
};

class CustomEnrichments {
  constructor(digitalData, ddStorage) {
    this.ddStorage = ddStorage;
    this.digitalData = digitalData;
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
      collection = this.prepareCollection(type, ENRICHMENT_TRIGGER_INIT);
    } else {
      for (const eventName of events) {
        collection = this.prepareCollection(type, ENRICHMENT_TRIGGER_EVENT, eventName);
      }
    }
    collection.addEnrichment(enrichment, this.ddStorage);
  }

  enrichDigitalData(digitalData, event = null) {
    let collection;
    if (!event) {
      collection = this.prepareCollection(ENRICHMENT_TYPE_DIGITAL_DATA, ENRICHMENT_TRIGGER_INIT);
      collection.enrich(digitalData, [event], true);
    } else {
      const eventName = event.name;
      collection = this.prepareCollection(ENRICHMENT_TYPE_DIGITAL_DATA, ENRICHMENT_TRIGGER_EVENT, eventName);
      collection.enrich(digitalData, [event]);
    }
  }

  prepareCollection(type, trigger, event) {
    if (trigger === ENRICHMENT_TRIGGER_EVENT) {
      if (!storage[type][trigger][event]) {
        storage[type][trigger][event] = this.newCollection(type, trigger, event);
      }
      return storage[type][trigger][event];
    }
    if (!storage[type][trigger]) {
      storage[type][trigger] = this.newCollection(type, trigger);
    }
    return storage[type][trigger];
  }

  newCollection(type, trigger, event) {
    const collection = new CustomEnrichmentsCollection(type, trigger, event);
    collection.setDigitalData(this.digitalData);
    collection.setDDStorage(this.ddStorage);

    return collection;
  }

  reset() {
    storage[ENRICHMENT_TYPE_DIGITAL_DATA] = {
      [ENRICHMENT_TRIGGER_INIT]: undefined,
      [ENRICHMENT_TRIGGER_EVENT]: {},
    };
  }
}

export default CustomEnrichments;
