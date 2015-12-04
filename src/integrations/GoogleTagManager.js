import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

class GoogleTagManager extends Integration {

  constructor(options) {
    const optionsWithDefaults = Object.assign({
      containerId: '',
    }, options);

    super(optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: `//www.googletagmanager.com/gtm.js?id=${options.containerId}&l=dataLayer`,
      },
    });
  }

  static getName() {
    return 'Google Tag Manager';
  }

  initialize() {
    window.dataLayer = [];
    window.dataLayer.push({ 'gtm.start': Number(new Date()), event: 'gtm.js' });
    this.load(this.ready);
  }

  isLoaded() {
    return !!(window.dataLayer && Array.prototype.push !== window.dataLayer.push);
  }

  reset() {
    deleteProperty(window, 'dataLayer');
    deleteProperty(window, 'google_tag_manager');
  }
}

export default GoogleTagManager;
