import Integration from './../Integration';
import getQueryParam from './../functions/getQueryParam';
import topDomain from './../functions/topDomain';
import { getProp } from './../functions/dotProp';
import { COMPLETED_TRANSACTION } from './../events';
import cookie from 'js-cookie';

const PARTNER_ID_GET_PARAM = 'actionpay';
const DEFAULT_COOKIE_NAME = 'actionpay';

function normalizeOptions(options) {
  if (options.deduplication) {
    if (options.utmSource) {
      options.utmSource = options.utmSource.toLowerCase();
    }
    if (options.deduplicationUtmMedium) {
      options.deduplicationUtmMedium = options.deduplicationUtmMedium.map((utmMedium) => {
        return utmMedium.toLowerCase();
      });
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
      deduplicationUtmMedium: [], // by default deduplicate with any source/medium other then actionpay source
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.SEMANTIC_EVENTS = [
      COMPLETED_TRANSACTION,
    ];

    this.addTag('trackingPixel', {
      type: 'img',
      attr: {
        src: `//apypx.com/ok/{{ goalId }}.png?actionpay={{ partnerId }}&apid={{ actionId }}&price={{ total }}`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('cookieTracking')) {
      this.addAffiliateCookie();
    }

    this.onLoad();
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

    const goalId = getProp(event, 'integrations.actionpay.goalId') || this.getOption('defaltGoalId');
    const actionId = transaction.orderId;
    const total = transaction.total;

    this.load('trackingPixel', { goalId, actionId, partnerId, total });
  }
}

export default Actionpay;
