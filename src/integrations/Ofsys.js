import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty';
import cleanObject from './../functions/cleanObject';
import { getProp } from './../functions/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION,
} from './../events';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION,
];

/* eslint-disable new-cap */

class Ofsys extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      accountKey: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: `https://t.ofsys.com/js/Journey/1/${options.accountKey}/DI.Journey-min.js`,
      },
    });
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case VIEWED_PAGE:
      enrichableProps = [
        'user.email',
        'cart',
      ];
      break;
    case VIEWED_PRODUCT_DETAIL:
      enrichableProps = [
        'product.id',
      ];
      break;
    case COMPLETED_TRANSACTION:
      enrichableProps = [
        'transaction',
      ];
      break;
    default:
      // do nothing
    }

    return enrichableProps;
  }

  initialize() {
    this.asyncQueue = [];

    // emulate async queue for Ofsys sync script
    let invervalCounter = 0;
    const invervalId = setInterval(() => {
      invervalCounter++;
      if (this.isLoaded()) {
        this.flushQueue();
        clearInterval(invervalId);
      } else if (invervalCounter > 10) {
        clearInterval(invervalId);
      }
    }, 100);

    this.load(this.onLoad);
  }

  flushQueue() {
    let handler = this.asyncQueue.shift();
    while (handler && typeof handler === 'function') {
      handler();
      handler = this.asyncQueue.shift();
    }
    this.asyncQueue.push = (callback) => {
      callback();
    };
  }

  isLoaded() {
    return !!(window.DI && window.DI.Journey);
  }

  reset() {
    deleteProperty(window, 'OFSYS_Tracking_onload');
    deleteProperty(window, 'DI');
  }

  createCart(cart) {
    if (!cart || !cart.id || !cart.lineItems || !cart.lineItems.length) return;
    this.cartId = cart.id;
    this.cart = cart;

    this.asyncQueue.push(() => {
      window.DI.Journey.ECommerce.AddCart(cleanObject({ // eslint-disable-line new-cap
        idCart: cart.id,
        status: cart.checkoutStep,
        TotalPrice: cart.total,
      }));
    });

    this.asyncQueue.push(() => {
      for (const lineItem of cart.lineItems) {
        window.DI.Journey.ECommerce.AddCartItem({
          idCart: cart.id,
          idProduct: getProp(lineItem, 'product.id'),
          productName: getProp(lineItem, 'product.name'),
          priceunit: getProp(lineItem, 'product.unitSalePrice') || getProp(lineItem, 'product.unitPrice'),
          quantity: lineItem.quantity || 1,
        });
      }
      window.DI.Journey.ECommerce.SubmitCart();
    });
  }

  getCartItemNewQuantity(productId, additionalQuantity) {
    const cart = this.cart;
    if (!cart || !cart.lineItems || !cart.lineItems.length) {
      return additionalQuantity;
    }
    return cart.lineItems.reduce((acc, lineItem) => {
      const product = lineItem.product;
      if (product && String(product.id) === String(productId)) {
        acc += (lineItem.quantity || 1);
      }
      return acc;
    }, 0);
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [REMOVED_PRODUCT]: 'onRemovedProduct',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage(event) {
    const email = getProp(event, 'user.email');
    if (email) {
      this.asyncQueue.push(() => {
        window.DI.Journey.Set('f_EMail', email);
        window.DI.Journey.Track();
      });
    }

    this.createCart(event.cart);
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (!product || !product.id) return;

    this.asyncQueue.push(() => {
      window.DI.Journey.ECommerce.ProductView(product.id);
    });
  }

  onAddedProduct(event) {
    const product = event.product;

    if (!product || !product.id || !this.cartId) return;

    this.asyncQueue.push(() => {
      window.DI.Journey.ECommerce.AddCartItem({
        idCart: this.cartId,
        idProduct: product.id,
        productName: product.name,
        priceunit: product.unitSalePrice || product.unitPrice,
        quantity: this.getCartItemNewQuantity(product.id, event.quantity) || 1,
      });
      window.DI.Journey.ECommerce.SubmitCart();
    });
  }

  onRemovedProduct(event) {
    const product = event.product;
    if (!product || !product.id || !this.cartId) return;

    this.asyncQueue.push(() => {
      window.DI.Journey.ECommerce.RemoveCartItem({
        idCart: this.cartId,
        idProduct: product.id,
      });
      window.DI.Journey.ECommerce.SubmitCart();
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (!transaction || !transaction.orderId) return;

    this.asyncQueue.push(() => {
      window.DI.Journey.ECommerce.AddTransaction(cleanObject({
        idTransaction: transaction.orderId,
        idCart: transaction.cartId,
        affiliation: transaction.affiliation,
        revenue: transaction.total,
        tax: transaction.tax,
        shipping: transaction.shippingCost,
      }));
    });

    if (transaction.lineItems && Array.isArray(transaction.lineItems)) {
      this.asyncQueue.push(() => {
        for (const lineItem of transaction.lineItems) {
          const unitSalePrice = getProp(lineItem, 'product.unitSalePrice') || getProp(lineItem, 'product.unitPrice');
          const quantity = lineItem.quantity || 1;
          window.DI.Journey.ECommerce.AddItem({
            idTransaction: transaction.orderId,
            idCart: transaction.cartId,
            idProduct: getProp(lineItem, 'product.id'),
            productName: getProp(lineItem, 'product.name'),
            Price_unit: unitSalePrice,
            Price_total: lineItem.subtotal || unitSalePrice * quantity,
            quantity: quantity,
          });
        }
      });
    }

    this.asyncQueue.push(() => {
      window.DI.Journey.ECommerce.SubmitTransaction();
    });
  }
}

export default Ofsys;
