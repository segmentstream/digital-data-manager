import cleanObject from '@segmentstream/utils/cleanObject';
import noop from '@segmentstream/utils/noop';
import topDomain from '@segmentstream/utils/topDomain';
import normalizeString from '@segmentstream/utils/normalizeString';
import uuid from 'uuid/v1';
import { getProp } from '@segmentstream/utils/dotProp';
import getQueryParam from '@segmentstream/utils/getQueryParam';
import {
  normalizeOptions, addAffiliateCookie, removeAffiliateCookie, isDeduplication, getAffiliateCookie,
} from './utils/affiliate';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
} from '../events/semanticEvents';
import Integration from '../Integration';

const DEFAUL_TRACK_ID_COOKIE_NAME = 'advcake_trackid';
const DEFAULT_URL_COOKIE_NAME = 'advcake_url';

function getBasketProducts(lineItems) {
  lineItems = lineItems || [];
  return lineItems.map((lineItem) => {
    const product = lineItem.product || {};
    product.category = product.category || [];
    return cleanObject({
      id: product.id,
      name: product.name,
      price: product.unitSalePrice,
      quantity: lineItem.quantity || 1,
      categoryId: product.categoryId,
      categoryName: product.category[product.category.length - 1],
      brand: product.manufacturer,
    });
  });
}

function getProducts(items) {
  items = items || [];
  return items.map(product => ({
    id: product.id,
    name: product.name,
    price: product.unitSalePrice,
  }));
}

function getCurrentCategory(source) {
  const id = source.categoryId;
  let name;
  if (Array.isArray(source.category)) {
    name = source.category[source.category.length - 1];
  } else {
    name = source.category;
  }
  return cleanObject({ id, name });
}

function getCurrentProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.unitSalePrice,
    brand: product.manufacturer,
  };
}

function getUser(user) {
  if (user.email) {
    return {
      email: user.email,
    };
  }
  return undefined;
}

class AdvCake extends Integration {
  constructor(digitalData, options) {
    normalizeOptions(options);
    const optionsWithDefaults = Object.assign({
      trackIdCookieName: DEFAUL_TRACK_ID_COOKIE_NAME,
      urlCookieName: DEFAULT_URL_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: topDomain(window.location.href),
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: 'advcake', // utm_source for advcake links
      deduplicationUtmMedium: [],
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        id: 'advcakeAsync',
        src: '//code.acstat.com',
      },
    });
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case VIEWED_PAGE:
        return ['page.type', 'cart', 'user.email', 'context.campaign'];
      case VIEWED_PRODUCT_DETAIL:
        return ['product'];
      case COMPLETED_TRANSACTION:
        return ['transaction', 'user.email'];
      case VIEWED_PRODUCT_LISTING:
        return ['listing'];
      case VIEWED_CART:
        return ['cart'];
      default:
        return [];
    }
  }

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PAGE]: {
        fields: [
          'page.type',
          'user.email',
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.name',
          'cart.lineItems[].product.unitSalePrice',
          'cart.lineItems[].quantity',
          'context.campaign.medium',
          'context.campaign.source',
        ],
        validations: {
          'page.type': {
            errors: ['required', 'string'],
          },
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: [
          'product.id',
          'product.name',
          'product.categoryId',
          'product.category',
          'product.unitSalePrice',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.name': {
            warnings: ['required', 'string'],
          },
          'product.categoryId': {
            warnings: ['required', 'string'],
          },
          'product.category': {
            warnings: ['required', 'array'],
          },
          'product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: [
          'listing.categoryId',
          'listing.category',
          'listing.items[].id',
          'listing.items[].name',
        ],
        validations: {
          'listing.categoryId': {
            warnings: ['required', 'string'],
          },
          'listing.category': {
            warnings: ['required', 'array'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'user.email',
          'transaction.orderId',
          'transaction.total',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].quantity',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.total': {
            warnings: ['required', 'numeric'],
          },
          'transaction.lineItems[].product.id': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.name': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.categoryId': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.category': {
            warnings: ['required', 'array'],
          },
          'transaction.lineItems[].product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
          'transaction.lineItems[].quantity': {
            warnings: ['required', 'numeric'],
          },
        },
      },
    };

    return config[event.name];
  }

  getSemanticEvents() {
    return [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      COMPLETED_TRANSACTION,
      VIEWED_CART,
    ];
  }

  initialize() {
    window.advcake_push_data = window.advcake_push_data || noop;
    window.advcake_order = window.advcake_order || function advcakeOrder(orderId, orderPrice) {
      window.advcake_order_id = orderId;
      window.advcake_order_price = orderPrice;
    };

    this.addAffiliateCookies();
  }

  isLoaded() {
    return !!window.advcake_int;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [VIEWED_CART]: 'onViewedCart',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  addAffiliateCookies() {
    if (this.getOption('cookieTracking')) {
      const advcakeSource = normalizeString(this.getOption('utmSource'));
      const trackIdCookieName = this.getOption('trackIdCookieName');
      if (getQueryParam('utm_source') === advcakeSource) {
        const urlCookieName = this.getOption('urlCookieName');
        const domain = this.getOption('cookieDomain');
        const ttl = this.getOption('cookieTtl');
        const trackId = uuid().replace(/-/g, '');
        addAffiliateCookie(trackIdCookieName, trackId, ttl, domain);
        addAffiliateCookie(urlCookieName, window.location.href, ttl, domain);
      }
    }
  }

  removeAffiliateCookies() {
    const domain = this.getOption('cookieDomain');
    const urlCookieName = this.getOption('urlCookieName');
    const trackIdCookieName = this.getOption('trackIdCookieName');
    removeAffiliateCookie(trackIdCookieName, domain);
    removeAffiliateCookie(urlCookieName, domain);
  }

  onViewedPage(event) {
    const page = event.page || {};
    const campaign = getProp(event, 'context.campaign') || {};
    const utmSource = campaign.source;

    this.cart = event.cart || {};
    this.user = event.user || {};

    const trackIdCookieName = this.getOption('trackIdCookieName');
    const advcakeSource = normalizeString(this.getOption('utmSource'));
    if (utmSource && utmSource !== advcakeSource && getAffiliateCookie(trackIdCookieName)) {
      const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium');
      if (isDeduplication(campaign, advcakeSource, deduplicationUtmMedium)) {
        this.removeAffiliateCookies();
      }
    }

    if (page.type === 'home') {
      this.onViewedHome();
    } else if (page.type === 'checkout') {
      this.onViewedCheckoutPage();
    }
  }

  onViewedHome() {
    window.advcake_data = {
      pageType: 1,
      user: getUser(this.user),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedProductDetail(event) {
    window.advcake_data = {
      pageType: 2,
      user: getUser(this.user),
      currentCategory: getCurrentCategory(event.product),
      currentProduct: getCurrentProduct(event.product),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    window.advcake_data = {
      pageType: 3,
      user: getUser(this.user),
      currentCategory: getCurrentCategory(listing),
      products: getProducts(listing.items),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedCart() {
    window.advcake_data = {
      pageType: 4,
      user: getUser(this.user),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedCheckoutPage() {
    window.advcake_data = {
      pageType: 5,
      user: getUser(this.user),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const voucher = (event.transaction.vouchers || []).join(',');
    const userTypeMap = { true: 'new', false: 'old' };
    window.advcake_data = cleanObject({
      pageType: 6,
      user: getUser(event.user || this.user),
      basketProducts: getBasketProducts(transaction.lineItems),
      orderInfo: {
        id: transaction.orderId,
        totalPrice: transaction.total,
        promocodeName: voucher,
        promocodeValue: transaction.voucherDiscount,
        userType: userTypeMap[transaction.isFirst],
      },
    });
    window.advcake_push_data(window.advcake_data);
    window.advcake_order(transaction.orderId, transaction.total);

    // this.removeAffiliateCookies(); request from AdvCake
  }
}

export default AdvCake;
