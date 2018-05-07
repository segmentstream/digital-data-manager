import Integration from './../Integration';
import AsyncQueue from './utils/AsyncQueue';
import deleteProperty from 'driveback-utils/deleteProperty';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
];

function lineItemsToProductIds(lineItems, feedWithGroupedProducts) {
  lineItems = lineItems || [];
  const productIds = lineItems
    .filter(lineItem => !!(lineItem.product.id || lineItem.product.skuCode))
    .map(lineItem => ((!feedWithGroupedProducts) ? lineItem.product.id : lineItem.product.skuCode));
  return productIds;
}

class GoogleAdWords extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      conversionId: '',
      feedWithGroupedProducts: false,
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
        fields: [
          'product.id',
          'product.skuCode',
          'product.unitSalePrice',
          'product.category',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
          'product.category': {
            warnings: ['required', 'array'],
          },
        },
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
      [VIEWED_CART]: {
        fields: [
          'cart.subtotal',
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.skuCode',
        ],
        validations: {
          'cart.subtotal': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.subtotal',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.skuCode',
        ],
        validations: {
          'transaction.subtotal': {
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
    this.asyncQueue = new AsyncQueue(this.isLoaded);
  }

  onLoadInitiated() {
    this.asyncQueue.init();
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
      google_remarketing_only: true,
    };
    if (this.isLoaded()) {
      window.google_trackConversion(trackConversionEvent);
    } else {
      this.asyncQueue.push(() => {
        window.google_trackConversion(trackConversionEvent);
      });
    }
  }

  onViewedPage(event) {
    const page = event.page;
    this.pageTracked = false;
    setTimeout(() => {
      if (!this.pageTracked) {
        this.trackConversion({
          ecomm_prodid: '',
          ecomm_pagetype: (page.type === 'home') ? 'home' : 'other',
          ecomm_totalvalue: '',
        });
      }
    }, 100);
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
      category = `${category}/${product.subcategory}`;
    }

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    this.trackConversion({
      ecomm_prodid: (!feedWithGroupedProducts) ? product.id : product.skuCode,
      ecomm_pagetype: 'product',
      ecomm_totalvalue: product.unitSalePrice || '',
      ecomm_category: category,
    });
    this.pageTracked = true;
  }

  onSearchedProducts() {
    this.trackConversion({
      ecomm_prodid: '',
      ecomm_pagetype: 'searchresults',
      ecomm_totalvalue: '',
    });
    this.pageTracked = true;
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
    this.pageTracked = true;
  }

  onViewedCart(event) {
    const cart = event.cart;
    if (!cart) {
      return;
    }

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    this.trackConversion({
      ecomm_prodid: lineItemsToProductIds(cart.lineItems, feedWithGroupedProducts),
      ecomm_pagetype: 'cart',
      ecomm_totalvalue: cart.subtotal || cart.total || '',
    });
    this.pageTracked = true;
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (!transaction) {
      return;
    }

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    this.trackConversion({
      ecomm_prodid: lineItemsToProductIds(transaction.lineItems, feedWithGroupedProducts),
      ecomm_pagetype: 'purchase',
      ecomm_totalvalue: transaction.subtotal || transaction.total || '',
    });
    this.pageTracked = true;
  }
}

export default GoogleAdWords;
