class CustomEnrichment {
  constructor(prop, handler, options, storage) {
    this.prop = prop;
    this.handler = handler;
    this.options = options || {};
    this.storage = storage;

    this.done = false;
  }

  hasDependencies() {
    return this.options.dependencies && this.options.dependencies.length;
  }

  getDependencies() {
    return this.options.dependencies || [];
  }

  enrich(target, direct = false, args, options) {
    // TODO: recurstion protection

    if (this.isDone()) return;

    if (this.hasDependencies()) {
      const dependencies = this.getDependencies();
      for (const dependencyProp of dependencies) {
        const enrichment = this.storage.getEnrichment(dependencyProp);
        if (enrichment) {
          enrichment.enrich(target, direct);
        }
      }
    }

    const handler = new EnrichmentHandler(this.handler, target, args);
    let value;
    try {
      value = handler.run();
    } catch (e) {
      errorLog(e);
    }

    if (value !== undefined) {
      if (direct) {
        setProp(target, this.prop, value);
      } else {
        target.changes.push([this.prop, value, 'DDManager Custom Enrichment']);
      }

      if (options.persist) {
        this.ddStorage.persist(this.prop, options.persistTtl);
      }
    }

    this.done = true;
  }

  isDone() {
    return this.done;
  }

  reset() {
    this.enrichmentDone = false;
  }
}
