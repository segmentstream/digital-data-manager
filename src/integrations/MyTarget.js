import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

function lineItemsToProductIds(lineItems) {
  const productIds = lineItems.filter((lineItem) => {
    return !!(lineItem.product.id);
  }).map((lineItem) => {
    return lineItem.product.id;
  });
  return productIds;
}

class MyTarget extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      counterId: '',
      list: '1',
      listProperty: undefined,
      listPropertyMapping: undefined,
      noConflict: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        id: 'topmailru-code',
        src: '//top-fwz1.mail.ru/js/code.js',
      },
    });
  }

  initialize() {
    window._tmr = window._tmr || [];
    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  isLoaded() {
    return !!(window._tmr && window._tmr.unload);
  }

  reset() {
    deleteProperty(window, '_tmr');
  }

  getList() {
    let list = this.getOption('list');
    const listProperty = this.getOption('listProperty');
    if (listProperty) {
      const listPropertyValue = this.get(listProperty);
      if (listPropertyValue) {
        const listPropertyMapping = this.getOption('listPropertyMapping');
        if (listPropertyMapping && listPropertyMapping[listPropertyValue]) {
          list = listPropertyMapping[listPropertyValue];
        } else {
          if (parseInt(listPropertyValue, 10)) {
            list = listPropertyValue;
          }
        }
      }
    }
    return list;
  }

  trackEvent(event) {
    const methods = {
      'Viewed Page': 'onViewedPage',
      'Viewed Product Category': 'onViewedProductCategory',
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (this.getOption('counterId')) {
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      } else if (!method) {
        this.trackCustomEvent(event);
      }
    }
  }

  onViewedPage(event) {
    window._tmr.push({
      id: this.getOption('counterId'),
      type: 'pageView',
      start: Date.now(),
    });

    const page = event.page;
    if (page) {
      if (page.type === 'home') {
        this.onViewedHome();
      } else if (page.type === 'cart') {
        this.onViewedCart();
      } else if (['product', 'category', 'checkout', 'confirmation'].indexOf(page.type) < 0) {
        this.onViewedOtherPage();
      }
    }
  }

  onViewedHome() {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'home',
      totalvalue: '',
      list: this.getList(),
    });
  }

  onViewedProductCategory() {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'category',
      totalvalue: '',
      list: this.getList(),
    });
  }

  onViewedProductDetail(event) {
    const product = event.product;
    window._tmr.push({
      type: 'itemView',
      productid: product.id || product.skuCode || '',
      pagetype: 'product',
      totalvalue: product.unitSalePrice || product.unitPrice || '',
      list: this.getList(),
    });
  }

  onViewedCart() {
    const cart = this.digitalData.cart;
    let productIds;

    if (cart.lineItems || cart.lineItems.length > 0) {
      productIds = lineItemsToProductIds(cart.lineItems);
    }

    window._tmr.push({
      type: 'itemView',
      productid: productIds || '',
      pagetype: 'cart',
      totalvalue: cart.total || cart.subtotal || '',
      list: this.getList(),
    });
  }

  onViewedOtherPage() {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'other',
      totalvalue: '',
      list: this.getList(),
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    let productIds;

    if (transaction.lineItems || transaction.lineItems.length > 0) {
      productIds = lineItemsToProductIds(transaction.lineItems);
    }

    window._tmr.push({
      type: 'itemView',
      productid: productIds || '',
      pagetype: 'purchase',
      totalvalue: transaction.total || transaction.subtotal || '',
      list: this.getList(),
    });
  }

  trackCustomEvent(event) {
    window._tmr.push({
      id: this.getOption('counterId'),
      type: 'reachGoal',
      goal: event.name,
    });
  }
}

export default MyTarget;
