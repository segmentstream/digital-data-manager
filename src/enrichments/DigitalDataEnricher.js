import htmlGlobals from 'driveback-utils/htmlGlobals';
import semver from 'driveback-utils/semver';
import getQueryParam from 'driveback-utils/getQueryParam';
import cleanObject from 'driveback-utils/cleanObject';
import { getProp, setProp } from 'driveback-utils/dotProp';
import uuid from 'uuid/v4';

/**
 * fields which will be overriden even
 * if server returned other values in DDL
 */
const ddStorageForcedFields = [
  'user.isSubscribed',
  'user.hasTransacted',
  'user.everLoggedIn',
  'user.isReturning',
];

function isForcedField(field) {
  return (ddStorageForcedFields.indexOf(field) >= 0);
}

class DigitalDataEnricher {
  constructor(digitalData, ddListener, ddStorage, options) {
    this.digitalData = digitalData;
    this.ddListener = ddListener;
    this.ddStorage = ddStorage;
    this.options = Object.assign({
      sessionLength: 3600,
    }, options);

    this.listenToEvents();
  }

  setDigitalData(digitalData) {
    this.digitalData = digitalData;
  }

  setDDListener(ddListener) {
    this.ddListener = ddListener;
  }

  setDDStorage(ddStorage) {
    this.ddStorage = ddStorage;
  }

  setOption(key, value) {
    this.options[key] = value;
  }

  enrichDigitalData() {
    // define required digitalData structure
    this.enrichStructure();

    // fire session started event if this is new session
    this.fireSessionStarted();

    // enrich with default data
    this.enrichContextData();
    this.enrichPageData();
    this.enrichLegacyVersions();

    // persist some default behaviours
    this.persistUserData();

    // should be after all default enrichments
    this.enrichDDStorageData();

    // enrich required fields if still not defined
    this.enrichDefaultUserData();
    this.enrichIsReturningStatus();

    this.ddStorage.setLastEventTimestamp(Date.now());
  }

  listenToEvents() {
    // enrich DDL based on semantic events
    this.ddListener.push(['on', 'event', (event) => {
      this.enrichIsReturningStatus();
      this.ddStorage.setLastEventTimestamp(Date.now());

      if (event.name === 'Subscribed') {
        const email = getProp(event, 'user.email');
        this.enrichHasSubscribed(email);
      } else if (event.name === 'Completed Transaction') {
        this.enrichHasTransacted();
        this.ddStorage.unpersist('context.campaign');
      }
    }]);
  }

  fireSessionStarted() {
    const lastEventTimestamp = this.ddStorage.getLastEventTimestamp();
    if (
      !lastEventTimestamp ||
      (Date.now() - lastEventTimestamp) > this.options.sessionLength * 1000
    ) {
      this.digitalData.events.push({
        name: 'Session Started',
        source: 'DDManager',
        includeIntegrations: [], // do not send this event to any integration
      });
    }
  }

  enrichDefaultUserData() {
    const user = this.digitalData.user;

    if (user.isReturning === undefined) {
      user.isReturning = false;
    }

    if (user.isLoggedIn !== undefined && user.everLoggedIn === undefined) {
      user.everLoggedIn = false;
    }

    // set user.anonymousId
    if (!user.anonymousId) {
      user.anonymousId = uuid();
      this.ddStorage.persist('user.anonymousId');
    }
  }

  persistUserData() {
    const user = this.digitalData.user;

    // persist user.everLoggedIn
    if (user.isLoggedIn && !user.everLoggedIn) {
      user.everLoggedIn = true;
      this.ddStorage.persist('user.everLoggedIn');
    }
    // persist user.email
    if (user.email) {
      this.ddStorage.persist('user.email');
    }
    // persist user.isSubscribed
    if (user.isSubscribed) {
      this.ddStorage.persist('user.isSubscribed');
    }
    // persist user.hasTransacted
    if (user.hasTransacted) {
      this.ddStorage.persist('user.hasTransacted');
    }
    // persist user.lastTransactionDate
    if (user.lastTransactionDate) {
      this.ddStorage.persist('user.lastTransactionDate');
    }
  }

  enrichIsReturningStatus() {
    const lastEventTimestamp = this.ddStorage.getLastEventTimestamp();
    const user = this.digitalData.user;
    if (
      !user.isReturning && lastEventTimestamp &&
      (Date.now() - lastEventTimestamp) > this.options.sessionLength * 1000
    ) {
      this.digitalData.user.isReturning = true;
      this.ddStorage.persist('user.isReturning');
    }
  }

  enrichHasSubscribed(email) {
    const user = this.digitalData.user;
    if (!user.isSubscribed) {
      user.isSubscribed = true;
      this.ddStorage.persist('user.isSubscribed');
    }
    if (!user.email && email) {
      user.email = email;
      this.ddStorage.persist('user.email');
    }
  }

  enrichHasTransacted() {
    const user = this.digitalData.user;
    if (!user.hasTransacted) {
      user.hasTransacted = true;
      this.ddStorage.persist('user.hasTransacted');
    }
    if (!user.lastTransactionDate) {
      user.lastTransactionDate = (new Date()).toISOString();
      this.ddStorage.persist('user.lastTransactionDate');
    }
  }

  enrichStructure() {
    this.digitalData.website = this.digitalData.website || {};
    this.digitalData.page = this.digitalData.page || {};
    this.digitalData.user = this.digitalData.user || {};
    this.digitalData.context = this.digitalData.context || {};
    this.digitalData.integrations = this.digitalData.integrations || {};
    if (!this.digitalData.page.type || this.digitalData.page.type !== 'confirmation') {
      this.digitalData.cart = this.digitalData.cart || {};
    } else {
      this.digitalData.transaction = this.digitalData.transaction || {};
    }
    this.digitalData.events = this.digitalData.events || [];
    this.digitalData.changes = this.digitalData.changes || [];
  }

  enrichPageData() {
    const page = this.digitalData.page;

    page.path = page.path || this.getHtmlGlobals().getLocation().pathname;
    page.referrer = page.referrer || this.getHtmlGlobals().getDocument().referrer;
    page.queryString = page.queryString || this.getHtmlGlobals().getLocation().search;
    page.title = page.title || this.getHtmlGlobals().getDocument().title;
    page.url = page.url || this.getHtmlGlobals().getLocation().href;
    page.hash = page.hash || this.getHtmlGlobals().getLocation().hash;
  }

  enrichContextData() {
    const context = this.digitalData.context;
    context.userAgent = this.getHtmlGlobals().getNavigator().userAgent;

    if (!context.campaign) {
      const utmSource = getQueryParam('utm_source');
      const utmMedium = getQueryParam('utm_medium');
      const utmCampaign = getQueryParam('utm_campaign');
      if (utmSource || utmMedium || utmCampaign) {
        context.campaign = cleanObject({
          name: utmCampaign,
          source: utmSource,
          medium: utmMedium,
        });
        this.ddStorage.persist('context.campaign', 7776000); // 90 days
      }
    }
  }

  enrichDDStorageData() {
    const persistedKeys = this.ddStorage.getPersistedKeys();
    persistedKeys.forEach((key) => {
      const value = this.ddStorage.get(key);
      if (value === undefined) {
        return;
      }
      if (getProp(this.digitalData, key) === undefined || isForcedField(key)) {
        setProp(this.digitalData, key, value);
      }
    });
  }

  enrichLegacyVersions() {
    // compatibility with version <1.1.1
    if (this.digitalData.version && semver.cmp(this.digitalData.version, '1.1.1') < 0) {
      // enrich listing.listId
      const listing = this.digitalData.listing;
      if (listing && listing.listName && !listing.listId) {
        listing.listId = listing.listName;
      }
      // enrich recommendation[].listId
      let recommendations = this.digitalData.recommendation || [];
      if (!Array.isArray(recommendations)) {
        recommendations = [recommendations];
      }
      recommendations.forEach((recommendation) => {
        if (recommendation && recommendation.listName && !recommendation.listId) {
          recommendation.listId = recommendation.listName;
        }
      });
    }

    // compatibility with version <1.1.0
    if (this.digitalData.version && semver.cmp(this.digitalData.version, '1.1.0') < 0) {
      // enrich listing.categoryId
      const page = this.digitalData.page;
      if (page.type === 'category' && page.categoryId) {
        const listing = this.digitalData.listing = this.digitalData.listing || {};
        listing.categoryId = page.categoryId;
      }
    }
  }

  /**
   * Can be overriden for test purposes
   * @returns {{getDocument, getLocation, getNavigator}}
   */
  getHtmlGlobals() {
    return htmlGlobals;
  }
}

export default DigitalDataEnricher;
