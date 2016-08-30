import htmlGlobals from './functions/htmlGlobals.js';
import semver from './functions/semver.js';
import dot from 'dot-object';

class DigitalDataEnricher
{
  constructor(digitalData, ddListener, ddStorage) {
    this.digitalData = digitalData;
    this.ddListener = ddListener;
    this.ddStorage = ddStorage;
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

  enrichDigitalData() {
    // define required digitalData structure
    this.enrichStructure();

    // persist some default behaviours
    this.persistUserData();

    // enrich with default context data
    this.enrichPageData();
    this.enrichContextData();
    this.enrichDDStorageData();
    this.enrichLegacyVersions();

    // when all enrichments are done
    this.listenToUserDataChanges();
    this.listenToSemanticEvents();
  }

  listenToSemanticEvents() {
    this.ddListener.push(['on', 'event', (event) => {
      if (event.name === 'Subscribed') {
        const email = dot.pick('user.email', event);
        this.enrichHasSubscribed(email);
      } else if (event.name === 'Completed Transaction') {
        this.enrichHasTransacted();
      }
    }]);
  }

  listenToUserDataChanges() {
    this.ddListener.push(['on', 'change:user', () => {
      this.persistUserData();
    }]);
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

  enrichHasSubscribed(email) {
    const user = this.digitalData.user;
    if (!user.isSubscribed) {
      user.isSubscribed = true;
    }
    if (!user.email && email) {
      user.email = email;
    }
  }

  enrichHasTransacted() {
    const user = this.digitalData.user;
    if (!user.hasTransacted) {
      user.hasTransacted = true;
    }
    if (!user.lastTransactionDate) {
      user.lastTransactionDate = (new Date()).toISOString();
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
    }
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
  }

  enrichDDStorageData() {
    const persistedKeys = this.ddStorage.getPersistedKeys();
    for (const key of persistedKeys) {
      const value = this.ddStorage.get(key);
      if (value !== undefined && dot.pick(key, this.digitalData) !== value) {
        dot.str(key, value, this.digitalData);
      }
    }
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
      for (const recommendation of recommendations) {
        if (recommendation && recommendation.listName && !recommendation.listId) {
          recommendation.listId = recommendation.listName;
        }
      }
    }

    // compatibility with version <1.1.0
    if (this.digitalData.version && semver.cmp(this.digitalData.version, '1.1.0') < 0) {
      // enrich listing.categoryId
      const page = this.digitalData.page;
      if (page.type === 'category' && page.categoryId) {
        const listing = this.digitalData.listing = this.digitalData.listing || {};
        listing.categoryId = page.categoryId;
        this.ddListener.push(['on', 'change:page.categoryId', () => {
          this.digitalData.listing.categoryId = this.digitalData.page.categoryId;
        }]);
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
