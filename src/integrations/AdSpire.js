import Integration from './../Integration';
import cleanObject from './../functions/cleanObject';
import { getProp } from './../functions/dotProp';
import ipToLong from './../functions/ipToLong';
import normalizeString from './../functions/normalizeString';
import md5 from 'crypto-js/md5';
import { ERROR_TYPE_NOTICE } from './../EventValidator';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
} from './../events';

function mapLineItems(lineItems) {
  lineItems = lineItems || [];
  return lineItems.map((lineItem) => {
    const product = lineItem.product || {};
    product.category = product.category || [];
    return cleanObject({
      pid: product.id,
      pname: product.name,
      cid: product.categoryId,
      cname: product.category[product.category.length - 1],
      price: product.unitSalePrice,
      quantity: lineItem.quantity || 1,
      currency: product.currency,
      variant_id: product.skuCode,
    });
  });
}

class AdSpire extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: `//track.adspire.io/code/${options.siteId}/`,
      },
    });
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
    case VIEWED_PAGE:
      return ['page.type'];
    case VIEWED_PRODUCT_DETAIL:
      return ['product'];
    case COMPLETED_TRANSACTION:
      return ['transaction', 'user.email', 'user.firstName', 'user.lastName'];
    case VIEWED_PRODUCT_LISTING:
      return ['listing.categoryId', 'listing.category'];
    case VIEWED_CART:
      return ['cart'];
    default:
      return [];
    }
  }

  getEventValidations(event) {
    switch (event.name) {
    case VIEWED_PAGE:
      return [
        ['page.type', { required: true }],
      ];
    case VIEWED_PRODUCT_DETAIL:
      return [
        ['product.id', { required: true }],
        ['product.name', { required: true }, ERROR_TYPE_NOTICE],
        ['product.categoryId', { required: true }, ERROR_TYPE_NOTICE],
        ['product.category', { required: true }, ERROR_TYPE_NOTICE],
        ['product.unitSalePrice', { required: true }, ERROR_TYPE_NOTICE],
        ['product.currency', { required: true }, ERROR_TYPE_NOTICE],
        ['product.url', { required: true }, ERROR_TYPE_NOTICE],
        ['product.imageUrl', { required: true }, ERROR_TYPE_NOTICE],
      ];
    case VIEWED_PRODUCT_LISTING:
      return [
        ['listing.categoryId', { required: true }, ERROR_TYPE_NOTICE],
        ['listing.category', { required: true }, ERROR_TYPE_NOTICE],
      ];
    case VIEWED_CART:
      return [
        ['cart.lineItems[].product.id', { required: true }],
        ['cart.lineItems[].product.name', { required: true }, ERROR_TYPE_NOTICE],
        ['cart.lineItems[].product.categoryId', { required: true }, ERROR_TYPE_NOTICE],
        ['cart.lineItems[].product.category', { required: true }, ERROR_TYPE_NOTICE],
        ['cart.lineItems[].product.unitSalePrice', { required: true }, ERROR_TYPE_NOTICE],
        ['cart.lineItems[].product.currency', { required: true }, ERROR_TYPE_NOTICE],
        ['cart.lineItems[].quantity', { required: true }, ERROR_TYPE_NOTICE],
      ]
    case COMPLETED_TRANSACTION:
      return [
        ['transaction.orderId', { required: true }],
        ['transaction.total', { required: true }, ERROR_TYPE_NOTICE],
        ['transaction.lineItems[].product.id', { required: true }, ERROR_TYPE_NOTICE],
        ['transaction.lineItems[].product.name', { required: true }, ERROR_TYPE_NOTICE],
        ['transaction.lineItems[].product.categoryId', { required: true }, ERROR_TYPE_NOTICE],
        ['transaction.lineItems[].product.category', { required: true }, ERROR_TYPE_NOTICE],
        ['transaction.lineItems[].product.unitSalePrice', { required: true }, ERROR_TYPE_NOTICE],
        ['transaction.lineItems[].product.currency', { required: true }, ERROR_TYPE_NOTICE],
        ['transaction.lineItems[].quantity', { required: true }, ERROR_TYPE_NOTICE],
      ];
    default:
      return [];
    }
  }

  getSemanticEvents() {
    return [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      COMPLETED_TRANSACTION,
      VIEWED_CART,
    ];
  }

  initialize() {
    window.adspire_track = window.adspire_track || [];
    this.load(this.onLoad);
  }

  isLoaded() {
    return !!window.adspire_code_loaded;
  }

  getEmailMd5(event) {
    const email = getProp(event, 'user.email');
    if (email) {
      const emailNorm = normalizeString(email);
      const emailMd5 = md5(emailNorm).toString();
      return emailMd5;
    }
    return undefined;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [VIEWED_CART]: 'onViewedCart',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage(event) {
    this.pageTracked = false;

    const page = event.page;
    const ip = getProp(event, 'context.ip');

    if (ip) {
      window.adspire_ip = ipToLong(ip);
    }

    if (page && page.type === 'home') {
      this.onViewedHome();
    }

    if (!this.pageTracked) {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.onViewedOther();
        }
      }, 100);
    }
  }

  onViewedHome() {
    window.adspire_track.push({
      TypeOfPage: 'general',
    });
    this.pageTracked = true;
  }

  onViewedOther() {
    window.adspire_track.push({
      TypeOfPage: 'other',
    });
    this.pageTracked = true;
  }

  onViewedProductListing(event) {
    const cid = getProp(event, 'listing.categoryId');
    let cname;
    const category = getProp(event, 'listing.category');
    if (category && Array.isArray(category)) {
      cname = category[category.length - 1];
    }

    window.adspire_track.push(cleanObject({
      TypeOfPage: 'category',
      Category: { cid, cname },
    }));
    this.pageTracked = true;
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    const cid = product.categoryId;
    const category = product.category || [];
    const cname = category[category.length - 1];

    window.adspire_track.push(cleanObject({
      TypeOfPage: 'product',
      Category: { cid, cname },
      Product: {
        pid: product.id,
        pname: product.name,
        url: product.url,
        picture: product.imageUrl,
        price: product.unitSalePrice,
        currency: product.currency,
        variant_id: product.skuCode,
      },
    }));
    this.pageTracked = true;
  }

  onViewedCart(event) {
    const cart = event.cart || {};

    window.adspire_track.push({
      TypeOfPage: 'basket',
      Basket: mapLineItems(cart.lineItems),
    });
    this.pageTracked = true;
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const user = event.user || {};
    transaction.vouchers = transaction.vouchers || [];

    window.adspire_track.push({
      TypeOfPage: 'confirm',
      Order: cleanObject({
        id: transaction.orderId,
        totalprice: transaction.total,
        coupon: transaction.vouchers.join(','),
        usermail: (transaction.isFirst) ? 'new' : 'old',
        name: user.firstName,
        lastname: user.lastName,
        email: this.getEmailMd5(event),
      }),
      OrderItems: mapLineItems(transaction.lineItems),
    });
    this.pageTracked = true;
  }
}

export default AdSpire;
