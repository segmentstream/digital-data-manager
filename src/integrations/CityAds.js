import Integration from './../Integration';
import getQueryParam from './../functions/getQueryParam';
import topDomain from './../functions/topDomain';
import { getProp } from './../functions/dotProp';
import normalizeString from './../functions/normalizeString';
import { COMPLETED_TRANSACTION } from './../events/semanticEvents';
import cookie from 'js-cookie';

const CLICK_ID_GET_PARAM = 'click_id';
const AIP_GET_PARAM = 'aip';
const DEFAULT_CLICK_ID_COOKIE_NAME = 'cityads_click_id';
const DEFAULT_AIP_COOKIE_NAME = 'cityads_aip';

const CUSTOMER_TYPE_NEW = 'new';
const CUSTOMER_TYPE_RETURNED = 'returned';

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

function mapLineItems(lineItems) {
  lineItems = lineItems || [];
  return lineItems.map((lineItem) => {
    const category = getProp(lineItem, 'product.category') || [];
    const categoryName = category[category.length - 1];
    return {
      pid: getProp(lineItem, 'product.id'),
      pn: getProp(lineItem, 'product.name'),
      up: getProp(lineItem, 'product.unitSalePrice'),
      pc: categoryName,
      qty: lineItem.quantity,
      pd: lineItem.totalDiscount,
    };
  });
}

class CityAds extends Integration {

  constructor(digitalData, options) {
    normalizeOptions(options);
    const optionsWithDefaults = Object.assign({
      defaultTargetName: '',
      partnerId: '',
      clickIdCookieName: DEFAULT_CLICK_ID_COOKIE_NAME,
      aipCookieName: DEFAULT_AIP_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: topDomain(window.location.href),
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: 'cityads', // utm_source which is sent with admitad_uid get param
      deduplicationUtmMedium: [], // by default deduplicate with any source/medium other then admitad source
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag({
      type: 'script',
      attr: {
        src: `https://cityadspix.com/track/{{ orderId }}/ct/{{ targetName }}/c/${options.partnerId}?click_id={{ clickId }}&customer_type={{ customerType }}&customer_id={{ customerId }}&payment_method={{ paymentMethod }}&order_total={{ orderTotal }}&currency={{ currency }}&coupon={{ coupon }}&discount={{ discount }}&basket={{ basket }}&md=2`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('cookieTracking')) {
      this.addAffiliateCookie();
    }
  }

  addAffiliateCookie() {
    if (window.self !== window.top) {
      return; // protect from iframe cookie-stuffing
    }

    const clickId = getQueryParam(CLICK_ID_GET_PARAM);
    const aip = getQueryParam(AIP_GET_PARAM);
    const expires = this.getOption('cookieTtl');
    const domain = this.getOption('cookieDomain');
    if (clickId) {
      cookie.set(this.getOption('clickIdCookieName'), clickId, { expires, domain });
    }
    if (aip) {
      cookie.set(this.getOption('aipCookieName'), aip, { expires, domain });
    }
  }

  getSemanticEvents() {
    return [ COMPLETED_TRANSACTION ];
  }

  getEnrichableEventProps(event) {
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
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.category',
          'transaction.lineItems[].product.unitSalePrice',
          'context.campaign.source',
          'context.campaign.medium',
          'integrations.cityads.targetName',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.id': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.name': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.category': {
            warnings: ['required', 'array'],
          },
          'transaction.lineItems[].product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
        },
      },
    };

    return config[event.name];
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    const clickId = cookie.get(this.getOption('clickIdCookieName'));
    if (!clickId) return;

    if (this.isDeduplication(event)) return;
    if (event.name === COMPLETED_TRANSACTION) {
      this.onCompletedTransaction(event, clickId);
    }
  }

  isDeduplication(event) {
    if (this.getOption('deduplication')) {
      const campaignSource = getProp(event, 'context.campaign.source');
      if (!campaignSource || campaignSource.toLowerCase() !== this.getOption('utmSource')) {
        // last click source is not admitad
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

  onCompletedTransaction(event, clickId) {
    const transaction = event.transaction;

    if (!transaction || !transaction.orderId) {
      return;
    }

    const orderId = transaction.orderId;
    const targetName = getProp(event, 'integrations.cityads.targetName') || this.getOption('defaultTargetName');
    const customerType = (transaction.isFirst) ? CUSTOMER_TYPE_NEW : CUSTOMER_TYPE_RETURNED;
    const paymentMethod = transaction.paymentMethod;
    const vouchers = transaction.vouchers || [];
    const coupon = vouchers.join(',');
    const discount = transaction.vouchersDiscount;
    const customerId = getProp(event, 'user.userId');
    const orderTotal = transaction.total;
    let currency = transaction.currency;
    if (currency === 'RUB') currency = 'RUR'; // for some reason cityads uses RUR instead of RUB

    const lineItems = transaction.lineItems || [];
    const basket = encodeURI(JSON.stringify(mapLineItems(lineItems)));

    this.load({
      orderId,
      clickId,
      orderTotal,
      targetName,
      customerType,
      paymentMethod,
      coupon,
      discount,
      currency,
      customerId,
      basket,
    });
  }
}

export default CityAds;
