import Integration from './../Integration';
import { getProp } from 'driveback-utils/dotProp';
import AsyncQueue from './utils/AsyncQueue';
import cleanObject from 'driveback-utils/cleanObject';
import {
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  STARTED_ORDER,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

class AnyQuery extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
    }, options);
    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: `//cdn.diginetica.net/${options.siteId}/client.js?ts=${Date.now()}`,
      },
    });
  }

  getEnrichableEventProps(event) {
    const enrichableProps = ['user.userId', 'user.anonymousId', 'website.type', 'website.regionId'];
    if (event.name === VIEWED_PRODUCT_DETAIL) {
      enrichableProps.push('product');
    } else if (event.name === VIEWED_PRODUCT_LISTING || event.name === SEARCHED_PRODUCTS) {
      enrichableProps.push('listing');
    } else if (event.name === VIEWED_CART || event.name === STARTED_ORDER) {
      enrichableProps.push('cart');
    } else if (event.name === COMPLETED_TRANSACTION) {
      enrichableProps.push('cart', 'transaction');
    }
    return enrichableProps;
  }

  getSemanticEvents() {
    return [
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      VIEWED_PRODUCT_LISTING,
      SEARCHED_PRODUCTS,
      VIEWED_CART,
      STARTED_ORDER,
      COMPLETED_TRANSACTION,
    ];
  }

  initialize() {
    this.asyncQueue = new AsyncQueue(this.isLoaded);
  }

  isLoaded() {
    return !!(window.Digi && window.divolte);
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
      [SEARCHED_PRODUCTS]: 'onSearchedProducts',
      [VIEWED_CART]: 'onViewedCart',
      [STARTED_ORDER]: 'onStartedOrder',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  commonProps(event) {
    return cleanObject({
      sessionId: getProp(event, 'user.anonymousId'),
      userId: getProp(event, 'user.userId'),
      regionId: getProp(event, 'website.regionId'),
      channel: getProp(event, 'website.type'),
    });
  }

  productProps(product, quantity) {
    return cleanObject({
      productId: product.id,
      productName: product.name,
      productBrand: product.manufacturer || product.brand,
      productDescription: product.description,
      breadcrumbs: product.category,
      availability: product.stock,
      sku: product.skuCode,
      price: product.unitPrice,
      salePrice: product.unitSalePrice,
      quantity,
    });
  }

  cartProps(cart, cartId) {
    return cleanObject({
      cartId,
      subtotal: cart.subtotal,
      shippingCost: cart.shippingCost,
      total: cart.total,
      cartItems: cart.lineItems.map(
        lineItem => this.productProps(lineItem.product, lineItem.quantity),
      ),
    });
  }

  digiTrack(eventType, eventProps, commonProps) {
    this.asyncQueue.push(() => {
      window.Digi.tracking.sendEvent({
        eventType,
        ...commonProps,
        ...eventProps,
      });
    });
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    this.digiTrack('PRODUCT_VIEW', this.productProps(product), this.commonProps(event));
  }

  onAddedProduct(event) {
    const product = event.product || {};
    this.digiTrack('CART_ADD_EVENT', this.productProps(product, event.quantity), this.commonProps(event));
  }

  onViewedProductListing(event) {
    const listing = event.listing || {};
    const items = listing.items || [];
    this.digiTrack('CATEGORY_VIEW', cleanObject({
      breadcrumbs: listing.category,
      pageProducts: items.map(item => item.id),
      sorting: listing.sortBy,
      count: items.length,
    }), this.commonProps(event));
  }

  onSearchedProducts(event) {
    const listing = event.listing || {};
    const items = listing.items || [];
    this.digiTrack('SEARCH_EVENT', cleanObject({
      searchTerm: listing.query,
      pageProducts: items.map(item => item.id),
      sorting: listing.sortBy,
      count: items.length,
    }), this.commonProps(event));
  }

  onViewedCart(event) {
    const cart = event.cart || {};
    const user = event.user || {};
    this.digiTrack('CART_VIEW', this.cartProps(cart, user.anonymousId), this.commonProps(event));
  }

  onStartedOrder(event) {
    const cart = event.cart || {};
    const user = event.user || {};
    const cartId = cart.id || user.anonymousId;
    this.digiTrack('ORDER_VIEW', this.cartProps(cart, cartId), this.commonProps(event));
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    const cart = event.cart || {};
    const user = event.user || {};
    const cartId = transaction.cartId || cart.id || user.anonymousId;
    this.digiTrack('ORDER_SUCCESS', this.cartProps(transaction, cartId), this.commonProps(event));
  }
}

export default AnyQuery;
