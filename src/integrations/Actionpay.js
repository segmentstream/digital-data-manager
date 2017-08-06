import Integration from './../Integration';
import getQueryParam from 'driveback-utils/getQueryParam';
import topDomain from 'driveback-utils/topDomain';
import { getProp } from 'driveback-utils/dotProp';
import normalizeString from 'driveback-utils/normalizeString';
import { COMPLETED_TRANSACTION } from './../events/semanticEvents';
import cookie from 'js-cookie';

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

  trackEvent(event) {
    const partnerId = cookie.get(this.getOption('cookieName'));
    if (!partnerId) return;

    if (this.isDeduplication(event)) return;
    if (event.name === COMPLETED_TRANSACTION) {
      this.trackSale(event, partnerId);
    }
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
    const total = transaction.total;

    this.load('trackingPixel', { goalId, actionId, partnerId, total });
  }
}

export default Actionpay;
