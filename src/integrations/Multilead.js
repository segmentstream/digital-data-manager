import Integration from './../Integration';
import { getProp } from 'driveback-utils/dotProp';
import {
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
];

class Multilead extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      shopId: '',
      afsecure: '',
      rbProductPixelId: '',
      rbConversionPixelId: '',
      utmSource: 'multilead',
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag('productMailRuPixel', {
      type: 'script',
      attr: {
        src: `https://ad.mail.ru/${options.rbProductPixelId}.gif?shop=${options.shopId}&offer={{ productId }}&rnd=${Date.now()}`,
      },
    });

    this.addTag('conversionMailRuPixel', {
      type: 'script',
      attr: {
        src: `https://rs.mail.ru/${options.rbConversionPixelId}.gif?rnd=${Date.now()}`,
      },
    });

    this.addTag('conversionPixel', {
      type: 'script',
      attr: {
        src: `https://track.multilead.ru/success.php?afid={{ orderId }}&afprice={{ total }}&afcurrency={{ currency }}&afsecure=${options.afsecure}`,
      },
    });
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case VIEWED_PRODUCT_DETAIL:
        return ['product.id'];
      case COMPLETED_TRANSACTION:
        return ['context.campaign', 'transaction'];
      default:
        return [];
    }
  }

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PRODUCT_DETAIL]: {
        fields: ['product.id'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'transaction.currency',
          'context.campaign.source',
        ],
        validation: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric'],
          },
        },
      },
    };

    const validationConfig = config[event.name];
    return validationConfig;
  }

  initialize() {
    this._isLoaded = true;
  }

  isLoaded() {
    return this._isLoaded;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (product && product.id) {
      this.load('productMailRuPixel', {
        productId: product.id,
      });
    }
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const campaign = getProp(event, 'context.campaign') || {};
    if (transaction.orderId && campaign.source === this.getOption('utmSource')) {
      const orderId = transaction.orderId;
      const total = transaction.total;
      const currency = transaction.currency || 'RUB';
      this.load('conversionMailRuPixel');
      this.load('conversionPixel', { orderId, total, currency });
    }
  }
}

export default Multilead;
