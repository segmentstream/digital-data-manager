import CustomEnrichmentsCollection from './CustomEnrichmentsCollection';

const BEFORE_EVENT = 'beforeEvent';
const AFTER_EVENT = 'afterEvent';

const storage = {
  [BEFORE_EVENT]: {},
  [AFTER_EVENT]: {},
};

const checkEnrichment = enrichment => (
  typeof enrichment === 'object' &&
    typeof enrichment.handler === 'function' &&
    typeof enrichment.prop === 'string'
);

class CustomEnrichments {
  constructor(digitalData, ddStorage) {
    this.ddStorage = ddStorage;
    this.digitalData = digitalData;
  }

  import(enrichments) {
    if (!enrichments || !Array.isArray(enrichments)) return;
    enrichments.forEach((enrichment) => {
      if (!checkEnrichment(enrichment)) return;
      this.addEnrichment(enrichment);
    });
  }

  addEnrichment(enrichment) {
    // TODO: remove later (backward compatibility)
    if (enrichment.beforeEvent === undefined) {
      if (!enrichment.event) enrichment.event = 'Viewed Page';
      if (enrichment.event === 'Viewed Page') {
        enrichment.beforeEvent = true;
      } else {
        enrichment.beforeEvent = false;
      }
    }
    const collection = this.prepareCollection(enrichment.event, enrichment.beforeEvent);
    collection.addEnrichment(enrichment);
  }

  enrichDigitalData(digitalData, event, beforeEvent) {
    const eventName = event.name;
    if (!eventName) return;

    const collection = this.prepareCollection(event.name, beforeEvent);
    collection.enrich(digitalData, [event]);
  }

  prepareCollection(event, beforeEvent) {
    if (beforeEvent) {
      if (!storage[BEFORE_EVENT][event]) {
        storage[BEFORE_EVENT][event] = this.newCollection(event, beforeEvent);
      }
      return storage[BEFORE_EVENT][event];
    }
    if (!storage[AFTER_EVENT][event]) {
      storage[AFTER_EVENT][event] = this.newCollection(event, beforeEvent);
    }
    return storage[AFTER_EVENT][event];
  }

  newCollection(event, beforeEvent) {
    const collection = new CustomEnrichmentsCollection(event, beforeEvent);
    collection.setDigitalData(this.digitalData);
    collection.setDDStorage(this.ddStorage);

    return collection;
  }

  reset() {
    storage[BEFORE_EVENT] = {};
    storage[AFTER_EVENT] = {};
  }
}

export default CustomEnrichments;
