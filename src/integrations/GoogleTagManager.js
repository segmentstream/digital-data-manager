import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

class GoogleTagManager extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      containerId: null,
      noConflict: false,
    }, options);
    super(digitalData, optionsWithDefaults);
    this.addTag({
      type: 'script',
      attr: {
        src: `//www.googletagmanager.com/gtm.js?id=${options.containerId}&l=dataLayer`,
      },
    });
  }

  initialize() {
    if (this.getOption('containerId') && this.getOption('noConflict') === false) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': Number(new Date()), event: 'gtm.js' });
      this.load(this.ready);
    } else {
      this.ready();
    }
  }

  isLoaded() {
    return !!(window.dataLayer && Array.prototype.push !== window.dataLayer.push);
  }

  reset() {
    deleteProperty(window, 'dataLayer');
    deleteProperty(window, 'google_tag_manager');
  }

  trackEvent(event) {
    const name = event.name;
    const category = event.category;
    deleteProperty(event, 'name');
    deleteProperty(event, 'category');
    event.event = name;
    event.eventCategory = category;
    window.dataLayer.push(event);
  }
}

export default GoogleTagManager;
