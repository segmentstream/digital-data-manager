import { getProp } from 'driveback-utils/dotProp';
import Integration from '../Integration';
import { VIEWED_PAGE, VIEWED_PRODUCT_DETAIL, ADDED_PRODUCT, COMPLETED_TRANSACTION } from '../events/semanticEvents';

const ACTION_TYPE_VIEW = 'VIEW';
const ACTION_TYPE_CART_ADD = 'CART_ADD';
const ACTION_TYPE_CONVERSION = 'CONVERSION';

class Getintent extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
    }, options);
    super(digitalData, optionsWithDefaults);

    this.addTag('pixel', {
      type: 'script',
      attr: {
        src: 'https://px.adhigh.net/p.js',
      },
    });
  }

  initialize() {
    window.__GetI = window.__GetI || [];
    this._isLoaded = true;
  }

  getSemanticEvents() {
    return [VIEWED_PAGE, VIEWED_PRODUCT_DETAIL, ADDED_PRODUCT, COMPLETED_TRANSACTION];
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case [VIEWED_PRODUCT_DETAIL]:
        return ['product'];
      case [COMPLETED_TRANSACTION]:
        return ['transaction'];
      default:
        return [];
    }
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  trackGetIntentAction(params) {
    window.__GetI.push(params);
    this.load('pixel');
    this.pageTracked = true;
  }

  onViewedPage() {
    this.pageTracked = false;
    setTimeout(() => {
      if (!this.pageTracked) {
        this.trackGetIntentAction({
          type: ACTION_TYPE_VIEW,
          site_id: this.getOption('siteId'),
        });
      }
    }, 100);
  }

  onViewedProductDetail(event) {
    const product = event.product || {};

    this.trackGetIntentAction({
      type: ACTION_TYPE_VIEW,
      site_id: this.getOption('siteId'),
      category_id: product.categoryId,
      product_id: product.id,
      product_price: product.unitSalePrice,
    });
  }

  onAddedProduct(event) {
    const product = event.product || {};

    this.trackGetIntentAction({
      type: ACTION_TYPE_CART_ADD,
      site_id: this.getOption('siteId'),
      order: [
        {
          id: product.id,
          price: product.unitSalePrice,
          quantity: event.quantity || 1,
        },
      ],
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const lineItems = transaction.lineItems || [];

    this.trackGetIntentAction({
      type: ACTION_TYPE_CONVERSION,
      site_id: this.getOption('siteId'),
      order: lineItems.map((lineItem) => {
        lineItem = lineItem || {};
        return {
          id: getProp(lineItem, 'product.id'),
          price: getProp(lineItem, 'product.unitSalePrice'),
          quantity: lineItem.quantity || 1,
        };
      }),
      transaction_id: transaction.orderId,
      revenue: transaction.total,
    });
  }
}

export default Getintent;
