import getQueryParam from './functions/getQueryParam';
import cookie from 'js-cookie';
import DDHelper from './DDHelper';
import domQuery from './functions/domQuery';
import { getProp } from './functions/dotProp';
import getDataLayerProp from './functions/getDataLayerProp';

class Handler {
  constructor(handler, digitalData, args) {
    this.handler = handler;
    this.args = args;
    this.utils = {
      getQueryParam: getQueryParam,
      queryParam: getQueryParam,
      getCookie: cookie.get,
      cookie: cookie.get,
      get: (key) => {
        return DDHelper.get(key, digitalData);
      },
      digitalData: (key) => {
        return DDHelper.get(key, digitalData);
      },
      domQuery: domQuery,
      global: (key) => {
        return getProp(window, key);
      },
      dataLayer: getDataLayerProp,
    };
  }

  run() {
    const handlerWithUtils = this.handler.bind(this.utils);
    return handlerWithUtils(...this.args);
  }
}

export default Handler;
