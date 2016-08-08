import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

function go() {
  window.ScarabQueue.push(['go']);
}

function calculateLineItemSubtotal(lineItem) {
  const product = lineItem.product;
  const price = product.unitSalePrice || product.unitPrice || 0;
  const quantity = lineItem.quantity || 1;
  return price * quantity;
}

function mapLineItems(lineItems) {
  return lineItems.map(function mapLineItem(lineItem) {
    const product = lineItem.product;
    const lineItemSubtotal = lineItem.subtotal || calculateLineItemSubtotal(lineItem);
    return {
      item: product.id || product.skuCode,
      price: lineItemSubtotal,
      quantity: lineItem.quantity || 1,
    };
  });
}

class Emarsys extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      merchantId: '',
      categorySeparator: ' > ',
      noConflict: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        id: 'scarab-js-api',
        src: `//recommender.scarabresearch.com/js/${options.merchantId}/scarab-v2.js`,
      },
    });
  }

  initialize() {
    window.ScarabQueue = window.ScarabQueue || [];
    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  isLoaded() {
    return (typeof ScarabQueue === 'object');
  }

  reset() {
    deleteProperty(window, 'ScarabQueue');
  }

  enrichDigitalData(done) {
    // TODO
    /*
    ScarabQueue.push(['recommend', {
      logic: 'TOPICAL',
      limit: 2,
      containerId: 'personal-recs',
      success: function(SC) {
        var container = SC.recommender.container;
        delete SC.recommender.container;
        container.innerHTML = JSON.stringify(SC, null, '  ');
        done();
      }
    }]);
    ScarabQueue.push(['go']);
    */
    done();
  }

  trackEvent(event) {
    const methods = {
      'Viewed Page': 'onViewedPage',
      'Searched': 'onSearched',
      'Viewed Product Category': 'onViewedProductCategory',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (this.getOption('merchantId')) {
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      } else if (!method) {
        this.trackCustomEvent(event);
      }
    }
  }

  sendCommonData() {
    const user = this.digitalData.user || {};
    const cart = this.digitalData.cart || {};
    if (user.email) {
      window.ScarabQueue.push(['setEmail', user.email]);
    } else if (user.userId) {
      window.ScarabQueue.push(['setCustomerId', user.userId]);
    }
    if (cart.lineItems && cart.lineItems.length > 0) {
      window.ScarabQueue.push(['cart', mapLineItems(cart.lineItems)]);
    } else {
      window.ScarabQueue.push(['cart', []]);
    }
  }

  onViewedPage(event) {
    const page = event.page;
    this.sendCommonData();
    // product, category, search and confirmation pages are tracked separately
    if (['product', 'category', 'search', 'confirmation'].indexOf(page.type) < 0) {
      go();
    }
  }

  onViewedProductCategory(event) {
    const listing = event.listing || {};
    let category = listing.category;
    if (Array.isArray(listing.category)) {
      category = category.join(this.getOption('categorySeparator'));
    }
    window.ScarabQueue.push(['category', category]);
    go();
  }

  onViewedProductDetail(event) {
    const product = event.product;
    window.ScarabQueue.push(['view', product.id || product.skuCode]);
    go();
  }

  onSearched(event) {
    const listing = event.listing || {};
    window.ScarabQueue.push(['searchTerm', listing.query]);
    go();
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    window.ScarabQueue.push(['purchase', {
      orderId: transaction.orderId,
      items: mapLineItems(transaction.lineItems),
    }]);
    go();
  }
}

export default Emarsys;
