import utmParams from 'driveback-utils/utmParams'
import htmlGlobals from 'driveback-utils/htmlGlobals';
import cleanObject from 'driveback-utils/cleanObject';
import clone from 'driveback-utils/clone';
import deleteProperty from 'driveback-utils/deleteProperty';
import size from 'driveback-utils/size';
import uuid from 'uuid/v4';

class Streaming {
  constructor(projectId, library) {
    this.projectId = projectId;
    this.library = library;
  }

  trackEvent(event, User) {
    const campaign = utmParams(htmlGlobals.getLocation().search);
    const hitId = uuid();
    const requestBody = cleanObject({
      hitId: hitId,
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
      user: (User) ? User.getData() : undefined,
      event: event,
      version: 1
    });

    try {
      const streamCache = window.localStorage.getItem(this.getCacheKey());
      window.localStorage.setItem(this.getCacheKey(hitId), JSON.stringify(requestBody));
    } catch (e) {
      // localstorage not supported
      // TODO: save to memory
    }
    this.send(requestBody);
  }

  getCacheKey() {
    return ['ddm', 'stream', this.projectId].join(':');
  }

  send(requestBody) {
    console.log(requestBody);
    window.fetch(`//localhost:3000/collect?stream_id=${this.projectId}`, {
      method: 'post',
      mode: 'cors',
      body: JSON.stringify(requestBody),
    }).then((response) => {
      if (response.ok) {
        window.localStorage.removeItem(this.getCacheKey(requestBody.hitId));
      }
    });
  }
}

export default Streaming;