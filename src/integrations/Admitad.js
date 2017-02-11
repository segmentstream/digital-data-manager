import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty';
import { getProp } from './../functions/dotProp';
import { COMPLETED_TRANSACTION, LEAD } from '/events';
import cookie from 'js-cookie';

function getScreenResolution() {
  return `${window.screen.width}x${window.screen.height}`;
}

const PAYMENT_TYPE_SALE = 'sale';
const PAYMENT_TYPE_LEAD = 'lead';

class Admitad extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      campaignCode: '',
      paymentType: 'sale',
      defaultActionCode: '1',
      responseType: 'img',
      cookieName: 'admitad_uid',
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag('trackingPixel', {
      type: 'script',
      attr: {
        id: '_admitad-pixel',
        src: `//cdn.asbmit.com/static/js/ad/pixel.min.js?r=${Date.now()}`,
      },
    });
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];

    if (event.name === COMPLETED_TRANSACTION) {
      enrichableProps = [
        'transaction',
        'user.userId',
        'website.currency',
      ];
    } else if (event.name === LEAD) {
      enrichableProps = [
        'user.userId',
      ];
    }

    return enrichableProps;
  }

  isLoaded() {
    return this._isLoaded;
  }

  reset() {
    deleteProperty(window, '_admitadPixel');
    deleteProperty(window, '_admitadPositions');
  }

  trackEvent(event) {
    const uid = cookie.get(this.getOption('cookieName'));
    if (!uid) return;

    if (event.name === COMPLETED_TRANSACTION && this.getOption('paymentType') === PAYMENT_TYPE_SALE) {
      this.trackSale(event, uid);
    } else if (event.name === LEAD && this.getOption('paymentType') === PAYMENT_TYPE_LEAD) {
      this.trackLead(event, uid);
    }
  }

  setupPixel(event) {
    window._admitadPixel = {
      response_type: this.getOption('responseType'),
      action_code: getProp('admitad.actionCode', event) || this.getOption('defaultActionCode'),
      campaign_code: this.getOption('campaignCode'),
    };
    window._admitadPositions = window._admitadPositions || [];
  }

  trackSale(event, uid) {
    const transaction = event.transaction;
    if (!transaction || !transaction.lineItems || !transaction.lineItems.length) {
      return;
    }

    this.setupPixel(event);

    const lineItems = transaction.lineItems;
    let index = 1;
    for (const lineItem of lineItems) {
      window._admitadPositions.push({
        uid: uid,
        order_id: transaction.orderId,
        position_id: index,
        client_id: getProp('user.userId', event),
        tariff_code: getProp('admitad.tariffCode', lineItem) || '1',
        currency_code: getProp('product.currency', lineItem) || getProp('website.currency', event) || '',
        position_count: lineItems.length,
        price: getProp('product.unitSalePrice', lineItem) || getProp('product.unitPrice', lineItem),
        quantity: lineItem.quantity || 1,
        product_id: getProp('product.id', lineItem),
        screen: getScreenResolution(),
        old_customer: (transaction.isFirst === false) ? 1 : 0,
        coupon: (transaction.vouchers && transaction.vouchers.length) ? 1 : 0,
        payment_type: PAYMENT_TYPE_SALE,
      });
      index += 1;
    }

    this.load('trackingPixel');
  }

  trackLead(event, uid) {
    this.setupPixel(event);
    window._admitadPositions.push({
      uid: uid,
      order_id: event.leadId,
      client_id: getProp('user.userId', event),
      tariff_code: getProp('admitad.tariffCode', event) || '1',
      screen: getScreenResolution(),
      payment_type: PAYMENT_TYPE_LEAD,
    });
  }
}

export default Admitad;
