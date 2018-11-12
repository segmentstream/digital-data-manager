import Integration from '../Integration';

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

    const siteId = this.getOption('siteId');

    if (siteId) {
      this.addTag({
        type: 'img',
        attr: {
          // eslint-disable-next-line max-len
          src: `https://rtbprojects.solution.weborama.fr/fcgi-bin/dispatch.fcgi?a.A=co&a.si=${siteId}&a.cp={{ conversionId }}&a.ct=d`,
        },
      });
    } else {
      this.addTag('weborama-event-pixel', {
        type: 'img',
        attr: {
          src: '{{ url }}',
        },
      });
    }
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
    if (this.getOption('siteId')) {
      const conversionId = eventPixels[event.name];
      if (conversionId) {
        this.load({ conversionId });
      }
    } else if (eventPixels[event.name]) {
      this.load('weborama-event-pixel', { url: eventPixels[event.name] });
    }
  }
}

export default Weborama;
