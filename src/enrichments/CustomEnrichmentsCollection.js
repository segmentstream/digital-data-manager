import CustomEnrichment from './CustomEnrichment';

class CustomEnrichmentsCollection {
  constructor(type, trigger, event) {
    this.type = type;
    this.trigger = trigger;
    this.event = event;
    this.enrichments = [];
    this.enrichmentsIndex = {};
  }

  addEnrichment(enrichmentConfig) {
    const prop = enrichmentConfig.prop;
    const handler = enrichmentConfig.handler;
    const options = enrichmentConfig.options;

    const enrichment = new CustomEnrichment(prop, handler, options, this);
    this.enrichments.push(enrichment);
    this.enrichmentsIndex[enrichment.prop] = enrichment;
  }

  getEnrichment(prop) {
    return this.enrichmentsIndex[prop];
  }

  reset() {
    for (const enrichment of this.enrichments) {
      enrichment.reset();
    }
  }

  enrich(target, args, options, direct) {
    for (const enrichment of this.enrichments) {
      enrichment.enrich(target, args, options, direct);
    }
  }
}
