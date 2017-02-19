import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
} from './../events';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
];

function go() {
  window.ScarabQueue.push(['go']);
}

function calculateLineItemSubtotal(lineItem) {
  const product = lineItem.product;
  const price = product.unitSalePrice || product.unitPrice || 0;
  const quantity = lineItem.quantity || 1;
  return price * quantity;
}

function mapLineItems(lineItems) {
  return lineItems.map((lineItem) => {
    const product = lineItem.product;
    const lineItemSubtotal = lineItem.subtotal || calculateLineItemSubtotal(lineItem);
    return {
      item: product.id || product.skuCode,
      price: lineItemSubtotal,
      quantity: lineItem.quantity || 1,
    };
  });
}

class Emarsys extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      merchantId: '',
      categorySeparator: ' > ',
      noConflict: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        id: 'scarab-js-api',
        src: `//recommender.scarabresearch.com/js/${options.merchantId}/scarab-v2.js`,
      },
    });
  }

  initialize() {
    window.ScarabQueue = window.ScarabQueue || [];
    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case VIEWED_PAGE:
      enrichableProps = [
        'page.type',
        'user.email',
        'user.userId',
        'cart',
      ];
      break;
    case VIEWED_PRODUCT_DETAIL:
      enrichableProps = [
        'product.id',
        'product.skuCode',
      ];
      break;
    case VIEWED_PRODUCT_LISTING:
      enrichableProps = [
        'listing.category',
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

  isLoaded() {
    return (typeof ScarabQueue === 'object');
  }

  reset() {
    deleteProperty(window, 'ScarabQueue');
  }

  enrichDigitalData() {
    // TODO
    /*
    ScarabQueue.push(['recommend', {
      logic: 'TOPICAL',
      limit: 2,
      containerId: 'personal-recs',
      success: function(SC) {
        var container = SC.recommender.container;
        delete SC.recommender.container;
        container.innerHTML = JSON.stringify(SC, null, '  ');
        done();
      }
    }]);
    ScarabQueue.push(['go']);
    */
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (this.getOption('merchantId')) {
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      } else if (!method) {
        this.trackCustomEvent(event);
      }
    }
  }

  onViewedPage(event) {
    const user = event.user || {};
    const cart = event.cart || {};
    const page = event.page;

    if (user.email) {
      window.ScarabQueue.push(['setEmail', user.email]);
    } else if (user.userId) {
      window.ScarabQueue.push(['setCustomerId', user.userId]);
    }
    if (cart.lineItems && cart.lineItems.length > 0) {
      window.ScarabQueue.push(['cart', mapLineItems(cart.lineItems)]);
    } else {
      window.ScarabQueue.push(['cart', []]);
    }

    // product, category, search and confirmation pages are tracked separately
    if (['product', 'category', 'search', 'confirmation'].indexOf(page.type) < 0) {
      go();
    }
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    let category = listing.category;
    if (category) {
      if (Array.isArray(category)) {
        category = category.join(this.getOption('categorySeparator'));
      }
      window.ScarabQueue.push(['category', category]);
    }
    go();
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    if (product.id || product.skuCode) {
      window.ScarabQueue.push(['view', product.id || product.skuCode]);
    }
    go();
  }

  onSearchedProducts(event) {
    const listing = event.listing || {};
    if (listing.query) {
      window.ScarabQueue.push(['searchTerm', listing.query]);
    }
    go();
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    if (transaction.orderId && transaction.lineItems) {
      window.ScarabQueue.push(['purchase', {
        orderId: transaction.orderId,
        items: mapLineItems(transaction.lineItems),
      }]);
    }
    go();
  }
}

export default Emarsys;
