import getQueryParam from 'driveback-utils/getQueryParam';
import cookie from 'js-cookie';
import DDHelper from './DDHelper';
import domQuery from 'driveback-utils/domQuery';
import { getProp } from 'driveback-utils/dotProp';
import getDataLayerProp from 'driveback-utils/getDataLayerProp';

class Handler {
  constructor(handler, digitalData, args) {
    this.handler = handler;
    this.args = args;
    this.utils = {
      queryParam: getQueryParam,
      cookie: cookie.get,
      get: (target, key) => getProp(target, key),
      digitalData: key => DDHelper.get(key, digitalData),
      domQuery,
      global: key => getProp(window, key),
      dataLayer: getDataLayerProp,
      fetch: (url, options, callback) => {
        if (!callback) {
          callback = options; // arguments shift
          options = undefined;
        }
        return new Promise((resolve) => {
          window.fetch(url, options).then(response => response.text()).then((text) => {
            try {
              text = JSON.parse(text);
            } catch (error) {
              // do nothing
            }
            resolve(callback(text));
          });
        });
      },
      timeout: (delay, callback) => new Promise((resolve) => {
        setTimeout(() => {
          resolve(callback());
        }, delay);
      }),
    };
  }

  run() {
    const handlerWithUtils = this.handler.bind(this.utils);
    return handlerWithUtils(...this.args);
  }
}

export default Handler;
