import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import { getProp } from './../functions/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
} from './../events';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
];

function lineItemsToProductIds(lineItems) {
  lineItems = lineItems || [];
  const productIds = lineItems.filter((lineItem) => {
    return !!(lineItem.product.id || lineItem.product.skuCode);
  }).map((lineItem) => {
    return lineItem.product.id || lineItem.product.skuCode;
  });
  return productIds;
}

class GoogleAdWords extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      conversionId: '',
      remarketingOnly: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//www.googleadservices.com/pagead/conversion_async.js',
      },
    });
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
        'cart',
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

  getEventValidations(event) {
    let validations = [];
    switch (event.name) {
    case VIEWED_PAGE:
      validations = [
        ['page.type', { required: true }],
      ];
      break;
    case VIEWED_PRODUCT_DETAIL:
      validations = [
        ['product.id', { required: true }],
        ['product.unitSalePrice', { required: true }, { critical: false }],
        ['product.category', { required: true }, { critical: false }],
      ];
      break;
    case VIEWED_PRODUCT_LISTING:
      validations = [
        ['listing.category', { required: true }],
      ];
      break;
    case VIEWED_CART:
      if (event.cart && Array.isArray(event.cart.lineItems)) {
        validations = [
          ['cart.lineItems[].product.id', { required: true }],
        ];
        const subtotalValidation = ['cart.subtotal', { required: true }];
        if (getProp(event, 'cart.total')) {
          subtotalValidation.push({ critical: false });
        }
        validations.push(subtotalValidation);
      }
      break;
    case COMPLETED_TRANSACTION:
      validations = [
        ['transaction.lineItems[].product.id', { required: true }],
      ];
      const subtotalValidation = ['transaction.subtotal', { required: true }];
      if (getProp(event, 'transaction.total')) {
        subtotalValidation.push({ critical: false });
      }
      validations.push(subtotalValidation);
      break;
    default:
      // do nothing
    }

    return validations;
  }

  initialize() {
    this.asyncQueue = [];

    // emulate async queue for Google AdWords sync script
    let invervalCounter = 0;
    const invervalId = setInterval(() => {
      invervalCounter++;
      if (this.isLoaded()) {
        this.flushQueue();
        clearInterval(invervalId);
      } else if (invervalCounter > 10) {
        clearInterval(invervalId);
      }
    }, 100);

    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  isLoaded() {
    return !!window.google_trackConversion;
  }

  reset() {
    deleteProperty(window, 'google_trackConversion');
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [VIEWED_CART]: 'onViewedCart',
    };

    const method = methods[event.name];
    if (method && this.getOption('conversionId')) {
      this[method](event);
    }
  }

  trackConversion(params) {
    const trackConversionEvent = {
      google_conversion_id: this.getOption('conversionId'),
      google_custom_params: params,
      google_remarketing_only: this.getOption('remarketingOnly'),
    };
    if (this.isLoaded()) {
      window.google_trackConversion(trackConversionEvent);
    } else {
      this.asyncQueue.push(trackConversionEvent);
    }
  }

  flushQueue() {
    let trackConversionEvent = this.asyncQueue.shift();
    while (trackConversionEvent) {
      window.google_trackConversion(trackConversionEvent);
      trackConversionEvent = this.asyncQueue.shift();
    }
  }

  onViewedPage(event) {
    const page = event.page;
    // product, category, listing, cart, checkout and confirmation pages are tracked separately
    if (['product', 'listing', 'search', 'category', 'cart', 'checkout', 'confirmation'].indexOf(page.type) < 0) {
      this.trackConversion({
        ecomm_prodid: '',
        ecomm_pagetype: (page.type === 'home') ? 'home' : 'other',
        ecomm_totalvalue: '',
      });
    }
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (!product) {
      return;
    }
    let category = product.category;
    if (Array.isArray(category)) {
      category = category.join('/');
    } else if (category && product.subcategory) { // legacy DDL support
      category = category + '/' + product.subcategory;
    }

    this.trackConversion({
      ecomm_prodid: product.id,
      ecomm_pagetype: 'product',
      ecomm_totalvalue: product.unitSalePrice || '',
      ecomm_category: category,
    });
  }

  onSearchedProducts() {
    this.trackConversion({
      ecomm_prodid: '',
      ecomm_pagetype: 'searchresults',
      ecomm_totalvalue: '',
    });
  }

  onViewedProductListing(event) {
    const listing = event.listing;
    let params = {};

    if (listing) {
      if (listing.category) {
        let category = listing.category;
        if (Array.isArray(category)) {
          category = category.join('/');
        }
        params = {
          ecomm_pagetype: 'category',
          ecomm_category: category,
        };
      }
    }

    this.trackConversion(Object.assign({
      ecomm_prodid: '',
      ecomm_pagetype: 'other',
      ecomm_totalvalue: '',
    }, params));
  }

  onViewedCart(event) {
    const cart = event.cart;
    if (!cart) {
      return;
    }

    this.trackConversion({
      ecomm_prodid: lineItemsToProductIds(cart.lineItems),
      ecomm_pagetype: 'cart',
      ecomm_totalvalue: cart.subtotal || cart.total || '',
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (!transaction) {
      return;
    }
    this.trackConversion({
      ecomm_prodid: lineItemsToProductIds(transaction.lineItems),
      ecomm_pagetype: 'purchase',
      ecomm_totalvalue: transaction.subtotal || transaction.total || '',
    });
  }
}

export default GoogleAdWords;
