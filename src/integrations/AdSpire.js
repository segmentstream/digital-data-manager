import Integration from './../Integration';
import cleanObject from 'driveback-utils/cleanObject';
import { getProp } from 'driveback-utils/dotProp';
import ipToLong from 'driveback-utils/ipToLong';
import normalizeString from 'driveback-utils/normalizeString';
import md5 from 'crypto-js/md5';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
} from './../events/semanticEvents';

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

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PAGE]: {
        fields: ['page.type'],
        validations: {
          errors: ['required'],
          warnings: ['string'],
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: [
          'product.id',
          'product.name',
          'product.categoryId',
          'product.category',
          'product.unitSalePrice',
          'product.currency',
          'product.url',
          'product.imageUrl',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.name': {
            warnings: ['required', 'string'],
          },
          'product.categoryId': {
            warnings: ['required', 'string'],
          },
          'product.category': {
            warnings: ['required', 'array'],
          },
          'product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
          'product.currency': {
            warnings: ['required', 'string'],
          },
          'product.url': {
            warnings: ['required', 'string'],
          },
          'product.imageUrl': {
            warnings: ['required', 'string'],
          },
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: [
          'listing.categoryId',
          'listing.category',
        ],
        validations: {
          'listing.categoryId': {
            warnings: ['required', 'string'],
          },
          'listing.category': {
            warnings: ['required', 'array'],
          },
        },
      },
      [VIEWED_CART]: {
        fields: [
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.name',
          'cart.lineItems[].product.categoryId',
          'cart.lineItems[].product.category',
          'cart.lineItems[].product.unitSalePrice',
          'cart.lineItems[].product.currency',
          'cart.lineItems[].quantity',
        ],
        validations: {
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'cart.lineItems[].product.name': {
            warnings: ['required', 'string'],
          },
          'cart.lineItems[].product.categoryId': {
            warnings: ['required', 'string'],
          },
          'cart.lineItems[].product.category': {
            warnings: ['required', 'array'],
          },
          'cart.lineItems[].product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
          'cart.lineItems[].product.currency': {
            warnings: ['required', 'string'],
          },
          'cart.lineItems[].quantity': {
            warnings: ['required', 'numeric'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'transaction.isFirst',
          'transaction.vouchers',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.categoryId',
          'transaction.lineItems[].product.category',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].product.currency',
          'transaction.lineItems[].quantity',
          'user.email',
          'user.firstName',
          'user.lastName',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.total': {
            warnings: ['required', 'numeric'],
          },
          'transaction.lineItems[].product.id': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.name': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.categoryId': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.category': {
            warnings: ['required', 'array'],
          },
          'transaction.lineItems[].product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
          'transaction.lineItems[].product.currency': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].quantity': {
            warnings: ['required', 'numeric'],
          },
          'transaction.isFirst': {
            warnings: ['boolean'],
          },
          'transaction.vouchers': {
            warning: ['array'],
          },
        },
      },
    };

    return config[event.name];
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
