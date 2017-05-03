import Integration from './../Integration.js';
import { getProp } from './../functions/dotProp';
import { ERROR_TYPE_NOTICE } from './../EventValidator';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  ADDED_PRODUCT,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_TRANSACTION,
} from './../events';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  ADDED_PRODUCT,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_TRANSACTION,
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
        'cart',
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
    case COMPLETED_TRANSACTION:
      return [
        'context.campaign',
        'transaction',
      ];
    default:
      return [];
    }
  }

  getEventValidations(event) {
    switch (event.name) {
    case VIEWED_PAGE:
      const validations = [
        ['page.type', { required: true }],
        ['cart', { required: true }, ERROR_TYPE_NOTICE],
      ];
      if (event.cart && Array.isArray(event.cart.lineItems)) {
        validations.push(['cart.lineItems[].product.id', { required: true }]);
      }
      return validations;
    case VIEWED_PRODUCT_DETAIL:
      return [
        ['product.id', { required: true }],
      ];
    case ADDED_PRODUCT:
      return [
        ['product.id', { required: true }],
      ];
    case VIEWED_PRODUCT_LISTING:
      return [
        ['listing.categoryId', { required: true }],
      ];
    case SEARCHED_PRODUCTS:
      const listing = event.listing || {};
      if (!listing.items || !Array.isArray(listing.items) || listing.length > 0) {
        return [
          ['listing.items[].id', { required: true }],
        ];
      }
      return [];
    case VIEWED_CHECKOUT_STEP:
      return [
        ['step', { required: true }],
      ];
    case COMPLETED_TRANSACTION:
      return [
        ['transaction.orderId', { required: true }],
        ['transaction.total', { required: true }],
        ['transaction.lineItems[].product.id', { required: true }],
      ];
    default:
      return [];
    }
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
      [ADDED_PRODUCT]: 'onAddedProduct',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage(event) {
    const page = event.page;
    const cart = event.cart;

    if (page && page.type === 'home') {
      this.onViewedHome();
    }

    if (cart && cart.lineItems && cart.lineItems.length) {
      this.trackCart(cart);
    }

    if (!this.pageTracked) {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.onViewedOther();
        }
      }, 100);
    }
  }

  trackCart(cart) {
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
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (product && product.id) {
      this.load('offer', { productId: product.id });
      this.pageTracked = true;
    }
  }

  onAddedProduct(event) {
    const product = event.product;
    if (product && product.id) {
      this.load('basketadd', { productId: product.id });
      this.pageTracked = true;
    }
  }

  onViewedCheckoutStep(event) {
    const step = event.step || 1;
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
