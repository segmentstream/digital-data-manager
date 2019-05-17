import cleanObject from 'driveback-utils/cleanObject';
import deleteProperty from 'driveback-utils/deleteProperty';
import Integration from '../Integration';
import AsyncQueue from './utils/AsyncQueue';

import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  STARTED_ORDER,
  COMPLETED_TRANSACTION,
} from '../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  STARTED_ORDER,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
];

const BUSINESS_TYPE_RETAIL = 'retail';
const BUSINESS_TYPE_CUSTOM = 'custom';

function lineItemsToProductIds(lineItems, feedWithGroupedProducts) {
  lineItems = lineItems || [];
  const productIds = lineItems
    .map(lineItem => ((!feedWithGroupedProducts) ? lineItem.product.id : lineItem.product.skuCode))
    .filter(productId => !!productId); // product id is not undefined
  return productIds;
}

function itemsToProductIds(items, feedWithGroupedProducts) {
  items = items || [];
  const productIds = items
    .map(product => ((!feedWithGroupedProducts) ? product.id : product.skuCode))
    .filter(productId => !!productId); // product id is not undefined
  return productIds;
}

class GoogleAdWords extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      conversionId: '',
      apiVersion: '',
      businessType: BUSINESS_TYPE_RETAIL,
      feedWithGroupedProducts: false,
    }, options);

    super(digitalData, optionsWithDefaults);
    this.isLoaded = this.isLoaded.bind(this);

    if (this.isGtag()) {
      this.addTag({
        type: 'script',
        attr: {
          async: true,
          src: `//www.googletagmanager.com/gtag/js?id=${this.getOption('conversionId')}`,
        },
      });
      this.load();
    } else {
      this.addTag({
        type: 'script',
        attr: {
          src: '//www.googleadservices.com/pagead/conversion_async.js',
        },
      });
    }
  }

  isGtag() {
    return this.getOption('apiVersion') === 'gtag.js';
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
        enrichableProps = this.getOption('businessType') === BUSINESS_TYPE_RETAIL
          ? ['listing.category'] : ['listing.items'];
        break;
      case SEARCHED_PRODUCTS:
        enrichableProps = ['listing.items'];
        break;
      case VIEWED_CART:
      case STARTED_ORDER:
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
      [VIEWED_PRODUCT_LISTING]: ((businessType) => {
        if (businessType === BUSINESS_TYPE_RETAIL) {
          return {
            fields: ['listing.category'],
            validations: {
              'listing.category': {
                errors: ['required'],
                warnings: ['array'],
              },
            },
          };
        }
        return {};
      })(this.getOption('businessType')),
      [STARTED_ORDER]: {
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
    if (this.isGtag()) {
      window.dataLayer = window.dataLayer || [];

      if (!window.gtag) {
        const gtag = function gtag() { window.dataLayer.push(arguments); };
        gtag('js', new Date());
        window.gtag = gtag;
      }
      window.gtag('config', this.getOption('trackingId'), { send_page_view: false });
    } else {
      this.asyncQueue = new AsyncQueue(this.isLoaded);
    }
  }

  allowNoConflictInitialization() {
    return true;
  }

  onLoadInitiated() {
    if (!this.isGtag()) this.asyncQueue.init();
  }

  isLoaded() {
    if (this.isGtag()) return !!window.gtag;
    return !!window.google_trackConversion;
  }

  reset() {
    if (this.isGtag()) {
      deleteProperty(window, 'gtag');
    } else {
      deleteProperty(window, 'google_trackConversion');
    }
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [STARTED_ORDER]: 'onStartedOrder',
      [VIEWED_CART]: 'onViewedCart',
    };

    const method = methods[event.name];
    if (method && this.getOption('conversionId')) {
      this[method](event);
    }
  }

  trackGtag(eventName, params) {
    params.send_to = this.getOption('conversionId');
    window.gtag('event', eventName, cleanObject(params));
  }

  trackConversion(params) {
    const trackConversionEvent = cleanObject({
      google_conversion_id: this.getOption('conversionId'),
      google_custom_params: params,
      google_remarketing_only: true,
    });
    if (this.isLoaded()) {
      window.google_trackConversion(trackConversionEvent);
    } else {
      this.asyncQueue.push(() => {
        window.google_trackConversion(trackConversionEvent);
      });
    }
  }

  getViewedCartParams(productIds, totalPrice) {
    const pageType = this.getOption('businessType') === BUSINESS_TYPE_CUSTOM ? 'conversionintent' : 'cart';

    return {
      [`${this.getPrefix()}_prodid`]: productIds,
      [`${this.getPrefix()}_totalvalue`]: totalPrice,
      [`${this.getPrefix()}_pagetype`]: pageType,
    };
  }

  getOrderStartParams(productIds, totalPrice) {
    return {
      [`${this.getPrefix()}_itemid`]: productIds,
      [`${this.getPrefix()}_pagetype`]: 'conversionintent',
      [`${this.getPrefix()}_totalvalue`]: totalPrice,
    };
  }

  getPrefix() {
    switch (this.getOption('businessType')) {
      case BUSINESS_TYPE_CUSTOM:
        return 'dynx';
      default:
        return 'ecomm';
    }
  }

  getViewedPageParams(pageType) {
    return {
      [`${this.getPrefix()}_pagetype`]: (pageType === 'home') ? 'home' : 'other',
    };
  }

  getViewedProductDetailParams(productId, category, unitPrice, unitSalePrice) {
    switch (this.getOption('businessType')) {
      case BUSINESS_TYPE_CUSTOM:
        return {
          [`${this.getPrefix()}_pagetype`]: 'offerdetail',
          [`${this.getPrefix()}_itemid`]: productId,
          [`${this.getPrefix()}_totalvalue`]: unitSalePrice,
        };
      default: // retail
        return {
          [`${this.getPrefix()}_pagetype`]: 'product',
          [`${this.getPrefix()}_prodid`]: productId,
          [`${this.getPrefix()}_totalvalue`]: unitSalePrice,
          [`${this.getPrefix()}_category`]: category,
          isSaleItem: this.isGtag() ? unitSalePrice < unitPrice : undefined,
        };
    }
  }

  getViewedProductListingParams(productIds, category) {
    switch (this.getOption('businessType')) {
      case BUSINESS_TYPE_CUSTOM:
        return {
          [`${this.getPrefix()}_pagetype`]: 'searchresults',
          [`${this.getPrefix()}_prodid`]: productIds,
        };
      default:
        return {
          [`${this.getPrefix()}_prodid`]: this.isGtag() ? productIds : undefined,
          [`${this.getPrefix()}_pagetype`]: 'category',
          [`${this.getPrefix()}_category`]: category,
        };
    }
  }

  getSearchedProductsParams(productIds) {
    switch (this.getOption('businessType')) {
      case BUSINESS_TYPE_CUSTOM:
        return {
          [`${this.getPrefix()}_pagetype`]: 'searchresults',
          [`${this.getPrefix()}_itemid`]: productIds,
        };
      default:
        return {
          [`${this.getPrefix()}_prodid`]: this.isGtag() ? productIds : undefined,
          [`${this.getPrefix()}_pagetype`]: 'searchresults',
        };
    }
  }

  getCompletedTransactionParams(productIds, transactionTotal) {
    switch (this.getOption('businessType')) {
      case BUSINESS_TYPE_CUSTOM:
        return {
          [`${this.getPrefix()}_pagetype`]: 'conversion',
          [`${this.getPrefix()}_itemid`]: productIds,
          [`${this.getPrefix()}_totalvalue`]: transactionTotal,
        };
      default:
        return {
          [`${this.getPrefix()}_pagetype`]: 'purchase',
          [`${this.getPrefix()}_prodid`]: productIds,
          [`${this.getPrefix()}_totalvalue`]: transactionTotal,
        };
    }
  }

  onViewedPage(event) {
    const { page } = event;
    this.pageTracked = false;
    setTimeout(() => {
      if (!this.pageTracked) {
        const params = this.getViewedPageParams(page.type);
        if (this.isGtag()) {
          this.trackGtag('page_view', params);
        } else {
          this.trackConversion(params);
        }
      }
    }, 100);
  }

  onViewedProductDetail(event) {
    const { product } = event;

    if (!product) return;

    let { category } = product;
    if (Array.isArray(category)) {
      category = category.join('/');
    } else if (category && product.subcategory) { // legacy DDL support
      category = `${category}/${product.subcategory}`;
    }

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productId = (!feedWithGroupedProducts) ? product.id : product.skuCode;
    const unitSalePrice = product.unitSalePrice || 0;

    const params = this.getViewedProductDetailParams(productId, category, product.unitPrice, unitSalePrice);
    if (this.isGtag()) {
      this.trackGtag('page_view', params);
    } else {
      this.trackConversion(params);
    }

    this.pageTracked = true;
  }

  onSearchedProducts(event) {
    const listing = event.listing || [];
    const productIds = itemsToProductIds(listing.items);

    const params = this.getSearchedProductsParams(productIds);
    if (this.isGtag()) {
      this.trackGtag('page_view', params);
    } else {
      this.trackConversion(params);
    }
    this.pageTracked = true;
  }

  onViewedProductListing(event) {
    const { listing } = event;
    let params = {};

    if (listing) {
      let { category } = listing;

      if (Array.isArray(category)) {
        category = category.join('/');
      }

      const productIds = itemsToProductIds(listing.items);
      params = this.getViewedProductListingParams(productIds, category);
    }

    if (this.isGtag()) {
      this.trackGtag('page_view', params);
    } else {
      this.trackConversion(params);
    }
    this.pageTracked = true;
  }

  onViewedCart(event) {
    const { cart } = event;
    const businessType = this.getOption('businessType');
    if (!cart
        || (!this.isGtag()
            && (businessType && businessType !== BUSINESS_TYPE_RETAIL))) {
      return;
    }

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productIds = lineItemsToProductIds(cart.lineItems, feedWithGroupedProducts);
    const params = this.getViewedCartParams(productIds, cart.subtotal || cart.total || 0);
    if (this.isGtag()) {
      this.trackGtag('page_view', params);
    } else {
      this.trackConversion(params);
    }
    this.pageTracked = true;
  }

  onStartedOrder(event) {
    const { cart } = event;
    const businessType = this.getOption('businessType');
    if (!cart || !businessType || businessType === BUSINESS_TYPE_RETAIL) {
      return;
    }

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productIds = lineItemsToProductIds(cart.lineItems, feedWithGroupedProducts);
    const totalPrice = cart.subtotal || cart.total || 0;
    const params = this.getOrderStartParams(productIds, totalPrice);

    if (this.isGtag()) {
      this.trackGtag('page_view', params);
    } else {
      this.trackConversion(params);
    }
    this.pageTracked = true;
  }

  onCompletedTransaction(event) {
    const { transaction } = event;

    if (!transaction) return;

    const feedWithGroupedProducts = this.getOption('feedWithGroupedProducts');
    const productIds = lineItemsToProductIds(transaction.lineItems, feedWithGroupedProducts);
    const transactionTotal = transaction.subtotal || transaction.total || 0;

    const params = this.getCompletedTransactionParams(productIds, transactionTotal);
    if (this.isGtag()) {
      this.trackGtag('page_view', params);
    } else {
      this.trackConversion(params);
    }

    this.pageTracked = true;
  }
}

export default GoogleAdWords;
