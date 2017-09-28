import Integration from './../Integration';
import cleanObject from 'driveback-utils/cleanObject';
import noop from 'driveback-utils/noop';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  COMPLETED_TRANSACTION,
  VIEWED_CART,
} from './../events/semanticEvents';

function getBasketProducts(lineItems) {
  lineItems = lineItems || [];
  return lineItems.map((lineItem) => {
    const product = lineItem.product || {};
    product.category = product.category || [];
    return cleanObject({
      id: product.id,
      name: product.name,
      price: product.unitSalePrice,
      quantity: lineItem.quantity || 1,
    });
  });
}

function getProducts(items) {
  items = items || [];
  return items.map(product => ({
    id: product.id,
    name: product.name,
  }));
}

function getCurrentCategory(source) {
  const id = source.categoryId;
  let name;
  if (Array.isArray(source.category)) {
    name = source.category[source.category.length - 1];
  } else {
    name = source.category;
  }
  return cleanObject({ id, name });
}

function getCurrentProduct(product) {
  return {
    id: product.id,
    name: product.name,
    price: product.unitSalePrice,
  };
}

function getUser(user) {
  if (user.email) {
    return {
      email: user.email,
    };
  }
  return undefined;
}

class AdvCake extends Integration {
  constructor(digitalData, options) {
    super(digitalData, options);

    this.addTag({
      type: 'script',
      attr: {
        id: 'advcakeAsync',
        src: `//server.adv-cake.ru/int/?r=${Math.random()}`,
      },
    });

    this.addTag('antifraud', {
      type: 'script',
      attr: {
        id: 'advcakeAntifraudAsync',
        src: `//server.adv-cake.ru/antifraud/a.js?r=${Math.random()}`,
      },
    });
  }

  load() {
    super.load();
    super.load('antifraud');
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
      case VIEWED_PAGE:
        return ['page.type', 'cart', 'user.email'];
      case VIEWED_PRODUCT_DETAIL:
        return ['product'];
      case COMPLETED_TRANSACTION:
        return ['transaction', 'user.email'];
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
        fields: [
          'page.type',
          'user.email',
          'cart.lineItems[].product.id',
          'cart.lineItems[].product.name',
          'cart.lineItems[].product.unitSalePrice',
          'cart.lineItems[].quantity',
        ],
        validations: {
          'page.type': {
            errors: ['required', 'string'],
          },
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: [
          'product.id',
          'product.name',
          'product.categoryId',
          'product.category',
          'product.unitSalePrice',
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
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: [
          'listing.categoryId',
          'listing.category',
          'listing.items[].id',
          'listing.items[].name',
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
      [COMPLETED_TRANSACTION]: {
        fields: [
          'user.email',
          'transaction.orderId',
          'transaction.total',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].quantity',
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
          'transaction.lineItems[].quantity': {
            warnings: ['required', 'numeric'],
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
    window.advcake_push_data = window.advcake_push_data || noop;
    window.advcake_order = window.advcake_order || function advcakeOrder(orderId, orderPrice) {
      window.advcake_order_id = orderId;
      window.advcake_order_price = orderPrice;
    };
  }

  isLoaded() {
    return !!window.adspire_code_loaded;
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
    const page = event.page || {};
    this.cart = event.cart || {};
    this.user = event.user || {};
    if (page.type === 'home') {
      this.onViewedHome();
    } else if (page.type === 'checkout') {
      this.onViewedCheckoutPage();
    }
  }

  onViewedHome() {
    window.advcake_data = {
      pageType: 1,
      user: getUser(this.user),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedProductDetail(event) {
    window.advcake_data = {
      pageType: 2,
      user: getUser(this.user),
      currentCategory: getCurrentCategory(event.product),
      currentProduct: getCurrentProduct(event.product),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    window.advcake_data = {
      pageType: 3,
      user: getUser(this.user),
      currentCategory: getCurrentCategory(listing),
      products: getProducts(listing.items),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedCart() {
    window.advcake_data = {
      pageType: 4,
      user: getUser(this.user),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onViewedCheckoutPage() {
    window.advcake_data = {
      pageType: 5,
      user: getUser(this.user),
      basketProducts: getBasketProducts(this.cart.lineItems),
    };
    window.advcake_push_data(window.advcake_data);
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    window.advcake_data = {
      pageType: 6,
      user: getUser(event.user || this.user),
      basketProducts: getBasketProducts(transaction.lineItems),
      orderInfo: {
        id: transaction.orderId,
        totalPrice: transaction.total,
      },
    };
    window.advcake_push_data(window.advcake_data);
    window.advcake_order(transaction.orderId, transaction.total);
  }
}

export default AdvCake;
