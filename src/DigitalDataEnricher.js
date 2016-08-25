import htmlGlobals from './functions/htmlGlobals.js';
import semver from './functions/semver.js';

class DigitalDataEnricher
{
  constructor(digitalData, ddListener) {
    this.digitalData = digitalData;
    this.ddListener = ddListener;
  }

  setDigitalData(digitalData) {
    this.digitalData = digitalData;
  }

  setDDListener(ddListener) {
    this.ddListener = ddListener;
  }

  enrichDigitalData() {
    this.enrichPageData();
    this.enrichContextData();
    this.enrichLegacyVersions();
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
