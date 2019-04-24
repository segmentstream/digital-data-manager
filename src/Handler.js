import getQueryParam from 'driveback-utils/getQueryParam';
import cookie from 'js-cookie';
import domQuery from 'driveback-utils/domQuery';
import loadScript from 'driveback-utils/loadScript';
import loadLink from 'driveback-utils/loadLink';
import loadIframe from 'driveback-utils/loadIframe';
import loadPixel from 'driveback-utils/loadPixel';
import { getProp } from 'driveback-utils/dotProp';
import getDataLayerProp from 'driveback-utils/getDataLayerProp';
import DDHelper from './DDHelper';
import { counterInc, counter } from './RollingAttributesHelper';
import { validate } from './helpers/ValidationHelper';

class Handler {
  constructor(handler, digitalData, args) {
    this.handler = handler;
    this.args = args;
    this.utils = {
      counterInc: (key, granularity, ttl) => counterInc(key, granularity, ttl, digitalData),
      counter: key => counter(key, digitalData),
      validate: (schema, obj, key) => validate(schema, obj, key),
      queryParam: getQueryParam,
      cookie: cookie.get,
      get: (target, key) => getProp(target, key),
      digitalData: key => DDHelper.get(key, digitalData),
      domQuery: selector => ((window.jQuery) ? window.jQuery(selector).get() : domQuery(selector)),
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
      retry: (delegate, retriesLeft = 5, delay = 1000) => {
        try {
          if (retriesLeft > 0) delegate();
        } catch (e) {
          setTimeout(() => { this.utils.retry(delegate, retriesLeft - 1); }, delay);
        }
      },
      loadPixel,
      loadScript,
      loadIframe,
      loadLink,
    };
  }

  run() {
    const handlerWithUtils = this.handler.bind(this.utils);
    return handlerWithUtils(...this.args);
  }
}

export default Handler;
