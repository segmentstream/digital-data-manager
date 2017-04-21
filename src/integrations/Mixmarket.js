import Integration from './../Integration';
import getQueryParam from './../functions/getQueryParam';
import topDomain from './../functions/topDomain';
import { getProp } from './../functions/dotProp';
import normalizeString from './../functions/normalizeString';
import { COMPLETED_TRANSACTION } from './../events';
import cookie from 'js-cookie';

const DEFAULT_COOKIE_NAME = 'mixmarket';

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

class Mixmarket extends Integration {

  constructor(digitalData, options) {
    normalizeOptions(options);
    const optionsWithDefaults = Object.assign({
      advertiserId: '',
      cookieName: DEFAULT_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: topDomain(window.location.href),
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: 'mixmarket', // utm_source for mixmarket leads
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
      this.addAffiliateCookie();
    }

    this.onLoad();
  }

  addAffiliateCookie() {
    if (window.self !== window.top) {
      return; // protect from iframe cookie-stuffing
    }

    const utmSource = getQueryParam('utm_source');
    if (utmSource === this.getOption('utmSource')) {
      cookie.set(this.getOption('cookieName'), 1, {
        expires: this.getOption('cookieTtl'),
        domain: this.getOption('cookieDomain'),
      });
    }
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
    const mixMarketCookie = cookie.get(this.getOption('cookieName'));
    if (!mixMarketCookie) return;

    if (this.isDeduplication(event)) return;
    if (event.name === COMPLETED_TRANSACTION) {
      this.trackSale(event);
    }
  }

  isDeduplication(event) {
    if (this.getOption('deduplication')) {
      const campaignSource = getProp(event, 'context.campaign.source');
      if (!campaignSource || campaignSource.toLowerCase() !== this.getOption('utmSource')) {
        // last click source is not mixMarketCookie
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
