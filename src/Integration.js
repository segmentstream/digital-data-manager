import loadScript from './functions/loadScript.js';
import loadIframe from './functions/loadIframe.js';
import loadPixel from './functions/loadPixel.js';
import format from './functions/format.js';
import noop from './functions/noop.js';
import each from './functions/each.js';
import deleteProperty from './functions/deleteProperty.js';
import debug from 'debug';
import nextTick from 'next-tick';
import EventEmitter from 'component-emitter';

class Integration extends EventEmitter
{
  constructor(options) {
    super();
    this._options = options;
    this._tags = {};
    this.ready = this.ready.bind(this);
  }

  initialize() {
    const ready = this.ready;
    nextTick(ready);
  }

  setName(name) {
    this._name = name;
    return this;
  }

  getName() {
    return this._name || this.constructor.getName();
  }

  load(tagName, callback) {
    // Argument shuffling
    if (typeof tagName === 'function') { callback = tagName; tagName = null; }

    // Default arguments
    tagName = tagName || 'library';

    const tag = this._tags[tagName];
    if (!tag) throw new Error(format('tag "%s" not defined.', tagName));
    callback = callback || noop;

    let el;
    const attr = tag.attr;
    switch (tag.type) {
    case 'img':
      attr.width = 1;
      attr.height = 1;
      el = loadPixel(attr, callback);
      break;
    case 'script':
      el = loadScript(attr, (err) => {
        if (!err) return callback();
        debug('error loading "%s" error="%s"', tagName, err);
      });
      // TODO: hack until refactoring load-script
      deleteProperty(attr, 'src');
      each(attr, (key, value) => {
        el.setAttribute(key, value);
      });
      break;
    case 'iframe':
      el = loadIframe(attr, callback);
      break;
    default:
      // No default case
    }

    return el;
  }

  isLoaded() {
    return false;
  }

  ready() {
    this.emit('ready');
  }

  addTag(name, tag) {
    if (!tag) {
      tag = name;
      name = 'library';
    }

    this._tags[name] = tag;
    return this;
  }

  getTag(name) {
    if (!name) {
      name = 'library';
    }
    return this._tags[name];
  }

  addOption(name, defaultValue) {
    this._options[name] = defaultValue;
    return this;
  }

  getOption(name) {
    return this._options[name];
  }

  reset() {
    // abstract
  }

  onPageLoad(digitalData) {

  }

  onEvent(event, digitalData) {

  }
}

export default Integration;
