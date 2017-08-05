import sha256 from 'crypto-js/sha256';
import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CART,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

let timeoutHandler;

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
      advertiserToken: '',
      prefix: '',
    }, options);
    super(digitalData, optionsWithDefaults);

    const region = this.getOption('region') || '';
    const regionPrefix = region ? `${region}-` : '';
    const advertiserToken = this.getOption('advertiserToken');
    const src = `//${regionPrefix}sonar.sociomantic.com/js/2010-07-01/adpan/${advertiserToken}`;

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      VIEWED_CART,
      SEARCHED_PRODUCTS,
      COMPLETED_TRANSACTION,
    ];

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
  }

  isLoaded() {
    return this._isLoaded;
  }

  loadTrackingScript() {
    const advertiserToken = this.getOption('advertiserToken');
    if (this.trackingScriptCalled) {
      window.sociomantic.sonar.adv[advertiserToken].track();
    } else {
      this.load();
    }
    this.trackingScriptCalled = true;
    this.pageTracked = true;
  }

  clearTrackingObjects() {
    const advertiserToken = this.getOption('advertiserToken');
    if (this.trackingScriptCalled) {
      window.sociomantic.sonar.adv[advertiserToken].clear();
    }
  }

  reset() {
    this.clearTrackingObjects();
    deleteProperty(window, 'sociomantic');
    this.trackingScriptCalled = false;
    this._isLoaded = false;
    if (timeoutHandler) {
      clearTimeout(timeoutHandler);
    }
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case VIEWED_PAGE:
      enrichableProps = [
        'page.type',
        'user.userId',
        'user.email',
      ];
      break;
    case VIEWED_PRODUCT_DETAIL:
      enrichableProps = [
        'product',
      ];
      break;
    case VIEWED_PRODUCT_LISTING:
      enrichableProps = [
        'listing.category',
      ];
      break;
    case VIEWED_CART:
      enrichableProps = [
        'cart.lineItems',
      ];
      break;
    case SEARCHED_PRODUCTS:
      enrichableProps = [
        'listing.query',
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
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [VIEWED_CART]: 'onViewedCart',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
    };

    const method = methods[event.name];
    if (method) {
      if (this.trackingScriptCalled) {
        this.clearTrackingObjects();
      }
      this[method](event);
    }
  }

  onViewedPage(event) {
    this.pageTracked = false;

    const prefix = this.getOption('prefix');
    const trackingObjectCustomerName = prefix + 'customer';
    const user = event.user;

    if (user && (user.userId || user.email)) {
      let userId;
      let userEmailHash;
      if (user.userId) {
        userId = String(user.userId);
      }
      if (user.email) {
        userEmailHash = sha256(user.email).toString();
      }
      window[trackingObjectCustomerName] = {
        identifier: userId || '',
        mhash: userEmailHash || '',
      };
      deleteEmptyProperties(trackingObjectCustomerName);
    }

    timeoutHandler = setTimeout(() => {
      if (!this.pageTracked) {
        this.loadTrackingScript();
      }
    }, 100);
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

  onSearchedProducts(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'search';
    const listing = event.listing;

    if (listing && listing.query) {
      window[trackingObjectName] = {
        query: listing.query,
        type: 2, // retail products search
      };
      this.loadTrackingScript();
    }
  }

  onViewedCart(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectBasketName = prefix + 'basket';
    const cart = event.cart;

    if (cart && cart.lineItems) {
      const products = lineItemsToSociomanticsItems(cart.lineItems);
      if (products.length) {
        window[trackingObjectBasketName] = {
          products: products,
        };
        this.loadTrackingScript();
      }
    }
  }

  onCompletedTransaction(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectBasketName = prefix + 'basket';
    const transaction = event.transaction;

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
