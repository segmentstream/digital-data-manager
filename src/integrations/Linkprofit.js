import getQueryParam from '@segmentstream/utils/getQueryParam';
import topDomain from '@segmentstream/utils/topDomain';
import { getProp } from '@segmentstream/utils/dotProp';
import Integration from '../Integration';
import { COMPLETED_TRANSACTION } from '../events/semanticEvents';
import { isDeduplication, addAffiliateCookie, getAffiliateCookie } from './utils/affiliate';

const CLICK_HASH_GET_PARAM = 'ClickHash';
const AFFILIATE_ID_GET_PARAM = 'AffiliateID';
const DEFAULT_CLICK_HASH_COOKIE_NAME = 'linkprofit_click_hash';
const DEFAULT_AFFILIATE_ID_COOKIE_NAME = 'linkprofit_affiliate_id';

class Linkprofit extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      defaultCampaignId: '',
      clickHashCookieName: DEFAULT_CLICK_HASH_COOKIE_NAME,
      affiliateIdCookieName: DEFAULT_AFFILIATE_ID_COOKIE_NAME,
      cookieTracking: true, // false - if advertiser wants to track cookies by itself
      cookieDomain: topDomain(window.location.href),
      cookieTtl: 90, // days
      deduplication: false,
      utmSource: 'linkprofit', // utm_source which is sent with ClickHash get param
      deduplicationUtmMedium: [],
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag({
      type: 'img',
      attr: {
        // eslint-disable-next-line max-len
        src: 'https://cpa.linkprofit.ru/sale?OrderID={{ orderId }}&ClickHash={{ clickHash }}&CampaignID={{ campaignId }}&AffiliateID={{ affiliateId }}',
      },
    });
  }

  initialize() {
    this._isLoaded = true;

    if (this.getOption('cookieTracking')) {
      const clickHash = getQueryParam(CLICK_HASH_GET_PARAM);
      const affiliateId = getQueryParam(AFFILIATE_ID_GET_PARAM);
      if (clickHash && affiliateId) {
        const clickHashCookieName = this.getOption('clickHashCookieName');
        const affiliateIdCookieName = this.getOption('affiliateIdCookieName');
        const ttl = this.getOption('cookieTtl');
        const domain = this.getOption('cookieDomain');
        addAffiliateCookie(clickHashCookieName, clickHash, ttl, domain);
        addAffiliateCookie(affiliateIdCookieName, affiliateId, ttl, domain);
      }
    }
  }

  getSemanticEvents() {
    return [COMPLETED_TRANSACTION];
  }

  getEnrichableEventProps(event) {
    if (event.name === COMPLETED_TRANSACTION) {
      return [
        'transaction',
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
          'context.campaign.source',
          'context.campaign.medium',
          'integrations.linkprofit.campaignId',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
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
    const clickHash = getAffiliateCookie(this.getOption('clickHashCookieName'));
    const affiliateId = getAffiliateCookie(this.getOption('affiliateIdCookieName'));
    if (!clickHash) return;

    const campaign = getProp(event, 'context.campaign');
    const utmSource = this.getOption('utmSource');
    const deduplicationUtmMedium = this.getOption('deduplicationUtmMedium');
    if (isDeduplication(campaign, utmSource, deduplicationUtmMedium)) return;
    if (event.name === COMPLETED_TRANSACTION) {
      this.onCompletedTransaction(event, clickHash, affiliateId);
    }
  }

  isDeduplication(event) {
    if (this.getOption('deduplication')) {
      const campaignSource = getProp(event, 'context.campaign.source');
      if (!campaignSource || campaignSource.toLowerCase() !== this.getOption('utmSource')) {
        // last click source is not linkprofit
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

  onCompletedTransaction(event, clickHash, affiliateId) {
    const { transaction } = event;

    if (!transaction || !transaction.orderId) {
      return;
    }

    const { orderId } = transaction;
    const campaignId = getProp(event, 'integrations.linkprofit.campaignId') || this.getOption('defaultCampaignId');

    this.load({
      orderId,
      clickHash,
      affiliateId,
      campaignId,
    });
  }
}

export default Linkprofit;
