import Integration from './../Integration';
import { getProp } from 'driveback-utils/dotProp';
import {
  VIEWED_PRODUCT_DETAIL,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

class DuMedia extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      code: '',
    }, options);
    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        id: 'dumedia',
        src: `//cdn.dumedia.ru/js/dumedia.js?r${Date.now()}`,
      },
    });
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case VIEWED_PRODUCT_DETAIL:
        return ['product'];
      case COMPLETED_TRANSACTION:
        return ['transaction'];
      case VIEWED_CART:
        return ['cart'];
      default:
        return [];
    }
  }

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PRODUCT_DETAIL]: {
        fields: [
          'product.id',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.lineItems[].product.id',
        ],
        validations: {
          'transaction.lineItems[].product.id': {
            warnings: ['required', 'string'],
          },
        },
      },
    };

    return config[event.name];
  }

  getSemanticEvents() {
    return [
      VIEWED_PRODUCT_DETAIL,
      COMPLETED_TRANSACTION,
      VIEWED_CART,
    ];
  }

  initialize() {
    window._dmTrack = window._dmTrack || [];
    this._isLoaded = true;
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [VIEWED_CART]: 'onViewedCart',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedProductDetail(event) {
    window._dmTrack.push({
      code: this.getOption('code'),
      level: 'product',
      ad_product: {
        id: getProp(event, 'product.id'),
      },
    });
    this.load();
  }

  onViewedCart(event) {
    const lineItems = getProp(event, 'cart.lineItems') || [];
    if (lineItems.length) {
      window._dmTrack.push({
        code: this.getOption('code'),
        level: 'basket',
        ad_products: lineItems.map(lineItem => ({ id: getProp(lineItem, 'product.id') })),
      });
      this.load();
    }
  }

  onCompletedTransaction(event) {
    const lineItems = getProp(event, 'transaction.lineItems') || [];
    if (lineItems.length) {
      window._dmTrack.push({
        code: this.getOption('code'),
        level: 'buy',
        ad_products: lineItems.map(lineItem => ({ id: getProp(lineItem, 'product.id') })),
      });
      this.load();
    }
  }
}

export default DuMedia;
