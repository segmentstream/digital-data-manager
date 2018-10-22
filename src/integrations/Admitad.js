import deleteProperty from 'driveback-utils/deleteProperty';
import cleanObject from 'driveback-utils/cleanObject';
import getQueryParam from 'driveback-utils/getQueryParam';
import topDomain from 'driveback-utils/topDomain';
import { getProp } from 'driveback-utils/dotProp';
import normalizeString from 'driveback-utils/normalizeString';
import cookie from 'js-cookie';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_LISTING,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  LEAD,
} from '../events/semanticEvents';
import Integration from '../Integration';
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
      cookieName: DEFAULT_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: topDomain(window.location.href),
      cookieTtl: 90, // days
      deduplication: false,
      apiVersion: 'pixel',
      utmSource: 'admitad', // utm_source which is sent with admitad_uid get param
      deduplicationUtmMedium: [],
      crossDeviceTrackingId: 'none',
      reTag: false,
      reTagCode: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = [
      COMPLETED_TRANSACTION,
    ];
    if (this.getOption('reTag')) {
      this.SEMANTIC_EVENTS.push(
        VIEWED_PAGE,
        VIEWED_PRODUCT_LISTING,
        VIEWED_PRODUCT_DETAIL,
        VIEWED_CART,
      );
    }

    this._pixelAPI = this.getOption('apiVersion') === 'pixel';

    if (this._pixelAPI) {
      this.addTag('trackingPixel', {
        type: 'script',
        attr: {
          id: '_admitad-pixel-dd',
          src: `//cdn.asbmit.com/static/js/ddpixel.js?r=${Date.now()}`,
        },
      });
      this._isLoaded = false;
    } else {
      /* eslint-disable */
      this.addTag({
        type: 'script',
        attr: {
          src: `https://www.artfut.com/static/tagtag.min.js?campaign_code=${this.getOption('campaignCode')}`,
          onerror: 'var self = this;window.ADMITAD=window.ADMITAD||{},ADMITAD.Helpers=ADMITAD.Helpers||{},ADMITAD.Helpers.generateDomains=function(){for(var e=new Date,n=Math.floor(new Date(2020,e.getMonth(),e.getDate()).setUTCHours(0,0,0,0)/1e3),t=parseInt(1e12*(Math.sin(n)+1)).toString(30),i=["de"],o=[],a=0;a<i.length;++a)o.push({domain:t+"."+i[a],name:t});return o},ADMITAD.Helpers.findTodaysDomain=function(e){function n(){var o=new XMLHttpRequest,a=i[t].domain,D="https://"+a+"/";o.open("HEAD",D,!0),o.onload=function(){setTimeout(e,0,i[t])},o.onerror=function(){++t<i.length?setTimeout(n,0):setTimeout(e,0,void 0)},o.send()}var t=0,i=ADMITAD.Helpers.generateDomains();n()},window.ADMITAD=window.ADMITAD||{},ADMITAD.Helpers.findTodaysDomain(function(e){if(window.ADMITAD.dynamic=e,window.ADMITAD.dynamic){var n=function(){return function(){return self.src?self:""}}(),t=n(),i=(/campaign_code=([^&]+)/.exec(t.src)||[])[1]||"";t.parentNode.removeChild(t);var o=document.getElementsByTagName("head")[0],a=document.createElement("script");a.src="https://www."+window.ADMITAD.dynamic.domain+"/static/"+window.ADMITAD.dynamic.name.slice(1)+window.ADMITAD.dynamic.name.slice(0,1)+".min.js?campaign_code="+i,o.appendChild(a)}})',
        },
      });
      /* eslint-enable */
    }

    this.addTag('reTag', {
      type: 'script',
      attr: {
        src: '//cdn.admitad.com/static/js/retag.js',
      },
    });
  }

  initialize() {
    if (this._pixelAPI) this._isLoaded = true;

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
    if (event.name === VIEWED_PAGE) return ['page'];
    if (event.name === VIEWED_PRODUCT_LISTING) return ['listing.categoryId'];
    if (event.name === VIEWED_PRODUCT_DETAIL) return ['product'];
    if (event.name === VIEWED_CART) return ['cart'];
    if (event.name === COMPLETED_TRANSACTION) {
      return [
        'transaction',
        'user.userId',
        'website.currency',
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

  trackSale(event) {
    if (this._pixelAPI) {
      // affiliate actions tracking
      const uid = cookie.get(this.getOption('cookieName'));
      if (!uid || !this.getOption('campaignCode')) return;

      if (event.name === COMPLETED_TRANSACTION && this.getOption('paymentType') === PAYMENT_TYPE_SALE) {
        this.trackSaleWithPixel(event, uid);
      } else if (event.name === LEAD && this.getOption('paymentType') === PAYMENT_TYPE_LEAD) {
        this.trackLead(event, uid);
      }
    } else if (event.name === COMPLETED_TRANSACTION && this.getOption('paymentType') === PAYMENT_TYPE_SALE) {
      this.trackSaleWithTagtag(event);
    }
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

    const campaign = getProp(event, 'context.campaign');
    const utmSource = this.getOption('utmSource');
    const deduplication = this.getOption('deduplication');
    const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium');

    if (this._pixelAPI
        && deduplication
        && isDeduplication(campaign, utmSource, deduplicationUtmMedium)) return;

    this.trackSale(event);
  }

  trackSaleWithTagtag(event) {
    const { transaction } = event;

    if (!transaction || !transaction.lineItems || !transaction.lineItems.length) {
      return;
    }

    const { lineItems } = transaction;
    const admitadLoaded = !!window.ADMITAD;

    window.ADMITAD = window.ADMITAD || {};
    window.ADMITAD.Invoice = window.ADMITAD.Invoice || {};
    const campaign = getProp(event, 'context.campaign');
    const utmSource = this.getOption('utmSource');
    const deduplication = this.getOption('deduplication');
    const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium');

    const broker = deduplication
          && isDeduplication(campaign, utmSource, deduplicationUtmMedium) ? 'na' : 'adm';
    window.ADMITAD.Invoice.broker = broker;

    window.ADMITAD.Invoice.category = getProp(event, 'integrations.admitad.actionCode')
      || this.getOption('defaultActionCode') || '1';

    const orderedItems = [];
    lineItems.forEach((lineItem) => {
      orderedItems.push(cleanObject({
        Product: {
          productID: getProp(lineItem, 'product.id'),
          category: getProp(lineItem, 'admitad.tariffCode') || '1',
          price: getProp(lineItem, 'product.unitSalePrice') || getProp(lineItem, 'product.unitPrice'),
          priceCurrency: getProp(lineItem, 'product.currency') || getProp(event, 'website.currency'),
        },
        orderQuantity: lineItem.quantity || 1,
        additionalType: 'sale',
      }));
    });

    const orderObject = cleanObject({
      orderNumber: transaction.orderId,
      discountCode: (transaction.vouchers || []).join(','),
      orderedItem: orderedItems,
    });

    window.ADMITAD.Invoice.referencesOrder = window.ADMITAD.Invoice.referencesOrder || [];
    window.ADMITAD.Invoice.referencesOrder.push(orderObject);

    const crossDeviceTrackingId = this.getOption('crossDeviceTrackingId');
    if (crossDeviceTrackingId && crossDeviceTrackingId !== 'none') { // check project setting to transfer userId
      const accountId = getProp(event, `user.${crossDeviceTrackingId}`);
      if (accountId) window.ADMITAD.Invoice.accountId = accountId;
    }

    if (admitadLoaded) window.ADMITAD.Tracking.processPositions();
  }

  trackSaleWithPixel(event, uid) {
    const { transaction } = event;

    if (!transaction || !transaction.lineItems || !transaction.lineItems.length) {
      return;
    }

    this.setupPixel(event);

    const { lineItems } = transaction;
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

  setupPixel(event) {
    window[ADMITAD_PIXEL_VAR] = {
      response_type: this.getOption('responseType'),
      action_code: getProp(event, 'integrations.admitad.actionCode') || this.getOption('defaultActionCode'),
      campaign_code: this.getOption('campaignCode'),
    };
    window[ADMITAD_POSITIONS_VAR] = window[ADMITAD_POSITIONS_VAR] || [];
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

    const reTagLevel = 0;
    this.reTagPush(reTagLevel);
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    const { categoryId } = listing;
    if (!categoryId) return;

    window.ad_category = categoryId;
    const reTagLevel = 1;
    this.reTagPush(reTagLevel);
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

    const reTagLevel = 2;
    this.reTagPush(reTagLevel);
  }

  onViewedCart(event) {
    const cart = event.cart || {};
    const lineItems = cart.lineItems || [];
    window.ad_products = lineItems.map(lineItem => ({
      id: getProp(lineItem, 'product.id'),
      number: lineItem.quantity || 1,
    }));

    const reTagLevel = 3;
    this.reTagPush(reTagLevel);
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const lineItems = transaction.lineItems || [];
    const { orderId, total } = transaction;

    window.ad_order = orderId;
    window.ad_amount = total;
    window.ad_products = lineItems.map(lineItem => ({
      id: getProp(lineItem, 'product.id'),
      number: lineItem.quantity || 1,
    }));

    const reTagLevel = 4;
    this.reTagPush(reTagLevel);
  }
}

export default Admitad;
