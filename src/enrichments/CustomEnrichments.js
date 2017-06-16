import { setProp } from './../functions/dotProp';
import EnrichmentHandler from './EnrichmentHandler';
import { error as errorLog } from './../functions/safeConsole';

const ENRICHMENT_TYPE_DIGITAL_DATA = 'digitalData';

const digitalDataEnrichments = {};
const eventEnrichments = {};
const productEnrichments = {};

const checkEnrichment = (enrichment) => {
  return (
    typeof enrichment === 'object' &&
    typeof enrichment.handler === 'function' &&
    typeof enrichment.prop === 'string'
  );
};

const getDigitalDataEnrichments = (event) => {
  return digitalDataEnrichments[event] || [];
};

const getEventEnrichments = (event) => {
  return eventEnrichments[event] || [];
};

const getProductEnrichments = (integration) => {
  return productEnrichments[integration] || [];
};

const addDigitalDataEnrichment = (prop, handler, options) => {
  const events = options.events || [];
  for (const event of events) {
    digitalDataEnrichments[event] = digitalDataEnrichments[event] || [];
    digitalDataEnrichments[event].push({
      prop,
      handler,
      options,
    });
  }
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
    if (type === ENRICHMENT_TYPE_DIGITAL_DATA) {
      addDigitalDataEnrichment(prop, handler, options);
    }
  }

  enrichDigitalData(digitalData, event) {
    const eventName = event.name;
    if (!eventName) return;

    const enrichments = getDigitalDataEnrichments(eventName);
    for (const enrichment of enrichments) {
      const options = enrichment.options;
      const prop = enrichment.prop;
      const handler = new EnrichmentHandler(enrichment.handler, digitalData, event);
      let value;
      try {
        value = handler.run();
        digitalData.changes.push([prop, value, 'DDManager Custom Enrichment']);
        if (options.persist) {
          this.ddStorage.persist(prop, options.persistTtl);
        }
      } catch (e) {
        errorLog(e);
      }
    }
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
