import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import type from 'component-type';

function getProductCategory(product) {
  let category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = category + '/' + product.subcategory;
  }
  return category;
}

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

  initialize() {
    if (this.getOption('pixelId') && !window.fbq) {
      window.fbq = window._fbq = function fbq() {
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
      this.load(this.onLoad);
      window.fbq('init', this.getOption('pixelId'));
    } else {
      this.onLoad();
    }
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case 'Viewed Product Detail':
      enrichableProps = [
        'product',
      ];
      break;
    case 'Viewed Product Category':
      enrichableProps = [
        'listing.categoryId',
      ];
      break;
    case 'Completed Transaction':
      enrichableProps = [
        'transaction',
      ];
      break;
    default:
      // do nothing
    }

    return enrichableProps;
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
      this.onViewedProductCategory(event.listing);
    } else if (event.name === 'Viewed Product Detail') {
      this.onViewedProductDetail(event.product);
    } else if (event.name === 'Added Product') {
      this.onAddedProduct(event.product, event.quantity);
    } else if (event.name === 'Subscribed') {
      this.onSubscribed(event.user);
    } else if (event.name === 'Completed Transaction') {
      this.onCompletedTransaction(event.transaction);
    } else if ([
      'Viewed Product',
      'Clicked Product',
      'Viewed Campaign',
      'Clicked Campaign',
      'Removed Product',
      'Viewed Checkout Step',
      'Completed Checkout Step',
      'Refunded Transaction',
    ].indexOf(event.name) < 0) {
      this.onCustomEvent(event);
    }
  }

  onViewedPage() {
    window.fbq('track', 'PageView');
  }

  onViewedProductCategory(listing) {
    window.fbq('track', 'ViewContent', {
      content_ids: [listing.categoryId || ''],
      content_type: 'product_group',
    });
  }

  onViewedProductDetail(product) {
    const category = getProductCategory(product);
    window.fbq('track', 'ViewContent', {
      content_ids: [product.id || product.skuCode || ''],
      content_type: 'product',
      content_name: product.name || '',
      content_category: category || '',
    });
  }

  onAddedProduct(product, quantity) {
    if (product && type(product) === 'object') {
      const category = getProductCategory(product);
      quantity = quantity || 1;
      window.fbq('track', 'AddToCart', {
        content_ids: [product.id || product.skuCode || ''],
        content_type: 'product',
        content_name: product.name || '',
        content_category: category || '',
      });
    }
  }

  onSubscribed(user) {
    if (user && type(user) === 'object') {
      window.fbq('track', 'Lead', {
        content_name: user.email || '',
        content_category: 'User'
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

  onCustomEvent(event) {
    window.fbq('trackCustom', event.name);
  }
}

export default FacebookPixel;
