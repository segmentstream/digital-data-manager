import Integration from './../Integration';
import getQueryParam from './../functions/getQueryParam';
import { getProp } from './../functions/dotProp';
import { COMPLETED_TRANSACTION } from './../events/semanticEvents';
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
      const expires = Number(getQueryParam(COOKIE_TTL_URL_PARAM));
      const domain = this.getOption('cookieDomain');
      if (clickRef) {
        const clickRefCookieName = this.getOption('clickRefCookieName');
        addAffiliateCookie(clickRefCookieName, clickRef, expires, domain);
      }
      if (aid) {
        const aidCookieName = this.getOption('aidCookieName');
        addAffiliateCookie(aidCookieName, aid, expires, domain);
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

  getEventValidationConfig(event) {
    const config = {
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'context.campaign.source',
          'context.campaign.medium',
          'integrations.gdeslon.code',
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
      productCodes = transaction.lineItems.reduce((acc, lineItem) => {
        const product = lineItem.product || {};
        const quantity = lineItem.quantity || 1;
        let newVal = [product.id, product.unitSalePrice].join(':');
        if (quantity > 1) {
          newVal = Array(quantity).fill(newVal).join(',');
        }
        if (acc) {
          return [acc, newVal].join(',');
        }
        return newVal;
      }, '');
    }
    if (productCodes) productCodes += ',';

    this.load('trackingPixel', { productCodes, code, orderId, total });
  }
}

export default GdeSlon;
