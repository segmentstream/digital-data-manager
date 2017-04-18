import { Integration } from './../Integration';

class Weborama extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
      eventTags: {},
      /* example:
      eventTags: {
        'Viewed Product Detail': {
          conversionPage: '470',
        }
      },
      */
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.tagEvents = Object.keys(this.getOption('eventTags'));
    this.SEMANTIC_EVENTS = [];

    for (const tagEvent of this.tagEvents) {
      const tagOptions = this.getOption('eventTags')[tagEvent];
      if (tagOptions) {
        this.SEMANTIC_EVENTS.push(tagEvent);
      }
    }

    this.addTag({
      type: 'img',
      attr: {
        src: `https://rtbprojects.solution.weborama.fr/fcgi-bin/dispatch.fcgi?a.A=co&a.si={{ siteId }}&a.cp={{ conversionPage }}&a.ct=d`,
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

  trackEvent(event) {
    const eventTags = this.getOption('eventTags');
    const tagOptions = eventTags[event.name];

    if (tagOptions) {
      const siteId = this.getOption('siteId');
      const conversionPage = tagOptions.conversionPage;

      const tagParams = { siteId, conversionPage };

      this.load(tagParams);
    }
  }
}

export default Weborama;
