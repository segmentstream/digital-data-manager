import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import size from './../functions/size.js';

class FacebookPixel extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      pixelId: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//connect.facebook.net/en_US/fbevents.js',
      },
    });
  }

  static getName() {
    return 'Facebook Pixel';
  }

  initialize() {
    if (this.getOption('pixelId')) {
      window.fbq = window._fbq = function() {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, arguments);
        } else {
          window.fbq.queue.push(arguments);
        }
      };
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
      window.fbq.agent = 'ddm';
      window.fbq.version = '2.0';
      window.fbq.queue = [];
      this.load(this.ready);
      window.fbq('init', this.getOption('pixelId'));
    } else {
      this.ready();
    }
  }

  isLoaded() {
    return !!(window.fbq && window.fbq.callMethod);
  }

  reset() {
    deleteProperty(window, 'fbq');
  }

  trackEvent(event) {
    if (event.name === 'Viewed Page') {
      this.onViewedPage();
    } else if (event.name === 'Viewed Product Category') {
      this.onViewedProductCategory(event.page);
    } else if (event.name === 'Viwed Product Detail') {
      this.onViewedProductDetail(event.product);
    }
  }

  onViewedPage() {
    window.fbq('track', 'PageView');
  }

  onViewedProductCategory(page) {
    window.fbq('track', 'ViewContent', {
      content_ids: [page.categoryId || ''],
      content_type: 'product_group'
    });
  }

  onViewedProductDetail(product) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id || product.skuCode || ''],
      content_type: 'product',
      content_name: product.name || '',
      content_category: product.category || '',
      currency: product.currency,
      value: product.unitSalePrice || product.unitPrice || 0
    });
  }

  onAddedProduct(lineItems) {
    window.fbq('track', 'AddToCart', {
      content_ids: [track.id() || track.sku() || ''],
      content_type: 'product',
      content_name: track.name() || '',
      content_category: track.category() || '',
      currency: track.currency(),
      value: formatRevenue(track.price())
    });
  }

  getProduct(product) {
    product = product || {};
    if (type(product) === 'object' && product.id) {
      if (size(product) > 1) {
        return product;
      }
    } else {
      productId = product;
    }
  }
}

export default FacebookPixel;
