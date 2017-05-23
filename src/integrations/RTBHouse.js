import Integration from './../Integration.js';
import { getProp } from './../functions/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
} from './../events';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
];

const DEFAULT_DEDUPLICATION = 'default';
const RTBHOUSE_UTM_SOURCE = 'rtbhouse';

class RTBHouse extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      accountKey: '',
      customDeduplication: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag({
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}`,
      },
    });
    this.addTag('home', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_home`,
      },
    });
    this.addTag('category2', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_category2_{{ categoryId }}`,
      },
    });
    this.addTag('offer', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_offer_{{ productId }}`,
      },
    });
    this.addTag('listing', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_listing_{{ productIds }}`,
      },
    });
    this.addTag('basketadd', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_VB82iQFyqcxTg1HWJlJM_basketadd_{{ productId }}`,
      },
    });
    this.addTag('basketstatus', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_basketstatus_{{ productIds }}`,
      },
    });
    this.addTag('startorder', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_startorder`,
      },
    });
    this.addTag('orderstatus2', {
      type: 'script',
      attr: {
        src: `//creativecdn.com/tags?type=script&id=pr_${options.accountKey}_orderstatus2_{{ total }}_{{ orderId }}_{{ productIds }}&cd={{ deduplication }}`,
      },
    });
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
    case VIEWED_PAGE:
      return [
        'page.type',
      ];
    case VIEWED_PRODUCT_DETAIL:
      return [
        'product.id',
      ];
    case VIEWED_PRODUCT_LISTING:
      return [
        'listing.categoryId',
      ];
    case SEARCHED_PRODUCTS:
      return [
        'listing.items',
      ];
    case VIEWED_CART:
      return [
        'cart',
      ];
    case COMPLETED_TRANSACTION:
      return [
        'context.campaign',
        'transaction',
      ];
    default:
      return [];
    }
  }

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PAGE]: {
        fields: ['page.type'],
        validations: {
          'page.type': {
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
      [VIEWED_PRODUCT_LISTING]: {
        fields: ['listing.categoryId'],
        validations: {
          'listing.categoryId': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [SEARCHED_PRODUCTS]: {
        fields: ['listing.items[].id'],
        validations: {
          'listing.items[].id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_CART]: {
        fields: ['cart.lineItems[].product.id'],
        validations: {
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_CHECKOUT_STEP]: {
        fields: ['step'],
        validations: {
          'step': {
            warnings: ['required'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'transaction.lineItems[].product.id',
        ],
        validation: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
    };

    return config[event.name];
  }

  initialize() {
    this._isLoaded = true;
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [VIEWED_CHECKOUT_STEP]: 'onViewedCheckoutStep',
      [VIEWED_CART]: 'onViewedCart',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage(event) {
    const page = event.page;

    if (page && page.type === 'home') {
      this.onViewedHome();
    }

    if (!this.pageTracked) {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.onViewedOther();
        }
      }, 100);
    }
  }

  onViewedCart(event) {
    const cart = event.cart;
    if (!cart || !cart.lineItems || !cart.lineItems.length) return;
    const productIds = cart.lineItems.reduce((str, lineItem, index) => {
      const productId = getProp(lineItem, 'product.id');
      if (index > 0) {
        return [str, productId].join(',');
      }
      return productId;
    }, '');
    this.load('basketstatus', { productIds });
    this.pageTracked = true;
  }

  onViewedHome() {
    this.load('home');
    this.pageTracked = true;
  }

  onViewedOther() {
    this.load();
    this.pageTracked = true;
  }

  onViewedProductListing(event) {
    const listing = event.listing;
    if (!listing || !listing.categoryId) return;

    this.load('category2', { categoryId: listing.categoryId });
    this.pageTracked = true;
  }

  onSearchedProducts(event) {
    const listing = event.listing;
    if (!listing || !listing.items || !listing.items.length) return;

    const productIds = listing.items.reduce((str, product, index) => {
      if (index > 0) {
        return [str, product.id].join(',');
      }
      return product.id;
    }, '');
    this.load('listing', { productIds });
    this.pageTracked = true;
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (product && product.id) {
      this.load('offer', { productId: product.id });
      this.pageTracked = true;
    }
  }

  /*
  onAddedProduct(event) {
    const product = event.product;
    if (product && product.id) {
      this.load('basketadd', { productId: product.id });
      this.pageTracked = true;
    }
  }*/

  onViewedCheckoutStep(event) {
    const step = (event.step !== undefined) ? event.step : 1;
    if (step === 1) {
      this.load('startorder');
    }
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (transaction && transaction.orderId && transaction.lineItems && transaction.lineItems.length > 0) {
      const orderId = transaction.orderId;
      const total = transaction.total;
      const productIds = transaction.lineItems.reduce((str, lineItem, index) => {
        const productId = getProp(lineItem, 'product.id');
        if (index > 0) {
          return [str, productId].join(',');
        }
        return productId;
      }, '');

      let deduplication = DEFAULT_DEDUPLICATION;
      if (this.getOption('customDeduplication')) {
        const currentSource = getProp(event, 'context.campaign.source');
        if (currentSource === RTBHOUSE_UTM_SOURCE) {
          deduplication = false;
        } else {
          deduplication = true;
        }
      }

      this.load('orderstatus2', { productIds, orderId, total, deduplication });
      this.pageTracked = true;
    }
  }
}

export default RTBHouse;
