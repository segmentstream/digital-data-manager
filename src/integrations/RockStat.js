import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_CATEGORY,
  VIEWED_CART,
  SEARCHED_PRODUCTS,
  COMPLETED_TRANSACTION,
  REFUNDED_TRANSACTION,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_CHECKOUT_STEP,
  VIEWED_PRODUCT,
  CLICKED_PRODUCT,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CAMPAIGN,
  CLICKED_CAMPAIGN,
} from './../events';


class RockStat extends Integration {

  constructor(digitalData, options) {

    const optionsWithDefaults = Object.assign({
      projectId: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    let t = new Date().getTime();

    this.addTag({
      type: 'script',
      attr: {
        src: `//tracker.nktch.com/init.js?id=${options.projectId}&t=${t}`,
      },
    });

  }

  initialize() {
    if (this.getOption('projectId') && !window.$mt) {
      let r = window.$mt = function (c) {
        r._.push(c)
      };
      r._ = [];
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          'user.userId',
          'website.currency',
        ];
        break;
      case ADDED_PRODUCT:
      case REMOVED_PRODUCT:
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'product',
        ];
        break;
      case VIEWED_CHECKOUT_STEP:
        enrichableProps = [
          'cart',
          'transaction',
        ];
        break;
      case COMPLETED_TRANSACTION:
      case REFUNDED_TRANSACTION:
        enrichableProps = [
          'transaction',
        ];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
  }

  isLoaded() {
    return !!(window.$mt && window.$mt.getUID);
  }

  reset() {
    deleteProperty(window, '$mt');
  }

  trackEvent(event) {

    if (event.name === 'Viewed Page') {

      $mt.trackPageView(undefined, event);

    } else {

      $mt.event(event.name, event);

    }
  }
}

export default RockStat;
