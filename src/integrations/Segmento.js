import Integration from './../Integration.js';
import { getProp } from './../functions/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_CART,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_CART,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_TRANSACTION,
];

function mapLineItems(lineItems) {
  lineItems = lineItems || [];
  const products = lineItems.map(lineItem => ({
    qty: lineItem.quantity,
    price: getProp(lineItem, 'product.unitSalePrice'),
    sku: getProp(lineItem, 'product.id'),
  }));
  return products;
}

class Segmento extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      accountKey: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this._isLoaded = false;

    this.addTag({
      type: 'script',
      attr: {
        src: '//cdn.rutarget.ru/static/tag/tag.js',
      },
    });
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case VIEWED_PRODUCT_DETAIL:
        return [
          'product.id',
          'product.unitSalePrice',
        ];
      case VIEWED_PRODUCT_LISTING:
        return [
          'listing.categoryId',
          'listing.category',
        ];
      case VIEWED_CART:
      case VIEWED_CHECKOUT_STEP:
        return [
          'cart',
        ];
      case COMPLETED_TRANSACTION:
        return [
          'transaction',
        ];
      default:
        return [];
    }
  }

  getEventValidationConfig(event) {
    const productValidationConfig = {
      fields: ['product.id', 'product.unitSalePrice'],
      validations: {
        'product.id': {
          errors: ['required'],
          warnings: ['string'],
        },
        'product.unitSalePrice': {
          errors: ['required'],
          warnings: ['numeric'],
        },
      },
    };
    const cartValidationConfig = {
      fields: [
        'cart.lineItems[].product.id',
        'cart.lineItems[].product.unitSalePrice',
        'cart.lineItems[].quantity',
      ],
      validations: {
        'cart.lineItems[].product.id': {
          errors: ['required'],
          warnings: ['string'],
        },
        'cart.lineItems[].product.unitSalePrice': {
          errors: ['required'],
          warnings: ['numeric'],
        },
        'cart.lineItems[].quantity': {
          errors: ['required'],
          warnings: ['numeric'],
        },
      },
    };
    const config = {
      [VIEWED_PRODUCT_DETAIL]: productValidationConfig,
      [ADDED_PRODUCT]: productValidationConfig,
      [REMOVED_PRODUCT]: {
        fields: ['product.id'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: ['listing.categoryId', 'listing.category'],
        validations: {
          'listing.categoryId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'listing.category': {
            errors: ['required', 'array'],
          },
        },
      },
      [VIEWED_CART]: cartValidationConfig,
      [VIEWED_CHECKOUT_STEP]: cartValidationConfig,
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].quantity',
        ],
        validations: {
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.unitSalePrice': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'transaction.lineItems[].quantity': {
            errors: ['required'],
            warnings: ['numeric'],
          },
        },
      },
    };

    return config[event.name];
  }

  initialize() {
    window.rtgNoSync = false;
    window.rtgSyncFrame = true;
    window._rutarget = window._rutarget || [];
  }

  isLoaded() {
    return !!(window._rutarget && Array.prototype.push !== window._rutarget.push);
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [VIEWED_CHECKOUT_STEP]: 'onViewedCheckoutStep',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [REMOVED_PRODUCT]: 'onRemovedProduct',
      [VIEWED_CART]: 'onViewedCart',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage() {
    setTimeout(() => {
      if (!this.pageTracked) {
        window._rutarget.push({ event: 'otherPage' });
      }
    }, 100);
  }

  onViewedProductListing(event) {
    const listing = event.listing;
    if (!listing || !listing.categoryId || !listing.category) return;

    const category = listing.category;
    let categoryName;
    if (category && Array.isArray(category)) {
      categoryName = category[category.length - 1];
    }

    window._rutarget.push({
      event: 'showCategory',
      categoryCode: listing.categoryId,
      categoryName,
    });
    this.pageTracked = true;
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (!product || !product.id || !product.unitSalePrice) return;

    window._rutarget.push({
      event: 'showOffer',
      sku: product.id,
      price: product.unitSalePrice,
    });
    this.pageTracked = true;
  }

  onAddedProduct(event) {
    const product = event.product;
    if (!product || !product.id || !product.unitSalePrice) return;

    window._rutarget.push({
      event: 'addToCart',
      sku: product.id,
      qty: event.quantity || 1,
      price: product.unitSalePrice,
    });
  }

  onRemovedProduct(event) {
    const product = event.product;
    if (!product || !product.id) return;

    window._rutarget.push({
      event: 'removeFromCart',
      sku: product.id,
      qty: event.quantity || 1,
    });
  }

  onViewedCart(event) {
    if (this.cartTracked) return;

    const cart = event.cart;
    if (!cart || !cart.lineItems) return;

    window._rutarget.push({
      event: 'cart',
      products: mapLineItems(cart.lineItems),
    });
    this.cartTracked = true;
    this.pageTracked = true;
  }

  onViewedCheckoutStep(event) {
    if (this.cartTracked) return;

    const cart = event.cart;
    if (!cart || !cart.lineItems) return;

    window._rutarget.push({
      event: 'confirmOrder',
      products: mapLineItems(cart.lineItems),
    });
    this.cartTracked = true;
    this.pageTracked = true;
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (!transaction || !transaction.lineItems) return;

    window._rutarget.push({
      event: 'thankYou',
      products: mapLineItems(transaction.lineItems),
    });
    this.cartTracked = true;
    this.pageTracked = true;
  }
}

export default Segmento;
