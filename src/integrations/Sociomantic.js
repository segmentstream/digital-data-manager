import sha256 from 'crypto-js/sha256';
import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_CATEGORY,
  VIEWED_CART,
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
          identifier: String(productId),
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
    this.trackingScriptCalled = false;
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }

  isLoaded() {
    const adpanId = this.getOption('adpanId');
    return window.sociomantic && window.sociomantic.sonar && window.sociomantic.sonar.adv[adpanId];
  }

  loadTrackingScript() {
    const adpanId = this.getOption('adpanId');
    if (this.isLoaded()) {
      window.sociomantic.sonar.adv[adpanId].enable();
    } else {
      this.load();
    }
    this.trackingScriptCalled = true;
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
        'user.userId',
        'user.email',
        'cart.lineItems',
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
    case COMPLETED_TRANSACTION:
      enrichableProps = [
        'transaction',
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
    const trackingObjectCustomerName = prefix + 'customer';
    const trackingObjectBasketName = prefix + 'basket';
    const user = event.user;
    const page = event.page;
    const specialPages = ['product', 'category', 'search', 'confirmation'];
    const cart = event.cart;

    if (user && (user.userId || user.email)) {
      let userId;
      let userEmail;
      if (user.userId) {
        userId = String(user.userId);
      }
      if (user.email) {
        userEmail = sha256(user.email);
      }
      window[trackingObjectCustomerName] = {
        identifier: userId || '',
        mhash: userEmail || '',
      };
      deleteEmptyProperties(trackingObjectCustomerName);
    }

    if (cart && cart.lineItems) {
      const products = lineItemsToSociomanticsItems(cart.lineItems);
      if (products.length) {
        window[trackingObjectBasketName] = {
          products: products,
        };
      }
    }
    if (page && specialPages.indexOf(page.type) < 0) {
      this.loadTrackingScript();
    } else {
      setTimeout(() => {
        if (!this.trackingScriptCalled) {
          this.loadTrackingScript();
        }
      }, 100);
    }
  }

  onViewedProductDetail(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'product';
    const product = event.product;

    if (product && (product.id || product.skuCode)) {
      let productId;
      let productSkuCode;
      if (product.id) {
        productId = String(product.id);
      }
      if (product.skuCode) {
        productSkuCode = String(product.skuCode);
      }
      window[trackingObjectName] = {
        identifier: productId || productSkuCode,
      };
      this.loadTrackingScript();
    }
  }

  onViewedProductListing(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'product';
    const listing = event.listing;

    if (listing && listing.category && listing.category.length) {
      window[trackingObjectName] = {
        category: listing.category,
      };
      this.loadTrackingScript();
    }
  }

  onViewedCart() {
    // Assigning basket object on every pages - see onViewedPage()
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
      if (products.length) {
        let transactionOrderId;
        if (transaction.orderId) {
          transactionOrderId = String(transaction.orderId);
        }
        window[trackingObjectBasketName] = {
          products: products,
          transaction: transactionOrderId || '',
          amount: transaction.total || '',
          currency: transaction.currency || '',
        };
        deleteEmptyProperties(trackingObjectBasketName);
      }
    }

    this.loadTrackingScript();
  }
}

export default Sociomantic;
