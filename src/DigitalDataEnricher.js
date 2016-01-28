import htmlGlobals from './functions/htmlGlobals.js';
import uuid from 'uuid';

class DigitalDataEnricher
{
  constructor(digitalData, storage, options) {
    this.digitalData = digitalData;
    this.storage = storage;
    this.options = Object.assign({
      sessionLength: 3600,
    }, options);
  }

  setDigitalData(digitalData) {
    this.digitalData = digitalData;
  }

  setStorage(storage) {
    this.storage = storage;
  }

  getStorage() {
    return this.storage;
  }

  enrichDigitalData() {
    this.enrichPageData();
    this.enrichUserData();
    this.enrichContextData();
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

  enrichUserData() {
    const user = this.digitalData.user;
    user.anonymousId = this.getUserAnonymousId();
  }

  enrichContextData() {
    const context = this.digitalData.context;
    context.userAgent = this.getHtmlGlobals().getNavigator().userAgent;
  }

  /**
   * Can be overriden for test purposes
   * @returns {{getDocument, getLocation, getNavigator}}
   */
  getHtmlGlobals() {
    return htmlGlobals;
  }

  getUserAnonymousId() {
    let anonymousId = this.storage.get('user.anonymousId');
    if (!anonymousId) {
      anonymousId = uuid();
      this.storage.set('user.anonymousId', anonymousId);
    }
    return anonymousId;
  }

  getOption(name) {
    return this.options[name];
  }
}

export default DigitalDataEnricher;
