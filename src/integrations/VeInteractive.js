import Integration from './../Integration';
import { VIEWED_PAGE, COMPLETED_TRANSACTION } from './../events/semanticEvents';

class VeInteractive extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      javaScriptUrl: '',
      pixelUrl: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: options.javaScriptUrl,
      },
    });

    this.addTag('pixel', {
      type: 'img',
      attr: {
        src: options.pixelUrl,
      },
    });
  }

  getSemanticEvents() {
    return [VIEWED_PAGE, COMPLETED_TRANSACTION];
  }

  isLoaded() {
    return !!window.VeAPI;
  }

  trackEvent(event) {
    if (event.name === COMPLETED_TRANSACTION && this.getOption('pixelUrl')) {
      this.load('pixel');
    }
  }
}

export default VeInteractive;
