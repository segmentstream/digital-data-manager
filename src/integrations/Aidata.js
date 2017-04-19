import Integration from './../Integration.js';

class Aidata extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      eventPixels: {},
    }, options);
    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = Object.keys(this.getOption('eventPixels'));

    this._isLoaded = false;

    this.addTag({
      type: 'script',
      attr: {
        src: `//x01.aidata.io/pixel.js?pixel={{ pixelId }}&v=${Date.now()}`,
      },
    });
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
    const pixelId = eventPixels[event.name];
    if (pixelId) {
      this.load({ pixelId });
    }
  }
}

export default Aidata;
