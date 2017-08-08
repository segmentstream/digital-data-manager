import Handler from './../Handler';
import { error as errorLog } from 'driveback-utils/safeConsole';
import { setProp } from 'driveback-utils/dotProp';
import isPromise from 'driveback-utils/isPromise';

class IntegrationEventEnrichment {
  constructor(prop, handler, digitalData) {
    this.prop = prop;
    this.handler = handler;
    this.digitalData = digitalData;

    this.done = false;
  }

  enrich(event) {
    const handler = new Handler(this.handler, this.digitalData, [event]);
    try {
      const value = handler.run();
      if (isPromise(value)) {
        errorLog('Async integration event enrichments are not supported');
      } else if (value !== undefined) {
        setProp(event, this.prop, value);
      }
    } catch (e) {
      errorLog(e);
    }
  }
}

export default IntegrationEventEnrichment;
