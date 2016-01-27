import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import type from 'component-type';

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
    if (this.getOption('pixelId') && !window.fbq) {
      window.fbq = window._fbq = function() {
        if (window.fbq.callMethod) {
          window.fbq.callMethod.apply(window.fbq, arguments);
        } else {
          window.fbq.queue.push(arguments);
        }
      };
      window.fbq.push = window.fbq;
      window.fbq.loaded = true;
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
    } else if (event.name === 'Viewed Product Detail') {
      this.onViewedProductDetail(event.product);
    } else if (event.name === 'Added Product') {
      this.onAddedProduct(event.product, event.quantity);
    } else if (event.name === 'Completed Transaction') {
      this.onCompletedTransaction(event.transaction);
    }
  }

  onViewedPage() {
    window.fbq('track', 'PageView');
  }

  onViewedProductCategory(page) {
    window.fbq('track', 'ViewContent', {
      content_ids: [page.categoryId || ''],
      content_type: 'product_group',
    });
  }

  onViewedProductDetail(product) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id || product.skuCode || ''],
      content_type: 'product',
      content_name: product.name || '',
      content_category: product.category || '',
      currency: product.currency || '',
      value: product.unitSalePrice || product.unitPrice || 0,
    });
  }

  onAddedProduct(product, quantity) {
    if (product && type(product) === 'object') {
      quantity = quantity || 1;
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id || product.skuCode || ''],
        content_type: 'product',
        content_name: product.name || '',
        content_category: product.category || '',
        currency: product.currency || '',
        value: quantity * (product.unitSalePrice || product.unitPrice || 0),
      });
    }
  }

  onCompletedTransaction(transaction) {
    if (transaction.lineItems && transaction.lineItems.length) {
      const contentIds = [];
      let revenue1 = 0;
      let revenue2 = 0;
      let currency1 = null;
      let currency2 = null;
      for (const lineItem of transaction.lineItems) {
        if (lineItem.product) {
          const product = lineItem.product;
          if (product.id) {
            contentIds.push(product.id);
          }
          revenue2 += (lineItem.quantity || 1) * (product.unitSalePrice || product.unitPrice || 0);
          currency2 = currency2 || product.currency;
        }
        revenue1 += lineItem.subtotal;
        currency1 = currency1 || lineItem.currency;
      }

      window.fbq('track', 'Purchase', {
        content_ids: contentIds,
        content_type: 'product',
        currency: transaction.currency || currency1 || currency2 || '',
        value: transaction.total || revenue1 || revenue2 || 0,
      });
    }
  }
}

export default FacebookPixel;
