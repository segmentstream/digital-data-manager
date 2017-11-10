import Integration from './../Integration';
import deleteProperty from 'driveback-utils/deleteProperty';
import cleanObject from 'driveback-utils/cleanObject';
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
  LEAD,
} from './../events/semanticEvents';
import cookie from 'js-cookie';
import { isDeduplication } from './utils/affiliate';

function getScreenResolution() {
  return `${window.screen.width}x${window.screen.height}`;
}

const PAYMENT_TYPE_SALE = 'sale';
const PAYMENT_TYPE_LEAD = 'lead';
const UID_GET_PARAM = 'admitad_uid';
const DEFAULT_COOKIE_NAME = 'admitad_uid';
const ADMITAD_PIXEL_VAR = '_admitadPixelDD';
const ADMITAD_POSITIONS_VAR = '_admitadPositionsDD';

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

class Admitad extends Integration {
  constructor(digitalData, options) {
    normalizeOptions(options);
    const optionsWithDefaults = Object.assign({
      campaignCode: '',
      paymentType: PAYMENT_TYPE_SALE,
      defaultActionCode: '1',
      responseType: 'img',
      cookieName: DEFAULT_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: topDomain(window.location.href),
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: 'admitad', // utm_source which is sent with admitad_uid get param
      deduplicationUtmMedium: [],
      reTag: false,
      reTagCode: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.SEMANTIC_EVENTS = [
      COMPLETED_TRANSACTION,
      LEAD,
    ];
    if (this.getOption('reTag')) {
      this.SEMANTIC_EVENTS.push(
        VIEWED_PAGE,
        VIEWED_PRODUCT_LISTING,
        VIEWED_PRODUCT_DETAIL,
        VIEWED_CART,
      );
    }

    this.addTag('trackingPixel', {
      type: 'script',
      attr: {
        id: '_admitad-pixel-dd',
        src: `//cdn.asbmit.com/static/js/ddpixel.js?r=${Date.now()}`,
      },
    });

    this.addTag('reTag', {
      type: 'script',
      attr: {
        src: '//cdn.admitad.com/static/js/retag.js',
      },
    });
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('reTag')) {
      window._retag = window._retag || [];
    }

    if (this.getOption('cookieTracking')) {
      this.addAffiliateCookie();
    }
  }

  addAffiliateCookie() {
    if (window.self !== window.top) {
      return; // protect from iframe cookie-stuffing
    }

    const uidInQuery = getQueryParam(UID_GET_PARAM);
    if (uidInQuery) {
      cookie.set(this.getOption('cookieName'), uidInQuery, {
        expires: this.getOption('cookieTtl'),
        domain: this.getOption('cookieDomain'),
      });
    }
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    if (event.name === VIEWED_PAGE) {
      return ['page'];
    } else if (event.name === VIEWED_PRODUCT_LISTING) {
      return ['listing.categoryId'];
    } else if (event.name === VIEWED_PRODUCT_DETAIL) {
      return ['product'];
    } else if (event.name === VIEWED_CART) {
      return ['cart'];
    } else if (event.name === COMPLETED_TRANSACTION) {
      return [
        'transaction',
        'user.userId',
        'website.currency',
        'context.campaign',
      ];
    } else if (event.name === LEAD) {
      return [
        'user.userId',
        'context.campaign',
      ];
    }
    return [];
  }

  getEventValidationConfig(event) {
    const config = {
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.unitSalePrice',
          'context.campaign.source',
          'context.campaign.medium',
          'integrations.admitad.actionCode',
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

  reset() {
    deleteProperty(window, '_admitadPixel');
    deleteProperty(window, '_admitadPositions');
    deleteProperty(window, '_retag');
    deleteProperty(window, 'ad_category');
    deleteProperty(window, 'ad_product');
    deleteProperty(window, 'ad_products');
    deleteProperty(window, 'ad_order');
    deleteProperty(window, 'ad_amount');
  }

  trackEvent(event) {
    // retag tracking
    if (this.getOption('reTag')) {
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

    // affiliate actions tracking
    const uid = cookie.get(this.getOption('cookieName'));
    if (!uid || !this.getOption('campaignCode')) return;

    const campaign = getProp(event, 'context.campaign');
    const utmSource = this.getOption('utmSource');
    const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium');
    if (isDeduplication(campaign, utmSource, deduplicationUtmMedium)) return;

    if (event.name === COMPLETED_TRANSACTION && this.getOption('paymentType') === PAYMENT_TYPE_SALE) {
      this.trackSale(event, uid);
    } else if (event.name === LEAD && this.getOption('paymentType') === PAYMENT_TYPE_LEAD) {
      this.trackLead(event, uid);
    }
  }

  setupPixel(event) {
    window[ADMITAD_PIXEL_VAR] = {
      response_type: this.getOption('responseType'),
      action_code: getProp(event, 'integrations.admitad.actionCode') || this.getOption('defaultActionCode'),
      campaign_code: this.getOption('campaignCode'),
    };
    window[ADMITAD_POSITIONS_VAR] = window[ADMITAD_POSITIONS_VAR] || [];
  }

  trackSale(event, uid) {
    const transaction = event.transaction;

    if (!transaction || !transaction.lineItems || !transaction.lineItems.length) {
      return;
    }

    this.setupPixel(event);

    const lineItems = transaction.lineItems;
    let index = 1;
    lineItems.forEach((lineItem) => {
      window[ADMITAD_POSITIONS_VAR].push(cleanObject({
        uid,
        order_id: transaction.orderId,
        position_id: index,
        client_id: getProp(event, 'user.userId'),
        tariff_code: getProp(lineItem, 'admitad.tariffCode') || '1',
        currency_code: getProp(lineItem, 'product.currency') || getProp(event, 'website.currency'),
        position_count: lineItems.length,
        price: getProp(lineItem, 'product.unitSalePrice') || getProp(lineItem, 'product.unitPrice'),
        quantity: lineItem.quantity || 1,
        product_id: getProp(lineItem, 'product.id'),
        screen: getScreenResolution(),
        old_customer: (transaction.isFirst === false) ? 1 : 0,
        coupon: (transaction.vouchers && transaction.vouchers.length) ? 1 : 0,
        payment_type: PAYMENT_TYPE_SALE,
      }));
      index += 1;
    });

    this.load('trackingPixel');
  }

  trackLead(event, uid) {
    if (!event.lead || !event.lead.id) {
      return;
    }

    this.setupPixel(event);

    window[ADMITAD_POSITIONS_VAR].push(cleanObject({
      uid,
      order_id: getProp(event, 'lead.id'),
      client_id: getProp(event, 'user.userId'),
      tariff_code: getProp(event, 'admitad.tariffCode') || '1',
      screen: getScreenResolution(),
      payment_type: PAYMENT_TYPE_LEAD,
    }));

    this.load('trackingPixel');
  }

  reTagPush(level) {
    // for now ajax implementation not supported
    if (this.pageTracked) return;

    window._retag.push({
      code: this.getOption('reTagCode'),
      level,
    });
    this.load('reTag');
    this.pageTracked = true;
  }

  onViewedPage(event) {
    const page = event.page || {};
    if (page.type !== 'home') return;

    this.reTagPush(0);
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    const categoryId = listing.categoryId;
    if (!categoryId) return;

    window.ad_category = categoryId;

    this.reTagPush(1);
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    window.ad_product = cleanObject({
      id: product.id,
      vendor: product.manufacturer || product.brand,
      price: product.unitSalePrice,
      url: product.url,
      picture: product.imageUrl,
      name: product.name,
      category: product.categoryId,
    });

    this.reTagPush(2);
  }

  onViewedCart(event) {
    const cart = event.cart || {};
    const lineItems = cart.lineItems || [];
    window.ad_products = lineItems.map(lineItem => ({
      id: getProp(lineItem, 'product.id'),
      number: lineItem.quantity || 1,
    }));

    this.reTagPush(3);
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const lineItems = transaction.lineItems || [];    
    const orderId = transaction.orderId;
    const total = transaction.total;

    window.ad_order = orderId;
    window.ad_amount = total;
    window.ad_products = lineItems.map(lineItem => ({
      id: getProp(lineItem, 'product.id'),
      number: lineItem.quantity || 1,
    }));

    this.reTagPush(4);
  }
}

export default Admitad;
