import EnrichmentHandler from './EnrichmentHandler';
import { error as errorLog } from './../functions/safeConsole';
import { setProp } from './../functions/dotProp';

class CustomEnrichment {
  constructor(prop, handler, options, collection, ddStorage) {
    this.prop = prop;
    this.handler = handler;
    this.options = options || {};
    this.collection = collection;
    this.ddStorage = ddStorage;

    this.done = false;
    this.recursionFreeze = false;
  }

  hasDependencies() {
    return this.options.dependencies && this.options.dependencies.length;
  }

  getDependencies() {
    return this.options.dependencies || [];
  }

  enrich(target, args, direct = false) {
    if (this.recursionFreeze) return;
    this.recursionFreeze = true;

    if (this.isDone()) return;

    if (this.hasDependencies()) {
      const dependencies = this.getDependencies();
      for (const dependencyProp of dependencies) {
        const enrichment = this.collection.getEnrichment(dependencyProp);
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

      if (this.options.persist) {
        this.ddStorage.persist(this.prop, this.options.persistTtl);
      }
    }

    this.done = true;
  }

  isDone() {
    return this.done;
  }

  reset() {
    this.done = false;
    this.recursionFreeze = false;
  }
}

export default CustomEnrichment;
