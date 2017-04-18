import Integration from './../Integration.js';

class Vkontakte extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      eventPixels: {},
    }, options);
    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = Object.keys(this.getOption('eventPixels'));

    this._isLoaded = false;
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  isLoaded() {
    return this._isLoaded;
  }

  reset() {
    // nothing to reset
  }

  trackEvent(event) {
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
