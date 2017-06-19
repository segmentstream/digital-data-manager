import { getProp, setProp } from './../functions/dotProp';
import EnrichmentHandler from './EnrichmentHandler';
import CustomEnrichmentsCollection from './CustomEnrichmentsCollection';
import { error as errorLog } from './../functions/safeConsole';

const ENRICHMENT_TYPE_DIGITAL_DATA = 'digitalData';

const ENRICHMENT_TRIGGER_EVENT = 'event';
const ENRICHMENT_TRIGGER_INIT = 'init';

const storage = {
  [ENRICHMENT_TYPE_DIGITAL_DATA]: {
    [ENRICHMENT_TRIGGER_INIT]: null,
    [ENRICHMENT_TRIGGER_EVENT]: {},
  },
};

// enrichments
const digitalDataEnrichments = {
  [ENRICHMENT_TRIGGER_INIT]:
  [ENRICHMENT_TRIGGER_EVENT]: {},
};
const eventEnrichments = {};
const productEnrichments = {};

// atrtibutes
const digitalDataEnrichableAttributes = {
  [ENRICHMENT_TRIGGER_INIT]: [],
  [ENRICHMENT_TRIGGER_EVENT]: {},
};

const prepareArray = (dest, key) => {
  dest[key] = dest[key] || [];
}

const prepareCollection = (type, trigger, event) => {
  if (trigger == ENRICHMENT_TRIGGER_EVENT) {
    if (!storage[type][trigger][event]) {
      storage[type][trigger][event] = CustomEnrichmentsCollection(type, trigger, event);
    }
    return storage[type][trigger][event];
  } else {
    if (!storage[type][trigger]) {
      storage[type][trigger] = CustomEnrichmentsCollection(type, trigger);
    }
    return storage[type][trigger];
  }
}

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
    const events = options.events || [];
    const enrichment = { prop, handler, options };
    let collection;
    if (events.length === 0) {
      collection = prepareCollection(type, ENRICHMENT_TRIGGER_INIT)
    } else {
      for (const event of events) {
        collection = prepareCollection(type, ENRICHMENT_TRIGGER_EVENT, event);
      }
    }
    collection.addEnrichment(enrichment);
  }

  enrichDigitalData(digitalData, event = null) {
    const eventName = event.name;
    if (!eventName) return;


    let collection;
    if (!event) {
      collection = prepareCollection(ENRICHMENT_TYPE_DIGITAL_DATA, ENRICHMENT_TRIGGER_INIT);
    } else {
      collection = prepareCollection(ENRICHMENT_TYPE_DIGITAL_DATA, ENRICHMENT_TRIGGER_EVENT, event);
    }

    collection.enrich(digitalData, [event], options);
  }

  enrichEvent(event, integration) {
    const eventName = event.name;
    if (!eventName) return;

    const enrichments = getEventEnrichments(event, integration);
    for (const enrichment of enrichments) {
      setProp(event, enrichment.prop, enrichment.handler(event));
    }
  }

  enrichProduct(product, integration) {
    const enrichments = getProductEnrichments(integration);
    for (const enrichment of enrichments) {
      setProp(event, enrichment.prop, enrichment.handler(event));
    }
  }
}

export default CustomEnrichments;
