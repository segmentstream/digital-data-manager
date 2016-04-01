import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import each from './../functions/each.js';

class SegmentStream extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      sessionLength: 1800, // 30 min
      storagePrefix: 'ss:',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        id: 'segmentstream-sdk',
        src: '//cdn.driveback.ru/js/segmentstream.js',
      },
    });
  }

  initialize() {
    const ssApi = window.ssApi = window.ssApi || [];

    if (ssApi.initialize) return;

    if (ssApi.invoked) {
      throw new Error('SegmentStream snippet included twice.');
    }

    ssApi.invoked = true;

    ssApi.methods = [
      'initialize',
      'track',
      'getData',
      'getAnonymousId',
      'pushOnReady',
    ];

    ssApi.factory = (method) => {
      return function stub() {
        const args = Array.prototype.slice.call(arguments);
        args.unshift(method);
        ssApi.push(args);
        return ssApi;
      };
    };

    for (let i = 0; i < ssApi.methods.length; i++) {
      const key = ssApi.methods[i];
      ssApi[key] = ssApi.factory(key);
    }

    ssApi.initialize(this._options);
    ssApi.pushOnReady(() => {
      this.ready();
    });
    this.load();
  }

  isLoaded() {
    return !!(window.ssApi && window.ssApi.initialize);
  }

  reset() {
    deleteProperty(window, 'ssApi');
    localStorage.clear();
  }

  enrichDigitalData(done) {
    function lowercaseFirstLetter(string) {
      return string.charAt(0).toLowerCase() + string.slice(1);
    }
    const attributes = window.ssApi.getData().attributes;
    this._digitalData.user.ssAttributes = {};
    this._digitalData.user.anonymousId = window.ssApi.getAnonymousId();
    each(attributes, (name, value) => {
      const key = lowercaseFirstLetter(name);
      this._digitalData.user.ssAttributes[key] = value;
    });
    done();
  }

  trackEvent(event) {
    const methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Added Product': 'onAddedProduct',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage() {
    window.ssApi.track('Viewed Page');
    this.enrichDigitalData();
  }

  onViewedProductDetail(event) {
    window.ssApi.track('Viewed Product Detail', {
      price: event.product.unitSalePrice || event.product.unitPrice || 0,
    });
    this.enrichDigitalData();
  }

  onAddedProduct(event) {
    window.ssApi.track('Added Product', {
      price: event.product.unitSalePrice || event.product.unitPrice || 0,
    });
    this.enrichDigitalData();
  }
}

export default SegmentStream;
