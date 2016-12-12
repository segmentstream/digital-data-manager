import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_CATEGORY,
  VIEWED_CART,
  VIEWED_CHECKOUT_STEP,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
} from './../events';

function lineItemsToSociomanticsItems(lineItems) {
  const products = [];
  for (let i = 0, length = lineItems.length; i < length; i++) {
    const lineItem = lineItems[i];
    if (lineItem && lineItem.product) {
      const productId = lineItem.product.id || lineItem.product.skuCode;
      if (productId) {
        const product = {
          identifier: productId,
          amount: lineItem.product.unitSalePrice || lineItem.product.unitPrice || 0,
          quantity: lineItem.quantity || 1,
          currency: lineItem.product.currency || '',
        };
        products.push(product);
      }
    }
  }
  return products;
}

function deleteEmptyProperties(objName) {
  const keys = Object.keys(window[objName]);
  keys.map((key) => {
    if (window[objName][key] === '') {
      deleteProperty(window[objName], key);
    }
  });
}

class Sociomantic extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      region: '',
      adpanId: '',
      prefix: '',
    }, options);
    super(digitalData, optionsWithDefaults);

    const region = this.getOption('region') || '';
    const regionPrefix = region ? `${region}-` : '';
    const adpanId = this.getOption('adpanId');
    const src = `//${regionPrefix}sonar.sociomantic.com/js/2010-07-01/adpan/${adpanId}`;

    this.addTag({
      type: 'script',
      attr: {
        type: 'text/javascript',
        async: true,
        src: src,
      },
    });

    this._isLoaded = false;
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }

  isLoaded() {
    return this._isLoaded;
  }

  loadTrackingScript() {
    const adpanId = this.getOption('adpanId');
    if (window.sociomantic && window.sociomantic.sonar && window.sociomantic.sonar.adv[adpanId]) {
      window.sociomantic.sonar.adv[adpanId].enable();
    } else {
      this.load(this.onLoad);
    }
  }

  reset() {
    deleteProperty(window, 'sociomantic');
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case VIEWED_PAGE:
      enrichableProps = [
        'page.type',
        'user',
      ];
      break;
    case VIEWED_PRODUCT_DETAIL:
      enrichableProps = [
        'product',
      ];
      break;
    case VIEWED_PRODUCT_CATEGORY:
      enrichableProps = [
        'listing.category',
      ];
      break;
    case SEARCHED_PRODUCTS:
      enrichableProps = [
        'listing.category',
      ];
      break;
    case VIEWED_CART:
      enrichableProps = [
        'cart.lineItems',
      ];
      break;
    case VIEWED_CHECKOUT_STEP:
      enrichableProps = [
        'cart.lineItems',
      ];
      break;
    case COMPLETED_TRANSACTION:
      enrichableProps = [
        'transaction',
        'user',
      ];
      break;
    default:
      // do nothing
    }

    return enrichableProps;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [VIEWED_PRODUCT_CATEGORY]: 'onViewedProductListing',
      [VIEWED_CART]: 'onViewedCart',
      [VIEWED_CHECKOUT_STEP]: 'onViewedCart',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [SEARCHED_PRODUCTS]: 'onViewedProductListing',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'customer';
    const user = event.user;
    const page = event.page;
    const pages = ['product', 'category', 'checkout', 'confirmation', 'cart'];

    if (user) {
      window[trackingObjectName] = {
        customer: user.userId,
      };
    }

    if (page && pages.indexOf(page.type) < 0) {
      this.loadTrackingScript();
    }
  }

  onViewedProductDetail(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'product';
    const product = event.product;

    if (product && (product.id || product.skuCode)) {
      window[trackingObjectName] = {
        identifier: product.id || product.skuCode || '',
      };
      deleteEmptyProperties(trackingObjectName);

      this.loadTrackingScript();
    }
  }

  onViewedProductListing(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'product';
    const listing = event.listing;

    if (listing && listing.category) {
      window[trackingObjectName] = {
        category: listing.category,
      };

      this.loadTrackingScript();
    }
  }

  onViewedCart(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'basket';
    const cart = event.cart;

    if (cart && cart.lineItems) {
      const products = lineItemsToSociomanticsItems(cart.lineItems);
      window[trackingObjectName] = {
        products: products,
      };

      this.loadTrackingScript();
    }
  }

  onCompletedTransaction(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectSaleName = prefix + 'sale';
    const trackingObjectBasketName = prefix + 'basket';
    const transaction = event.transaction;

    window[trackingObjectSaleName] = {
      confirmed: true,
    };

    if (transaction && transaction.lineItems) {
      const products = lineItemsToSociomanticsItems(transaction.lineItems);
      window[trackingObjectBasketName] = {
        products: products,
        transaction: transaction.orderId || '',
        amount: transaction.total || '',
        currency: transaction.currency || '',
      };
      deleteEmptyProperties(trackingObjectBasketName);
    }

    this.loadTrackingScript();
  }
}

export default Sociomantic;
