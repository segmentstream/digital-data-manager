import getQueryParam from './../functions/getQueryParam';
import cookie from 'js-cookie';
import DDHelper from './../DDHelper';

class EnrichmentHandler {
  constructor(handler, digitalData, event) {
    this.handler = handler;
    this.event = event;
    this.utils = {
      getQueryParam: getQueryParam,
      getCookie: cookie.get,
      get: (key) => {
        return DDHelper.get(key, digitalData);
      },
    };
  }

  run() {
    const handlerWithUtils = this.handler.bind(this.utils);
    return handlerWithUtils(this.event);
  }
}

export default EnrichmentHandler;
