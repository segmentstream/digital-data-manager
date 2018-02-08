import Handler from './../Handler';
import { error as errorLog } from 'driveback-utils/safeConsole';
import { setProp } from 'driveback-utils/dotProp';
import isPromise from 'driveback-utils/isPromise';

class IntegrationEnrichment {
  constructor(prop, handler, digitalData) {
    this.prop = prop;
    this.handler = handler;
    this.digitalData = digitalData;

    this.done = false;
  }

  enrich(target) {
    const handler = new Handler(this.handler, this.digitalData, [target]);
    try {
      const value = handler.run();
      if (isPromise(value)) {
        errorLog('Async integration enrichments are not supported');
      } else if (value !== undefined) {
        setProp(target, this.prop, value);
      }
    } catch (e) {
      errorLog(e);
    }
  }
}

export default IntegrationEnrichment;
