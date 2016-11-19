import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import contains from './../functions/contains.js';
import type from 'component-type';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_CATEGORY,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  COMPLETE_TRANSACTION,
  VIEWWED_PRODUCT,
  CLICKED_PRODUCT,
  VIEWED_CAMPAIGN,
  CLICKED_CAMPAIGN,
  REMOVED_PRODUCT,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_CHECKOUT_STEP,
  REFUNDED_TRANSACTION,
  SUBSCRIBED
} from '../const'

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

  isLoaded() {
    return !!(window.fbq && window.fbq.callMethod);
  }

  reset() {
    deleteProperty(window, 'fbq');
  }

  trackEvent(event) {
    const { name } = event;
    
    if (name === VIEWED_PAGE) {
      this.onViewedPage();
    } else if (name === VIEWED_PRODUCT_CATEGORY) {
      this.onViewedProductCategory(event.listing);
    } else if (name === VIEWED_PRODUCT_DETAIL) {
      this.onViewedProductDetail(event.product);
    } else if (name === ADDED_PRODUCT) {
      this.onAddedProduct(event.product, event.quantity);
    } else if (name === COMPLETE_TRANSACTION) {
      this.onCompletedTransaction(event.transaction);
    } else if (name === SUBSCRIBED) {
      this.onSubscribed(event.user);
    } else if (!contains([
        VIEWWED_PRODUCT,
        CLICKED_PRODUCT,
        VIEWED_CAMPAIGN,
        CLICKED_CAMPAIGN,
        REMOVED_PRODUCT,
        VIEWED_CHECKOUT_STEP,
        COMPLETED_CHECKOUT_STEP,
        REFUNDED_TRANSACTION,
    ], name)) {
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
      currency: product.currency || '',
      value: product.unitSalePrice || product.unitPrice || 0,
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

  onSubscribed({ email }) {
    if (email) {
      window.fbq('track', 'Lead', {
        value: email
      });
    }
  }

  onCustomEvent(event) {
    window.fbq('trackCustom', event.name);
  }
}

export default FacebookPixel;




















