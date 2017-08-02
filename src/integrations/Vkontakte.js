import Integration from './../Integration';
import AsyncQueue from './utils/AsyncQueue';
import arrayMerge from './../functions/arrayMerge';
import deleteProperty from './../functions/deleteProperty';
import { VIEWED_PAGE } from './../events/semanticEvents';

class Vkontakte extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      pixelId: '',
      customEvents: {},
      eventPixels: {}, // legacy version of Vkontakte
    }, options);
    super(digitalData, optionsWithDefaults);

    this.asyncQueue = new AsyncQueue(this.isLoaded);

    if (this.getOption('pixelId')) {
      this.SEMANTIC_EVENTS = [VIEWED_PAGE];
    } else {
      this.SEMANTIC_EVENTS = [];
    }

    arrayMerge(this.SEMANTIC_EVENTS, Object.keys(this.getOption('eventPixels')));
    arrayMerge(this.SEMANTIC_EVENTS, Object.keys(this.getOption('customEvents')));

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://vk.com/js/api/openapi.js?146',
      },
    });
  }

  initialize() {
    this.asyncQueue.push(() => {
      window.VK.Retargeting.Init(this.getOption('pixelId')); // eslint-disable-line new-cap
    });
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  allowNoConflictInitialization() {
    return true;
  }

  isLoaded() {
    return !!window.VK;
  }

  reset() {
    deleteProperty(window, 'VK');
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE && this.getOption('pixelId')) {
      this.asyncQueue.push(() => {
        window.VK.Retargeting.Hit(); // eslint-disable-line new-cap
      });
    }

    // new version of pixel
    const customEvents = this.getOption('customEvents');
    const customEventName = customEvents[event.name];
    if (customEventName) {
      this.asyncQueue.push(() => {
        window.VK.Retargeting.Event(customEventName); // eslint-disable-line new-cap
      });
    }

    // legacy version of pixel
    const eventPixels = this.getOption('eventPixels');
    const pixelUrl = eventPixels[event.name];
    if (pixelUrl) {
      this.addPixel(pixelUrl);
    }
  }

  addPixel(pixelUrl) {
    (window.Image ? (new Image()) : window.document.createElement('img')).src = window.location.protocol + pixelUrl;
  }
}

export default Vkontakte;
