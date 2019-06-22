import getQueryParam from '@segmentstream/utils/getQueryParam';
import { getProp } from '@segmentstream/utils/dotProp';
import normalizeString from '@segmentstream/utils/normalizeString';
import Integration from '../Integration';
import { COMPLETED_TRANSACTION } from '../events/semanticEvents';
import { isDeduplication, addAffiliateCookie, getAffiliateCookie } from './utils/affiliate';

const DEFAULT_COOKIE_NAME = 'tradetracker';
const DEFAULT_UTM_SOURCE = 'tradetracker';

class TradeTracker extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      campaignId: '',
      cookieName: DEFAULT_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: '',
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: DEFAULT_UTM_SOURCE, // utm_source for tradetracker leads
      deduplicationUtmMedium: [],
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag('trackingPixel', {
      type: 'img',
      attr: {
        // eslint-disable-next-line max-len
        src: `//ts.tradetracker.net/?cid=${options.campaignId}&tid={{ orderId }}&tam={{ subtotal }}&qty=1&event=sales&currency={{ currency }}`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('cookieTracking')) {
      const tradeTrackerUtmSource = normalizeString(this.getOption('utmSource'));
      const urlUtmSource = getQueryParam('utm_source');
      if (urlUtmSource === tradeTrackerUtmSource) {
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
          'transaction.subtotal',
          'transaction.total',
          'transaction.currency',
          'context.campaign.medium',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.subtotal': {
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

    if (!transaction || !transaction.orderId) {
      return;
    }

    const { orderId, currency } = transaction;
    const subtotal = transaction.subtotal || transaction.total;

    this.load('trackingPixel', { orderId, subtotal, currency });
  }
}

export default TradeTracker;
