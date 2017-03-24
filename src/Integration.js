import loadScript from './functions/loadScript';
import loadLink from './functions/loadLink';
import loadIframe from './functions/loadIframe';
import loadPixel from './functions/loadPixel';
import format from './functions/format';
import noop from './functions/noop';
import log from './functions/log';
import each from './functions/each';
import { getProp } from './functions/dotProp';
import deleteProperty from './functions/deleteProperty';
import debug from 'debug';
import async from 'async';
import EventEmitter from 'component-emitter';
import { DIGITALDATA_VAR } from './variableTypes';

export function getEnrichableVariableMappingProps(variableMapping) {
  const enrichableProps = [];
  each(variableMapping, (key, variable) => {
    if (variable.type === DIGITALDATA_VAR) {
      enrichableProps.push(variable.value);
    }
  });
  return enrichableProps;
}

export function extractVariableMappingValues(source, variableMapping) {
  const values = {};
  each(variableMapping, (key, variable) => {
    let value = getProp(source, variable.value);
    if (value !== undefined) {
      if (typeof value === 'boolean') value = value.toString();
      values[key] = value;
    }
  });
  return values;
}

export class Integration extends EventEmitter
{
  constructor(digitalData, options, tags) {
    super();
    this.options = options;
    this.overrideFunctions = {};
    if (options && options.overrideFunctions) {
      this.defineOverrideFunctions(options.overrideFunctions);
    }
    this.digitalData = digitalData;
    this.tags = tags || {};
    this.onLoad = this.onLoad.bind(this);
    this._isEnriched = false;
    this._productOverrideErrorFired = false;

    const optionsOverrideFunction = this.getOptionsOverrideFunction();
    if (optionsOverrideFunction) {
      optionsOverrideFunction(options);
    }
  }

  defineOverrideFunctions(overrideFunctions) {
    // TODO: refactoring
    if (overrideFunctions.event) {
      this.overrideFunctions.event = (event) => {
        try {
          overrideFunctions.event.bind(this)(event);
        } catch (e) {
          log(`function override error for event ${event.name} in integration ${this.getName()}: ${e}`, log.ERROR);
        }
      };
    }
    if (overrideFunctions.product) {
      this.overrideFunctions.product = (product) => {
        try {
          overrideFunctions.product.bind(this)(product);
        } catch (e) {
          if (!this._productOverrideErrorFired) {
            log(`function override error for product in integration ${this.getName()}: ${e}`, log.ERROR);
            this._productOverrideErrorFired = true;
          }
        }
      };
    }
    if (overrideFunctions.options) {
      this.overrideFunctions.options = (options) => {
        try {
          overrideFunctions.options.bind(this)(options);
        } catch (e) {
          log(`function override error for options of integration ${this.getName()}: ${e}`, log.ERROR);
        }
      };
    }
  }

  getProductOverrideFunction() {
    return this.overrideFunctions.product;
  }

  getEventOverrideFunction() {
    return this.overrideFunctions.event;
  }

  getOptionsOverrideFunction() {
    return this.overrideFunctions.options;
  }

  setName(name) {
    this.name = name;
  }

  getName() {
    return this.name;
  }

  initialize() {
    const onLoad = this.onLoad;
    async.nextTick(onLoad);
  }

  load(tagName, params, callback) {
    setTimeout(() => {
      const callbackCalled = false;
      const safeCallback = () => {
        if (!callbackCalled) {
          callback();
        }
      };

      // sometimes loadScript callback doesn't fire
      // for https scripts in IE8, IE9 and opera
      // in this case we check is script was loaded every 500ms
      const intervalId = setInterval(() => {
        if (this.isLoaded()) {
          safeCallback();
          clearInterval(intervalId);
        }
      }, 500);

      // Argument shuffling
      if (typeof tagName === 'function') {
        callback = tagName;
        params = null;
        tagName = null;
      }
      if (tagName && typeof tagName === 'object') {
        callback = params;
        params = tagName;
        tagName = null;
      }
      if (typeof params === 'function') {
        callback = params;
        params = null;
      }

      // Default arguments
      tagName = tagName || 'library';

      const tag = this.tags[tagName];
      if (!tag) throw new Error(format('tag "%s" not defined.', tagName));
      callback = callback || noop;

      let el;
      const attr = tag.attr;

      if (params) {
        each(attr, (attrKey, attrVal) => {
          if (attrVal) {
            attr[attrKey] = attrVal.replace(/\{\{\ *(\w+)\ *\}\}/g, (_, $1) => {
              return params[$1];
            });
          }      
        });
      }

      switch (tag.type) {
      case 'img':
        attr.width = 1;
        attr.height = 1;
        el = loadPixel(attr, safeCallback);
        break;
      case 'script':
        el = loadScript(attr, (err) => {
          if (!err) return safeCallback();
          debug('error loading "%s" error="%s"', tagName, err);
        });
        // TODO: hack until refactoring load-script
        deleteProperty(attr, 'src');
        each(attr, (key, value) => {
          el.setAttribute(key, value);
        });
        break;
      case 'link':
        el = loadLink(attr, (err) => {
          if (!err) return safeCallback();
          debug('error loading "%s" error="%s"', tagName, err);
        });
        break;
      case 'iframe':
        el = loadIframe(attr, safeCallback);
        break;
      default:
        // No default case
      }
    }, 0);
  }

  isLoaded() {
    return false;
  }

  onLoad() {
    this.emit('load');
  }

  addTag(name, tag) {
    if (!tag) {
      tag = name;
      name = 'library';
    }

    this.tags[name] = tag;
    return this;
  }

  getTag(name) {
    if (!name) {
      name = 'library';
    }
    return this.tags[name];
  }

  setOption(name, value) {
    this.options[name] = value;
    return this;
  }

  getOption(name) {
    return this.options[name];
  }

  reset() {
    // abstract
  }

  onEnrich() {
    this._isEnriched = true;
    this.emit('enrich');
  }

  enrichDigitalData() {
    // abstract
  }

  getEnrichableEventProps() {
    return [];
  }

  getEventValidations() {
    return [];
  }

  getSemanticEvents() {
    return [];
  }

  allowCustomEvents() {
    return false;
  }

  trackCategorizedPages() {
    return false;
  }

  trackNamedPages() {
    return false;
  }

  isEnriched() {
    return this._isEnriched;
  }

  setDDManager(ddManager) {
    this.ddManager = ddManager;
  }

  trackEvent() {
    // abstract
  }

  on(event, handler) {
    this.addEventListener(event, handler);
  }

  addEventListener(event, handler) {
    if (event === 'enrich') {
      if (this._isEnriched) {
        handler();
        return;
      }
    } else if (event === 'load') {
      if (this.isLoaded()) {
        handler();
        return;
      }
    }

    super.addEventListener(event, handler);
  }
}

export default Integration;
