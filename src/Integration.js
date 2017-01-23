import loadScript from './functions/loadScript.js';
import loadIframe from './functions/loadIframe.js';
import loadPixel from './functions/loadPixel.js';
import format from './functions/format.js';
import noop from './functions/noop.js';
import each from './functions/each.js';
import deleteProperty from './functions/deleteProperty.js';
import debug from 'debug';
import async from 'async';
import EventEmitter from 'component-emitter';

class Integration extends EventEmitter
{
  constructor(digitalData, options, tags) {
    super();
    this.options = options;
    if (options && options.overrideFunctions) {
      this.defineOverrideFunctions(options.overrideFunctions);
    }
    this.digitalData = digitalData;
    this.tags = tags || {};
    this.onLoad = this.onLoad.bind(this);
    this._isEnriched = false;
  }

  defineOverrideFunctions(overrideFunctions) {
    if (overrideFunctions.event) {
      this.overrideEvent = overrideFunctions.event.bind(this);
    }
    if (overrideFunctions.product) {
      this.overrideProduct = overrideFunctions.product.bind(this);
    }
  }

  overrideProduct() {
    // abstract
  }

  overrideEvent() {
    // abstract
  }

  initialize() {
    const onLoad = this.onLoad;
    async.nextTick(onLoad);
  }

  load(tagName, callback) {
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
      if (typeof tagName === 'function') { callback = tagName; tagName = null; }

      // Default arguments
      tagName = tagName || 'library';

      const tag = this.tags[tagName];
      if (!tag) throw new Error(format('tag "%s" not defined.', tagName));
      callback = callback || noop;

      let el;
      const attr = tag.attr;
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

  isEnriched() {
    return this._isEnriched;
  }

  setDDManager(ddManager) {
    this.ddManager = ddManager;
  }

  trackEvent() {
    // abstract
  }
}

export default Integration;
