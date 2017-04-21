import Integration from './../Integration';
import getQueryParam from './../functions/getQueryParam';
import { getProp } from './../functions/dotProp';
import normalizeString from './../functions/normalizeString';
import { COMPLETED_TRANSACTION } from './../events';
import { isDeduplication, addAffiliateCookie, getAffiliateCookie } from './utils/affiliate';

const DEFAULT_UTM_SOURCE = 'gdeslon';
const COOKIE_TTL_URL_PARAM = '_gs_cttl';
const CLICK_REF_URL_PARAM = '_gs_ref';
const AID_URL_PARAM = 'gsaid';
const DEFAULT_CLICK_REF_COOKIE_NAME = 'gdeslon_ref';
const DEFAULT_AID_COOKIE_NAME = 'gdeslon_aid';

class GdeSlon extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      merchantId: '',
      defaultCode: '',
      clickRefCookieName: DEFAULT_CLICK_REF_COOKIE_NAME,
      aidCookieName: DEFAULT_AID_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: '',
      deduplication: false,
      utmSource: DEFAULT_UTM_SOURCE, // utm_source for mixmarket leads
      deduplicationUtmMedium: [], // by default deduplicate with any source/medium other then mixmarket source
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag('trackingPixel', {
      type: 'script',
      attr: {
        src: `https://www.gdeslon.ru/thanks.js?codes={{ productCodes }}{{ code }}:{{ total }}&order_id={{ orderId }}&merchant_id=${options.merchantId}`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('cookieTracking')) {
      const clickRef = getQueryParam(CLICK_REF_URL_PARAM);
      const aid = getQueryParam(AID_URL_PARAM);
      const expires = getQueryParam(COOKIE_TTL_URL_PARAM);
      const domain = this.getOption('cookieDomain');
      if (clickRef) {
        const clickRefCookieName = this.getOption('clickIdCookieName');
        addAffiliateCookie(clickRefCookieName, clickRef, ttl, domain);
      }
      if (aid) {
        const aidCookieName = this.getOption('aidCookieName');
        addAffiliateCookie(aidCookieName, aid, ttl, domain);
      }
    }

    this.onLoad();
  }

  getSemanticEvents() {
    return [ COMPLETED_TRANSACTION ];
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

  getEventValidations(event) {
    if (event.name === COMPLETED_TRANSACTION) {
      return [
        ['transaction.orderId', { required: true }],
        ['transaction.total', { required: true }],
      ];
    }
    return [];
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    if (event.name === COMPLETED_TRANSACTION) {
      if (!getAffiliateCookie(this.getOption('clickRefCookieName'))) return;

      const campaign = getProp(event, 'context.campaign');
      const utmSource = this.getOption('utmSource');
      const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium');
      if (isDeduplication(campaign, utmSource, deduplicationUtmMedium)) return;

      this.trackSale(event);
    }
  }

  trackSale(event) {
    const transaction = event.transaction;

    if (!transaction || !transaction.orderId || !transaction.total) {
      return;
    }

    const code = getProp(event, 'integrations.gdeslon.code') || this.getOption('defaultCode');
    const orderId = transaction.orderId;
    const total = transaction.total;

    let productCodes = '';
    if (transaction.lineItems || Array.isArray(transaction.lineItems)) {
      gdeslonProducts = transaction.lineItems.reduce((acc, lineItem) => {
        const product = lineItem.product || {};
        const quantity = lineItem.quanity || 1;
        newVal = [product.id, product.unitSalePrice].join(':');
        if (lineItem.quanity > 1) {
          newVal = Array(lineItem.quanity).fill(newVal).join(',');
        }
        return [acc, newVal].join(',');
      }, '');
    }
    if (productCodes) productCodes += ',';

    this.load('trackingPixel', { productCodes, code, orderId, total });
  }
}

export default GdeSlon;
