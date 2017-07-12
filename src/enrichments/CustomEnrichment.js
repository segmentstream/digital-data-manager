import Handler from './../Handler';
import { error as errorLog } from './../functions/safeConsole';
import { setProp } from './../functions/dotProp';
import isPromise from './../functions/isPromise';

class CustomEnrichment {
  constructor(prop, handler, options, collection) {
    this.prop = prop;
    this.handler = handler;
    this.options = options || {};
    this.collection = collection;
    this.digitalData = collection.getDigitalData();
    this.ddStorage = collection.getDDStorage();

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
    const onValueReceived = (value) => {
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
    };

    if (this.recursionFreeze) return;
    this.recursionFreeze = true;

    if (this.isDone()) return;

    if (this.hasDependencies()) {
      const dependencies = this.getDependencies();
      for (const dependencyProp of dependencies) {
        const enrichment = this.collection.getEnrichment(dependencyProp);
        if (enrichment) {
          enrichment.enrich(target, args, direct);
        }
      }
    }

    const handler = new Handler(this.handler, this.digitalData, args);
    let result;
    try {
      result = handler.run();
      if (isPromise(result)) {
        result.then((value) => {
          onValueReceived(value);
        });
      } else {
        onValueReceived(result);
      }
    } catch (e) {
      errorLog(e);
    }
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
