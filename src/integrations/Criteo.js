import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty';
import { getProp } from './../functions/dotProp';
import semver from './../functions/semver';

function lineItemsToCriteoItems(lineItems) {
  const products = [];
  for (let i = 0, length = lineItems.length; i < length; i++) {
    const lineItem = lineItems[i];
    if (lineItem.product) {
      const productId = lineItem.product.id || lineItem.product.skuCode;
      if (productId) {
        const product = {
          id: productId,
          price: lineItem.product.unitSalePrice || lineItem.product.unitPrice || 0,
          quantity: lineItem.quantity || 1,
        };
        products.push(product);
      }
    }
  }
  return products;
}

class Criteo extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      account: '',
      noConflict: false,
      userSegmentVar: 'user.criteoSegment'
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//static.criteo.net/js/ld/ld.js',
      },
    });
  }

  defineUserSegment(event) {
    const userSegmentVar = this.getOption('userSegmentVar');
    const userSegment = getProp(event, userSegmentVar);
    this.userSegment = userSegment;
  }

  getUserSegment() {
    return this.userSegment;
  }

  pushCriteoQueue(criteoEvent) {
    if (criteoEvent) {
      const userSegment = this.getUserSegment();
      if (userSegment) {
        criteoEvent.user_segment = userSegment;
      }
      this.criteo_q.push(criteoEvent);
    }

    // final push to criteo in signle hit
    if (this.criteo_q.length === 1) {
      window.criteo_q.push(this.criteo_q[0]);
    } else {
      window.criteo_q.push(this.criteo_q);
    }
    this.criteo_q = [];
  }

  initialize() {
    window.criteo_q = window.criteo_q || [];
    this.criteo_q = [];

    if (this.getOption('account') && !this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  isLoaded() {
    return !!window.criteo_q && typeof window.criteo_q === 'object';
  }

  reset() {
    deleteProperty(window, 'criteo_q');
  }

  trackEvent(event) {
    const methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction',
      'Viewed Product Category': 'onViewedProductListing',
      'Viewed Cart': 'onViewedCart',
      'Searched': 'onViewedProductListing',
      'Searched Products': 'onViewedProductListing',
      'Subscribed': 'onSubscribed',
    };

    if (this.getOption('noConflict') !== true || event.name === 'Subscribed') {
      const method = methods[event.name];
      if (method) {
        this[method](event);
      }
    }
  }

  onViewedPage(event) {
    const page = event.page;
    let siteType;
    if (event.version && page && semver.cmp(event.version, '1.1.0') < 0) {
      siteType = page.siteType;
    } else if (event.website) {
      siteType = event.website.type;
    }

    if (siteType) {
      siteType = siteType.toLocaleLowerCase();
    }

    if (['desktop', 'tablet', 'mobile'].indexOf(siteType) < 0) {
      siteType = 'desktop';
    }

    this.criteo_q.push({
      event: 'setAccount',
      account: this.getOption('account'),
    });
    this.criteo_q.push({
      event: 'setSiteType',
      type: siteType.charAt(0), // "d", "m", "t"
    });

    if (event.user && event.user.email) {
      this.criteo_q.push({
        event: 'setEmail',
        email: event.user.email,
      });
    }

    this.defineUserSegment(event);

    if (page) {
      if (page.type === 'home') {
        this.onViewedHome();
      } else if (
        !page.type ||
        ['category', 'product', 'search', 'cart', 'confirmation'].indexOf(page.type) < 0
      ) {
        this.pushCriteoQueue();
      }
    } else {
      this.pushCriteoQueue();
    }
  }

  onViewedHome() {
    const criteoEvent = {
      event: 'viewHome',
    };
    this.pushCriteoQueue(criteoEvent);
  }

  onViewedProductListing(event) {
    const listing = event.listing;
    if (!listing || !listing.items || !listing.items.length) return;

    const items = listing.items;
    const productIds = [];
    let length = 3;
    if (items.length < 3) {
      length = items.length;
    }
    for (let i = 0; i < length; i++) {
      const productId = items[i].id || items[i].skuCode;
      if (productId) {
        productIds.push(productId);
      }
    }
    if (productIds.length > 0) {
      this.pushCriteoQueue(
        {
          event: 'viewList',
          item: productIds,
        }
      );
    }
  }

  onViewedProductDetail(event) {
    const product = event.product;
    let productId;
    if (product) {
      productId = product.id || product.skuCode;
    }
    if (productId) {
      this.pushCriteoQueue(
        {
          event: 'viewItem',
          item: productId,
        }
      );
    }
  }

  onViewedCart(event) {
    const cart = event.cart;
    if (cart && cart.lineItems && cart.lineItems.length > 0) {
      const products = lineItemsToCriteoItems(cart.lineItems);
      if (products.length > 0) {
        this.pushCriteoQueue(
          {
            event: 'viewBasket',
            item: products,
          }
        );
      }
    }
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (transaction && transaction.lineItems && transaction.lineItems.length > 0) {
      const products = lineItemsToCriteoItems(transaction.lineItems);
      if (products.length > 0) {
        let deduplication = 0;
        const context = event.context;
        if (
          context
          && context.campaign
          && context.campaign.source
          && context.campaign.source.toLocaleLowerCase().indexOf('criteo') >= 0
        ) {
          deduplication = 1;
        }
        this.pushCriteoQueue({
          event: 'trackTransaction',
          id: transaction.orderId,
          new_customer: (transaction.isFirst) ? 1 : 0,
          deduplication: deduplication,
          item: products,
        });
      }
    }
  }

  onSubscribed(event) {
    const user = event.user;
    if (user && user.email) {
      window.criteo_q.push(
        {
          event: 'setEmail',
          email: user.email,
        }
      );
    }
  }
}

export default Criteo;
