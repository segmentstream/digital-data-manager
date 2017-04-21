import { Integration } from './../Integration';
import AsyncQueue from './utls/AsyncQueue';

const DEVELOPMENT_URL_PREFIX = 'integration';
const PRODUCTION_URL_PREFIX = 'recs';

const PLACEMENT_TYPE_HOME_PAGE = 'home_page';

class RichRelevance extends Integration {

  constructor() {
    const optionsWithDefaults = Object.assign({
      apiKey: '',
      useProductionUrl: false,
      sessionIdVar: '',
      homePagePlacements: {}
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//media.richrelevance.com/rrserver/js/1.2/p13n.js',
      },
    });
  }

  initialize() {
    this.baseUrlSubdomain = (this.getOption('useProductionUrl')) ? PRODUCTION_URL_PREFIX : DEVELOPMENT_URL_PREFIX;
    this.asyncQueue = new AsyncQueue(this.isLoaded);
    this.load(this.onLoad);
  }

  isLoaded() {
    retunr !!window.RR;
  }

  getPlacements(placementType) {
    switch (placementType) {
    case PLACEMENT_TYPE_HOME_PAGE:
      return
      break;
    }
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [REMOVED_PRODUCT]: 'onRemovedProduct',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage(event) {
    const page = event.page || {};
    const user = event.user || {};
    const sessionId = getProp(event, this.getOption('sessionIdVar'));

    this.asyncQueue.push(() => {
      window.R3_COMMON = new r3_common();
      window.R3_COMMON.setApiKey(this.getOption('apiKey'));
      window.R3_COMMON.setBaseUrl(`${window.location.protocol}//${this.baseUrlSubdomain}.richrelevance.com/rrserver/`);
      window.R3_COMMON.setClickthruServer(`${window.location.protocol}//${window.location.host}`);
      window.R3_COMMON.setSessionId(sessionId);
      if (user.userId) {
        window.R3_COMMON.setUserId(user.userId);
      }
    })

    if (page.type === 'home') {
      this.onViewedHome(event);
    }
  }

  onViewedHome(event) {
    this.asyncQueue.push(() => {
      // Use this code if you are not requesting placement(s) for personalization
      R3_COMMON.addPlacementType('home_page');

      // Replace placement_name with the placement name you set up in Dashboard.
      // Call multiple times to display more than one placement.
      R3_COMMON.addPlacementType('home_page.placement_name');

      var R3_HOME = new r3_home();
      rr_flush_onload();
      r3();
    });
  }
}

export default RichRelevance;
