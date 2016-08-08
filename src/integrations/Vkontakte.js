import Integration from './../Integration.js';

class Vkontakte extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      eventPixels: {},
    }, options);
    super(digitalData, optionsWithDefaults);
    this._isLoaded = false;
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }

  isLoaded() {
    return this._isLoaded;
  }

  reset() {
    // nothing to reset
  }

  trackEvent(event) {
    const eventPixels = this.getOption('eventPixels');
    if (eventPixels[event.name]) {
      const pixelUrl = eventPixels[event.name];
      this.addPixel(pixelUrl);
    }
  }

  addPixel(pixelUrl) {
    (window.Image ? (new Image()) : window.document.createElement('img')).src = window.location.protocol + pixelUrl;
  }
}

export default Vkontakte;
