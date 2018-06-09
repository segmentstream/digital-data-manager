import Integration from './../Integration';
import { VIEWED_PRODUCT_DETAIL } from '../events/semanticEvents';

class TryFit extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      clientId: '',
    }, options);
    super(digitalData, optionsWithDefaults);

    this.pluginLoaded = false;

    this.addTag('plugin', {
      type: 'script',
      attr: {
        id: 'tryfit-plugin',
        src: `https://plugin.try.fit/${options.clientId}/tf.js`,
      },
    });
  }

  getSemanticEvents() {
    return [VIEWED_PRODUCT_DETAIL];
  }

  trackEvent(event) {
    if (!this.pluginLoaded && event.name === VIEWED_PRODUCT_DETAIL) {
      this.pluginLoaded = true;
      this.load('plugin');
    }
  }
}

export default TryFit;
