import sha256 from 'crypto-js/sha256';
import utmParams from 'driveback-utils/utmParams';
import getQueryParam from 'driveback-utils/getQueryParam';
import htmlGlobals from 'driveback-utils/htmlGlobals';
import cleanObject from 'driveback-utils/cleanObject';
import arrayMerge from 'driveback-utils/arrayMerge';
import size from 'driveback-utils/size';
import isCrawler from 'driveback-utils/isCrawler';
import each from 'driveback-utils/each';
import uuid from 'uuid/v1';
import Integration from './../Integration';
import StreamingFilters, {
  pageProps,
  listingProps,
  cartProps,
  productProps,
  transactionProps,
  campaignProps,
  listItemProps,
  websiteProps,
} from './DDManagerStreaming/Filters';
import {
  DIGITALDATA_VAR,
  PRODUCT_VAR,
} from './../variableTypes';
import {
  VIEWED_PAGE,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  VIEWED_PRODUCT,
  CLICKED_PRODUCT,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CAMPAIGN,
  CLICKED_CAMPAIGN,
  VIEWED_EXPERIMENT,
  INTEGRATION_VALIDATION_FAILED,
  EXCEPTION,
} from './../events/semanticEvents';

class DDManagerStreaming extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      projectId: '',
      projectName: '',
      trackingUrl: 'https://track.ddmanager.ru/collect',
      dimensions: {},
      metrics: {},
      internal: false,
    }, options);
    super(digitalData, optionsWithDefaults);
    this.website = {};

    this.dimensions = {};
    this.metrics = {};
    this.productDimensions = {};
    this.productMetrics = {};
    this.customEnrichableProps = [];

    // TODO: refactoring
    each(optionsWithDefaults.dimensions, (key, variable) => {
      if (variable.type === PRODUCT_VAR) {
        this.productDimensions[key] = variable.value;
      } else {
        if (variable.type === DIGITALDATA_VAR) {
          this.customEnrichableProps.push(variable.value);
        }
        this.dimensions[key] = variable.value;
      }
    });
    each(optionsWithDefaults.metrics, (key, variable) => {
      if (variable.type === PRODUCT_VAR) {
        this.productMetrics[key] = variable.value;
      } else {
        if (variable.type === DIGITALDATA_VAR) {
          this.customEnrichableProps.push(variable.value);
        }
        this.metrics[key] = variable.value;
      }
    });
    this.filters = new StreamingFilters(
      this.dimensions,
      this.metrics,
      this.productDimensions,
      this.productMetrics,
    );
  }

  initialize() {
    this._isLoaded = true;
    if (isCrawler(htmlGlobals.getNavigator().userAgent)) {
      return false;
    }
    return true;
  }

  getIgnoredEvents() {
    if (this.getOption('internal')) {
      return [VIEWED_PRODUCT, CLICKED_PRODUCT, INTEGRATION_VALIDATION_FAILED, EXCEPTION];
    }
    return [];
  }

  getEnrichableEventProps(event) {
    const mapping = {
      [VIEWED_PAGE]: ['page', 'user.userId', 'user.anonymousId', 'user.email', 'website'],
      [VIEWED_CART]: ['cart'],
      [COMPLETED_TRANSACTION]: ['transaction'],
      [VIEWED_PRODUCT_DETAIL]: ['product'],
      [VIEWED_PRODUCT_LISTING]: ['listing'],
      [SEARCHED_PRODUCTS]: ['listing'],
    };

    const enrichableProps = mapping[event.name] || [];
    arrayMerge(
      enrichableProps,
      this.customEnrichableProps,
    );
    return enrichableProps;
  }

  getValidationFields(...keys) {
    const fieldsMapping = {
      website: websiteProps,
      page: pageProps,
      cart: [...cartProps, 'vouchers'],
      listing: listingProps,
      transaction: [...transactionProps, 'vouchers'],
      product: productProps,
      campaign: campaignProps,
      listItem: listItemProps,
      experiment: ['id', 'name', 'variationId', 'variationName'],
    };

    const validationFields = (Array.isArray(keys)) ? keys.reduce((result, key) => {
      fieldsMapping[key].forEach((prop) => {
        result.push([key, prop].join('.'));
        if (key === 'campaign') {
          result.push(['campaigns[]', prop].join('.'));
        } else if (key === 'listItem') {
          result.push(['listItems[]', prop].join('.'));
        }
      });
      return result;
    }, []) : [];

    arrayMerge(validationFields, this.customEnrichableProps);
    arrayMerge(validationFields, ['category', 'label']);

    return validationFields;
  }

  getEventValidationConfig(event) {
    const productFields = () => this.getValidationFields('product');
    const mapping = {
      [VIEWED_PAGE]: {
        fields: this.getValidationFields('page', 'website'),
      },
      [VIEWED_CART]: {
        fields: this.getValidationFields('cart'),
      },
      [COMPLETED_TRANSACTION]: {
        fields: this.getValidationFields('transaction'),
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: productFields,
      },
      [ADDED_PRODUCT]: {
        fields: productFields,
      },
      [REMOVED_PRODUCT]: {
        fields: productFields,
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: this.getValidationFields('listing'),
      },
      [SEARCHED_PRODUCTS]: {
        fields: this.getValidationFields('listing'),
      },
      [VIEWED_CAMPAIGN]: {
        fields: this.getValidationFields('campaign'),
      },
      [CLICKED_CAMPAIGN]: {
        fields: this.getValidationFields('campaign'),
      },
      [VIEWED_PRODUCT]: {
        fields: this.getValidationFields('listItem'),
      },
      [CLICKED_PRODUCT]: {
        fields: this.getValidationFields('listItem'),
      },
      [VIEWED_EXPERIMENT]: {
        fields: this.getValidationFields('experiment'),
      },
    };

    const validationConfig = mapping[event.name] || {};
    if (typeof validationConfig.fields === 'function') {
      validationConfig.fields = validationConfig.fields();
    } else {
      validationConfig.fields = validationConfig.fields || this.getValidationFields();
    }

    return validationConfig;
  }

  allowCustomEvents() {
    return true;
  }

  normalize(hitData) {
    const hitId = uuid();
    const gclid = getQueryParam('gclid');
    const campaign = utmParams(htmlGlobals.getLocation().search);
    if (gclid) {
      if (!campaign.source) campaign.source = 'google';
      if (!campaign.medium) campaign.medium = 'cpc';
    }
    const commonFields = cleanObject({
      hitId,
      projectId: this.getOption('projectId'),
      projectName: this.getOption('projectName'),
      anonymousId: this.getAnonymousId(),
      userId: this.getUserId(),
      emailHash: this.getEmailHash(),
      context: {
        campaign: size(campaign) ? campaign : undefined,
        library: this.library,
        page: {
          path: decodeURI(escape(htmlGlobals.getLocation().pathname)),
          referrer: decodeURI(escape(htmlGlobals.getDocument().referrer)),
          search: decodeURI(escape(htmlGlobals.getLocation().search)),
          title: htmlGlobals.getDocument().title,
          url: decodeURI(escape(htmlGlobals.getLocation().href)),
          hash: htmlGlobals.getLocation().hash,
        },
        userAgent: htmlGlobals.getNavigator().userAgent,
        screenWidth: window.screen ? window.screen.width : undefined,
        screenHeight: window.screen ? window.screen.height : undefined,
      },
      sentAt: (new Date()).toISOString(),
      version: 1,
    });

    return Object.assign(hitData, commonFields);
  }

  setAnonymousId(anonymousId) {
    this.anonymousId = anonymousId;
  }

  getAnonymousId() {
    return this.anonymousId;
  }

  getUserId() {
    return this.userId;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  getEmailHash() {
    return this.emailHash;
  }

  setEmailHash(emailHash) {
    this.emailHash = emailHash;
  }

  trackEvent(event) {
    // identify
    if (size(event.user)) {
      const user = event.user || {};
      if (user.email) {
        this.setEmailHash(sha256(user.email.trim()).toString());
      }
      if (user.anonymousId) {
        this.setAnonymousId(user.anonymousId);
      }
      if (user.userId) {
        this.setUserId(String(user.userId));
      }
    }

    if (event.website) {
      const website = event.website;
      this.website = this.filters.filterWebsite(website);
    }

    this.sendEventHit(event);
  }

  sendEventHit(event) {
    const hitData = this.normalize({
      event: this.filters.filterEventHit(event),
      website: this.website,
      type: 'event',
    });
    this.send(hitData);
  }

  getCacheKey() {
    return ['ddm', 'stream', this.projectId].join(':');
  }

  send(hitData) {
    /* 
    try {
      const streamCache = window.localStorage.getItem(this.getCacheKey());
      window.localStorage.setItem(this.getCacheKey(hitId), JSON.stringify(hitData));
    } catch (e) {
      // localstorage not supported
      // TODO: save to memory
    } */
    window.fetch(this.getOption('trackingUrl'), {
      method: 'post',
      credentials: 'include',
      mode: 'cors',
      body: JSON.stringify(hitData),
    }).then((response) => {
      if (response.ok) {
        // window.localStorage.removeItem(this.getCacheKey(hitData.hitId));
      }
    }).catch((e) => {
      console.warn(e);
    });
  }
}

export default DDManagerStreaming;
