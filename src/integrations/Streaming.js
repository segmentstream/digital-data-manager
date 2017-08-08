import utmParams from 'driveback-utils/utmParams';
import htmlGlobals from 'driveback-utils/htmlGlobals';
import cleanObject from 'driveback-utils/cleanObject';
import deleteProperty from 'driveback-utils/deleteProperty';
import size from 'driveback-utils/size';
import uuid from 'uuid/v4';
import Integration from './../Integration';

class Streaming extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      projectId: '',
    }, options);

    super(digitalData, optionsWithDefaults);
  }

  getEnrichableEventProps(event) {
    const mapping = {
      'Viewed Page': ['page', 'user'],
      'Viewed Cart': ['cart'],
      'Completed Transaction': ['transaction'],
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

    if (event.name === 'Viewed Page') {
      this.sendPageHit(event.page);
    } else {
      this.sendEventHit(event);
    }
  }

  sendUserHit(user) {
    this.anonymousId = user.anonymousId || this.anonymousId;
    this.userId = user.userId || this.userId;
    deleteProperty(user, 'anonymousId');
    deleteProperty(user, 'userId');
    if (size(user)) {
      const hitData = this.normalize({
        user,
        type: 'user',
      });
      this.send(hitData);
    }
  }

  sendPageHit(page) {
    const hitData = this.normalize({
      page,
      type: 'page',
    });
    this.send(hitData);
  }

  sendEventHit(event) {
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

    console.log(hitData); // eslint-disable-line
    window.fetch(`//localhost:3000/collect?stream_id=${this.projectId}`, {
      method: 'post',
      mode: 'cors',
      body: JSON.stringify(hitData),
    }).then((response) => {
      if (response.ok) {
        window.localStorage.removeItem(this.getCacheKey(hitData.hitId));
      }
    });
  }
}

export default Streaming;
