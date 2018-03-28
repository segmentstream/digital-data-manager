import Integration from './../Integration';
import deleteProperty from 'driveback-utils/deleteProperty';
import { getProp } from 'driveback-utils/dotProp';
import { stringify } from 'driveback-utils/queryString';
import cleanObject from 'driveback-utils/cleanObject';
import {
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

class Get4Click extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      shopId: '',
      bannerId: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag('wrapper', {
      type: 'script',
      attr: {
        src: 'https://get4click.ru/wrapper.php?method=main&jsc=iPromoCpnObj&{{ params }}',
      },
    });
  }

  initialize() {
    window._iPromoBannerObj = function _iPromoBannerObj() {
      this.htmlElementId = 'promocode-element-container';
      this.gc = function gc() {
        return document.getElementById(this.htmlElementId);
      };
    };
    window.iPromoCpnObj = new window._iPromoBannerObj();
    this._isLoaded = true;
  }

  getSemanticEvents() {
    return [COMPLETED_TRANSACTION];
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case COMPLETED_TRANSACTION:
        return [
          'user.email',
          'user.firstName',
          'user.lastName',
          'user.phone',
          'user.gender',
          'transaction',
        ];
      default:
        return [];
    }
  }

  getEventValidationConfig(event) {
    const config = {
      [COMPLETED_TRANSACTION]: {
        fields: [
          'user.email',
          'user.firstName',
          'user.lastName',
          'transaction.orderId',
          'transaction.total',
          'transaction.vouchers',
        ],
        validations: {
          'user.email': {
            warnings: ['required', 'string'],
          },
          'user.firstName': {
            errors: ['string'],
          },
          'user.lastName': {
            errors: ['string'],
          },
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

    return config[event.name];
  }

  reset() {
    deleteProperty(window, 'iPromoCpnObj');
    deleteProperty(window, '_iPromoBannerObj');
  }

  trackEvent(event) {
    const eventMap = {
      [COMPLETED_TRANSACTION]: this.onCompletedTransaction.bind(this),
    };

    if (eventMap[event.name]) {
      eventMap[event.name](event);
    }
  }

  onCompletedTransaction(event) {
    const vouchers = getProp(event, 'transaction.vouchers');
    const params = cleanObject({
      _shopId: this.getOption('shopId'),
      _bannerId: this.getOption('bannerId'),
      _customerFirstName: getProp(event, 'user.firstName'),
      _customerLastName: getProp(event, 'user.lastName'),
      _customerEmail: getProp(event, 'user.email'),
      _customerPhone: getProp(event, 'user.phone'),
      _customerGender: getProp(event, 'user.gender'),
      _orderId: getProp(event, 'transaction.orderId'),
      _orderValue: getProp(event, 'transaction.total'),
      _orderCurrency: getProp(event, 'transaction.currency'),
      _usedPromoCode: Array.isArray(vouchers) ? vouchers.toString() : vouchers,
    });

    this.load('wrapper', { params: stringify(params) });
  }
}

export default Get4Click;
