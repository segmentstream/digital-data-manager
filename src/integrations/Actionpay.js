import Integration from './../Integration';
import getQueryParam from 'driveback-utils/getQueryParam';
import topDomain from 'driveback-utils/topDomain';
import { getProp } from 'driveback-utils/dotProp';
import normalizeString from 'driveback-utils/normalizeString';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_LISTING,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  VIEWED_CHECKOUT_STEP,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  ADDED_PRODUCT_TO_WISHLIST,
  REMOVED_PRODUCT_FROM_WISHLIST,
  REGISTERED,
} from './../events/semanticEvents';
import cookie from 'js-cookie';
import cleanObject from 'driveback-utils/cleanObject';

const PARTNER_ID_GET_PARAM = 'actionpay';
const DEFAULT_COOKIE_NAME = 'actionpay';

function normalizeOptions(options) {
  if (options.deduplication) {
    if (options.utmSource) {
      options.utmSource = normalizeString(options.utmSource);
    }
    if (options.deduplicationUtmMedium) {
      options.deduplicationUtmMedium = options.deduplicationUtmMedium.map(normalizeString);
    }
  }
}

class Actionpay extends Integration {
  constructor(digitalData, options) {
    normalizeOptions(options);
    const optionsWithDefaults = Object.assign({
      defaultGoalId: '',
      cookieName: DEFAULT_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: topDomain(window.location.href),
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: 'actionpay', // utm_source which is sent with actionpay get param
      deduplicationUtmMedium: [],
      aprt: false,
      aprtPartnerId: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.SEMANTIC_EVENTS = [
      COMPLETED_TRANSACTION,
    ];

    this.addTag('trackingPixel', {
      type: 'img',
      attr: {
        src: '//apypx.com/ok/{{ goalId }}.png?actionpay={{ partnerId }}&apid={{ actionId }}&price={{ total }}',
      },
    });

    if (options.aprtPartnerId) {
      this.addTag('aprt', {
        type: 'script',
        attr: {
          src: `//aprtx.com/code/${options.aprtPartnerId}/`,
        },
      });
    }
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('cookieTracking')) {
      this.addAffiliateCookie();
    }
  }

  trackAPRT(aprtData) {
    if (window.APRT_SEND) { // async implementation
      window.APRT_SEND(cleanObject(aprtData));
    } else {
      window.APRT_DATA = cleanObject(aprtData);
      this.load('aprt');
    }
  }

  trackAPRTCurrentProduct(pageType, product) {
    this.trackAPRT({
      pageType,
      currentProduct: {
        id: product.id,
        name: product.name,
        price: product.unitSalePrice,
      },
    });
  }

  addAffiliateCookie() {
    if (window.self !== window.top) {
      return; // protect from iframe cookie-stuffing
    }

    const partnerId = getQueryParam(PARTNER_ID_GET_PARAM);
    if (partnerId) {
      cookie.set(this.getOption('cookieName'), partnerId, {
        expires: this.getOption('cookieTtl'),
        domain: this.getOption('cookieDomain'),
      });
    }
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];

    if (event.name === COMPLETED_TRANSACTION) {
      enrichableProps = [
        'transaction',
        'context.campaign',
      ];
    }

    return enrichableProps;
  }

  getEventValidationConfig(event) {
    const config = {
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'context.campaign.source',
          'context.campaign.medium',
          'integrations.actionpay.goalId',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric'],
          },
        },
      },
    };

    return config[event.name];
  }

  isLoaded() {
    return this._isLoaded;
  }

  getBasketProducts(cart) {
    const lineItems = cart.lineItems || [];
    return lineItems.map(lineItem => ({
      id: getProp(lineItem, 'product.id'),
      name: getProp(lineItem, 'product.name'),
      price: getProp(lineItem, 'product.unitSalePrice'),
      quantity: lineItem.quantity || 1,
    }));
  }

  trackEvent(event) {
    // retag tracking
    if (this.getOption('aprt')) {
      const methods = {
        [VIEWED_PAGE]: 'onViewedPage',
        [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
        [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
        [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
        [VIEWED_CHECKOUT_STEP]: 'onViewedCheckoutStep',
        [VIEWED_CART]: 'onViewedCart',
        [ADDED_PRODUCT]: 'onAddedProduct',
        [REMOVED_PRODUCT]: 'onRemovedProduct',
        [ADDED_PRODUCT_TO_WISHLIST]: 'onAddedProductToWishlist',
        [REMOVED_PRODUCT_FROM_WISHLIST]: 'onRemovedProductFromWishlist',
        [REGISTERED]: 'onRegistered',
        [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      };

      const method = methods[event.name];
      if (method) {
        this[method](event);
      }
    }

    const partnerId = cookie.get(this.getOption('cookieName'));
    if (!partnerId) return;

    if (this.isDeduplication(event)) return;
    if (event.name === COMPLETED_TRANSACTION) {
      this.trackSale(event, partnerId);
    }
  }

  onViewedPage(event) {
    const page = event.page || {};
    if (page.type === 'home') {
      this.onViewedHome(event);
    } else {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.trackAPRT({ pageType: 0 });
        }
      }, 100);
    }
  }

  onViewedHome() {
    this.trackAPRT({ pageType: 1 });
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    const categoryId = listing.categoryId;
    let category;
    if (Array.isArray(listing.category) && listing.category.length) {
      category = listing.category[listing.category.length - 1];
    }
    this.trackAPRT({
      pageType: 3,
      currentCategory: {
        id: categoryId,
        name: category,
      },
    });
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    let category;
    if (Array.isArray(product.category) && product.category.length) {
      category = product.category[product.category.length - 1];
    }

    this.trackAPRT({
      pageType: 2,
      currentProduct: {
        id: product.id,
        name: product.name,
        price: product.unitSalePrice,
      },
      currentCategory: {
        id: product.categoryId,
        name: category,
      },
    });
  }

  onViewedCart(event) {
    const cart = event.cart || {};
    this.trackAPRT({
      pageType: 4,
      basketProducts: this.getBasketProducts(cart),
    });
  }

  onViewedCheckoutStep(event) {
    const cart = event.cart || {};
    this.trackAPRT({
      pageType: 5,
      basketProducts: this.getBasketProducts(cart),
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    this.trackAPRT({
      pageType: 6,
      purchasedProducts: this.getBasketProducts(transaction),
      orderInfo: {
        id: transaction.orderId,
        totalPrice: transaction.total,
      },
    });
  }

  onAddedProduct(event) {
    const product = event.product || {};
    this.trackAPRTCurrentProduct(8, product);
  }

  onRemovedProduct(event) {
    const product = event.product || {};
    this.trackAPRTCurrentProduct(9, product);
  }

  onAddedProductToWishlist(event) {
    const product = event.product || {};
    this.trackAPRTCurrentProduct(10, product);
  }

  onRemovedProductFromWishlist(event) {
    const product = event.product || {};
    this.trackAPRTCurrentProduct(11, product);
  }

  onRegistered(event) {
    const user = event.user || {};
    this.trackAPRT({
      pageType: 13,
      userInfo: {
        id: user.userId,
      },
    });
  }

  isDeduplication(event) {
    if (this.getOption('deduplication')) {
      const campaignSource = getProp(event, 'context.campaign.source');
      if (!campaignSource || campaignSource.toLowerCase() !== this.getOption('utmSource')) {
        // last click source is not actionpay
        const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium') || [];
        if (!deduplicationUtmMedium || deduplicationUtmMedium.length === 0) {
          // deduplicate with everything
          return true;
        }
        const campaignMedium = getProp(event, 'context.campaign.medium');
        if (deduplicationUtmMedium.indexOf(campaignMedium.toLowerCase()) >= 0) {
          // last click medium is deduplicated
          return true;
        }
      }
    }
    return false;
  }

  trackSale(event, partnerId) {
    const transaction = event.transaction;

    if (!transaction || !transaction.orderId || !transaction.total) {
      return;
    }

    const goalId = getProp(event, 'integrations.actionpay.goalId') || this.getOption('defaultGoalId');
    const actionId = transaction.orderId;
    const shippingCost = transaction.shippingCost || 0;
    const total = transaction.total - shippingCost;

    this.load('trackingPixel', { goalId, actionId, partnerId, total });
  }
}

export default Actionpay;
