import Integration from './../Integration';
import getQueryParam from './../functions/getQueryParam';
import { getProp } from './../functions/dotProp';
import normalizeString from './../functions/normalizeString';
import { COMPLETED_TRANSACTION } from './../events';
import { isDeduplication, addAffiliateCookie, getAffiliateCookie } from './utils/affiliate';

const DEFAULT_COOKIE_NAME = 'mixmarket';
const DEFAULT_UTM_SOURCE = 'mixmarket';

class Mixmarket extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      advertiserId: '',
      cookieName: DEFAULT_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: '',
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: DEFAULT_UTM_SOURCE, // utm_source for mixmarket leads
      deduplicationUtmMedium: [], // by default deduplicate with any source/medium other then mixmarket source
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag('trackingPixel', {
      type: 'img',
      attr: {
        src: `//mixmarket.biz/uni/tev.php?id=${options.advertiserId}&r=${escape(window.document.referrer)}&t=${Date.now()}&a1={{ orderId }}&a2={{ total }}`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('cookieTracking')) {
      const mixmarketUtmSource = normalizeString(this.getOption('utmSource'));
      const urlUtmSource = getQueryParam('utm_source');
      if (urlUtmSource === mixmarketUtmSource) {
        const cookieName = this.getOption('cookieName');
        const ttl = this.getOption('cookieTtl');
        const domain = this.getOption('cookieDomain');
        addAffiliateCookie(cookieName, 1, ttl, domain);
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
          'context.campaign.medium',
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
      if (!getAffiliateCookie(this.getOption('cookieName'))) return;

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

    const orderId = transaction.orderId;
    const total = transaction.total;

    this.load('trackingPixel', { orderId, total });
  }
}

export default Mixmarket;
