import { Integration } from './../Integration';

class Weborama extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
      eventPixels: {},
      /* example:
      eventPixels: {
        'Viewed Product Detail': '470'
      },
      */
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = Object.keys(this.getOption('eventPixels'));
    this._isLoaded = false;

    this.addTag({
      type: 'img',
      attr: {
        src: `https://rtbprojects.solution.weborama.fr/fcgi-bin/dispatch.fcgi?a.A=co&a.si=${options.siteId}&a.cp={{ conversionId }}&a.ct=d`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    const eventPixels = this.getOption('eventPixels');
    const conversionId = eventPixels[event.name];
    if (conversionId) {
      this.load({ conversionId });
    }
  }
}

export default Weborama;
