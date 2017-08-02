import Integration from './../Integration';
import deleteProperty from './../functions/deleteProperty';
import { getProp } from './../functions/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
];

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

  getEventValidationConfig(event) {
    let viewedPageValidations = {
      'page.type': {
        errors: ['required', 'string'],
      },
      'user.email': {
        errors: ['string'],
      },
      'user.userId': {
        warnings: ['string'],
      },
    };

    // validate cart if it is not empty
    const lineItems = getProp(event, 'cart.lineItems');
    if (lineItems && lineItems.length) {
      viewedPageValidations = Object.assign(viewedPageValidations, {
        'cart.lineItems[].product.id': {
          warnings: ['required', 'string'],
        },
        'cart.lineItems[].product.unitSalePrice': {
          warnings: ['required', 'numeric'],
        },
        'cart.lineItems[].qantity': {
          warnings: ['required', 'numeric'],
        },
      });
    }
    const config = {
      [VIEWED_PAGE]: {
        fields: [
          'page.type',
          'user.email',
          'user.userId',
          'cart.lineItems',
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.unitSalePrice',
          'cart.lineItems[].quantity',
        ],
        validations: viewedPageValidations,
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: ['listing.category'],
        validations: {
          'listing.category': {
            errors: ['required'],
            warnings: ['array'],
          },
        },
      },
      [SEARCHED_PRODUCTS]: {
        fields: ['listing.query'],
        validations: {
          'listing.query': {
            errors: ['required', 'string'],
          },
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: ['product.id'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].qantity',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
          'transaction.lineItems[].qantity': {
            warnings: ['required', 'numeric'],
          },
        },
      },
    };

    return config[event.name];
  }

  isLoaded() {
    return !!(window.ScarabQueue && !Array.isArray(window.ScarabQueue));
  }

  reset() {
    deleteProperty(window, 'ScarabQueue');
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
    }
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

  go() {
    window.ScarabQueue.push(['go']);
    this.pageTracked = true;
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
    this.pageTracked = false;

    const user = event.user || {};
    const cart = event.cart || {};

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

    if (!this.pageTracked) {
      this.timeoutHandle = setTimeout(() => {
        if (!this.pageTracked) {
          this.go();
        }
      }, 100);
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
    this.go();
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    if (product.id || product.skuCode) {
      window.ScarabQueue.push(['view', product.id || product.skuCode]);
    }
    this.go();
  }

  onSearchedProducts(event) {
    const listing = event.listing || {};
    if (listing.query) {
      window.ScarabQueue.push(['searchTerm', listing.query]);
    }
    this.go();
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    if (transaction.orderId && transaction.lineItems) {
      window.ScarabQueue.push(['purchase', {
        orderId: transaction.orderId,
        items: mapLineItems(transaction.lineItems),
      }]);
    }
    this.go();
  }
}

export default Emarsys;
