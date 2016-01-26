import type from 'component-type';
import utmParams from './functions/utmParams.js';
import htmlGlobals from './functions/htmlGlobals.js';
import uuid from 'uuid';
import clone from 'component-clone';
import Storage from './Storage.js';
import DDHelper from './DDHelper.js';

class DigitalDataEnricher
{
  constructor(digitalData, storage, options) {
    this.digitalData = digitalData;
    this.storage = storage;
    this.options = Object.assign({
      sessionLength: 3600
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
    const htmlGlobals = this.getHtmlGlobals();
    const page = this.digitalData.page;

    page.path = page.path || htmlGlobals.getLocation().pathname;
    page.referrer = page.referrer || htmlGlobals.getDocument().referrer;
    page.queryString = page.queryString || htmlGlobals.getLocation().search;
    page.title = page.title || htmlGlobals.getDocument().title;
    page.url = page.url || htmlGlobals.getLocation().href;
    page.hash = page.hash || htmlGlobals.getLocation().hash;
  }

  enrichUserData() {
    const user = this.digitalData.user;
    user.anonymousId = this.getUserAnonymousId();
  }

  enrichContextData() {
    const context = this.digitalData.context;

    context.userAgent = htmlGlobals.getNavigator().userAgent;
    context.landingPage = this.getLandingPage();
    context.campaign = this.getCampaign();
  }

  /**
   * Can be overriden for test purposes
   * @returns {{getDocument, getLocation, getNavigator}}
   */
  getHtmlGlobals() {
    return htmlGlobals;
  }

  getLandingPage() {
    let landingPage = this.storage.get('context.landingPage');
    if (!landingPage) {
      landingPage =  clone(this.digitalData.page);
      this.storage.set('context.landingPage', landingPage, this.getOption('sessionLength'));
    }
    return landingPage;
  }

  getCampaign() {
    let campaign = this.storage.get('context.campaign');
    if (!campaign) {
      campaign = utmParams(htmlGlobals.getLocation().search);
      this.storage.set('context.campaign', campaign, this.getOption('sessionLength'));
    }
    return campaign;
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
