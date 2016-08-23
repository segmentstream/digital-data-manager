import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty';
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
      deduplication: undefined,
      noConflict: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//static.criteo.net/js/ld/ld.js',
      },
    });
  }

  initialize() {
    window.criteo_q = window.criteo_q || [];

    if (this.getOption('account') && !this.getOption('noConflict')) {
      const email = this.digitalData.user.email;
      let siteType;
      if (this.digitalData.version && semver.cmp(this.digitalData.version, '1.1.0') < 0) {
        siteType = this.digitalData.page.siteType;
      } else {
        siteType = this.digitalData.website.type;
      }

      if (siteType) {
        siteType = siteType.toLocaleLowerCase();
      }

      if (['desktop', 'tablet', 'mobile'].indexOf(siteType) < 0) {
        siteType = 'desktop';
      }

      window.criteo_q.push(
        {
          event: 'setAccount',
          account: this.getOption('account'),
        },
        {
          event: 'setSiteType',
          type: siteType.charAt(0), // "d", "m", "t"
        }
      );

      if (email) {
        window.criteo_q.push(
          {
            event: 'setEmail',
            email: email,
          }
        );
      } else {
        window.ddListener.push(['on', 'change:user.email', (newValue) => {
          window.criteo_q.push(
            {
              event: 'setEmail',
              email: newValue,
            }
          );
        }]);
      }
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
    if (page) {
      if (page.type === 'home') {
        this.onViewedHome();
      }
    }
  }

  onViewedHome() {
    window.criteo_q.push(
      {
        event: 'viewHome',
      }
    );
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
      window.criteo_q.push(
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
      window.criteo_q.push(
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
        window.criteo_q.push(
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
        if (this.getOption('deduplication') !== undefined) {
          deduplication = this.getOption('deduplication') ? 1 : 0;
        } else {
          const context = this.digitalData.context;
          if (context.campaign && context.campaign.source && context.campaign.source.toLocaleLowerCase() === 'criteo') {
            deduplication = 1;
          }
        }
        window.criteo_q.push(
          {
            event: 'trackTransaction',
            id: transaction.orderId,
            new_customer: (transaction.isFirst) ? 1 : 0,
            deduplication: deduplication,
            item: products,
          }
        );
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
