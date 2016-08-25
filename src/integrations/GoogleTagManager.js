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
    window.dataLayer = window.dataLayer || [];
    this.ddManager.on('ready', () => {
      window.dataLayer.push({ event: 'DDManager Ready' });
    });
    this.ddManager.on('load', () => {
      window.dataLayer.push({ event: 'DDManager Loaded' });
    });
    
    if (this.getOption('containerId') && this.getOption('noConflict') === false) {
      window.dataLayer.push({ 'gtm.start': Number(new Date()), event: 'gtm.js' });
      this.load(this.onLoad);
    } else {
      this.onLoad();
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
