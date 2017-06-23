import getQueryParam from './../functions/getQueryParam';
import cookie from 'js-cookie';
import DDHelper from './../DDHelper';

class EventHandler {
  constructor(handler, digitalData, args) {
    this.handler = handler;
    this.args = args;
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
    return handlerWithUtils(...this.args);
  }
}

export default EventHandler;
