import sha256 from 'crypto-js/sha256';
import utmParams from 'driveback-utils/utmParams';
import htmlGlobals from 'driveback-utils/htmlGlobals';
import cleanObject from 'driveback-utils/cleanObject';
import deleteProperty from 'driveback-utils/deleteProperty';
import size from 'driveback-utils/size';
import uuid from 'uuid/v4';
import Integration from './../Integration';
import {
  VIEWED_PAGE,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  VIEWED_PRODUCT,
  CLICKED_PRODUCT,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
} from './../events/semanticEvents';

const clearEvent = (event) => {
  if (event.listing && event.listing.items) {
    deleteProperty(event.listing, 'items');
  }
};

class Streaming extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      projectId: '',
      projectName: '',
    }, options);
    super(digitalData, optionsWithDefaults);
  }

  getIgnoredEvents() {
    return [VIEWED_PRODUCT, CLICKED_PRODUCT];
  }

  getEnrichableEventProps(event) {
    const mapping = {
      [VIEWED_PAGE]: ['page', 'user'],
      [VIEWED_CART]: ['cart'],
      [COMPLETED_TRANSACTION]: ['transaction'],
      [VIEWED_PRODUCT_DETAIL]: ['product'],
      [VIEWED_PRODUCT_LISTING]: ['listing'],
      [SEARCHED_PRODUCTS]: ['listing'],
    };

    const enrichableProps = mapping[event.name] || [];

    return enrichableProps;
  }

  allowCustomEvents() {
    return true;
  }

  normalize(hitData) {
    const campaign = utmParams(htmlGlobals.getLocation().search);
    const hitId = uuid();
    const commonFields = cleanObject({
      hitId,
      projectId: this.getOption('projectId'),
      projectName: this.getOption('projectName'),
      anonymousId: this.anonymousId,
      userId: this.userId,
      context: {
        campaign: size(campaign) ? campaign : undefined,
        library: this.library,
        page: {
          path: htmlGlobals.getLocation().pathname,
          referrer: htmlGlobals.getDocument().referrer,
          search: htmlGlobals.getLocation().search,
          title: htmlGlobals.getDocument().title,
          url: htmlGlobals.getLocation().href,
          hash: htmlGlobals.getLocation().hash,
        },
        userAgent: htmlGlobals.getNavigator().userAgent,
      },
      sentAt: (new Date()).toISOString(),
      version: 1,
    });

    return Object.assign(hitData, commonFields);
  }

  getAnonymousId() {
    return this.anonymousId;
  }

  getUserId() {
    return this.userId;
  }

  trackEvent(event) {
    // identify
    if (event.user) {
      this.sendUserHit(event.user);
      deleteProperty(event, 'user');
    }

    this.sendEventHit(event);
  }

  sendUserHit(user) {
    this.anonymousId = user.anonymousId || this.anonymousId;
    this.userId = user.userId || this.userId;
    deleteProperty(user, 'anonymousId');
    deleteProperty(user, 'userId');

    // remove PII data
    deleteProperty(user, 'firstName');
    deleteProperty(user, 'lastName');
    deleteProperty(user, 'fullName');
    deleteProperty(user, 'phone');
    if (user.email) {
      user.emailHash = sha256(user.email).toString();
      deleteProperty(user, 'email');
    }

    if (size(user)) {
      const hitData = this.normalize({
        user,
        type: 'user',
      });
      this.send(hitData);
    }
  }

  sendEventHit(event) {
    clearEvent(event);
    const hitData = this.normalize({
      event,
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
    window.fetch('//track.ddmanager.ru/collect', {
      method: 'post',
      credentials: 'include',
      mode: 'no-cors',
      body: JSON.stringify(hitData),
    }).then((response) => {
      if (response.ok) {
        // window.localStorage.removeItem(this.getCacheKey(hitData.hitId));
      }
    });
  }
}

export default Streaming;
