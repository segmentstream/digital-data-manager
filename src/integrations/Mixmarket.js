import getQueryParam from 'driveback-utils/getQueryParam';
import { getProp } from 'driveback-utils/dotProp';
import normalizeString from 'driveback-utils/normalizeString';
import Integration from '../Integration';
import { COMPLETED_TRANSACTION } from '../events/semanticEvents';
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
      deduplicationUtmMedium: [],
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag('trackingPixel', {
      type: 'img',
      attr: {
        // eslint-disable-next-line max-len
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
  }

  getSemanticEvents() {
    return [COMPLETED_TRANSACTION];
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
    const { transaction } = event;

    if (!transaction || !transaction.orderId || !transaction.total) {
      return;
    }

    const { orderId, total } = transaction;

    this.load('trackingPixel', { orderId, total });
  }
}

export default Mixmarket;
