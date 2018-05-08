import Integration from './../Integration';
import AsyncQueue from './utils/AsyncQueue';
import arrayMerge from 'driveback-utils/arrayMerge';
import deleteProperty from 'driveback-utils/deleteProperty';
import { getProp } from 'driveback-utils/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  ADDED_PRODUCT,
  ADDED_PRODUCT_TO_WISHLIST,
  REMOVED_PRODUCT,
  REMOVED_PRODUCT_FROM_WISHLIST,
  STARTED_ORDER,
  ADDED_PAYMENT_INFO,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

const mapProduct = product => ({
  id: product.id,
  price: product.unitSalePrice,
  price_old: product.unitPrice,
});

const getCurrencyCode = (currency) => {
  if (currency === 'RUB') return 'RUR';
  return currency;
};

class Vkontakte extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      pixelId: '',
      priceListId: '',
      customEvents: {},
      eventPixels: {}, // legacy version of Vkontakte
    }, options);
    super(digitalData, optionsWithDefaults);

    this.asyncQueue = new AsyncQueue(this.isLoaded);

    if (this.getOption('pixelId')) {
      this.SEMANTIC_EVENTS = [
        VIEWED_PAGE,
        VIEWED_PRODUCT_DETAIL,
        VIEWED_PRODUCT_LISTING,
        SEARCHED_PRODUCTS,
        ADDED_PRODUCT,
        ADDED_PRODUCT_TO_WISHLIST,
        REMOVED_PRODUCT,
        REMOVED_PRODUCT_FROM_WISHLIST,
        STARTED_ORDER,
        ADDED_PAYMENT_INFO,
        COMPLETED_TRANSACTION,
      ];
    } else {
      this.SEMANTIC_EVENTS = [];
    }

    arrayMerge(this.SEMANTIC_EVENTS, Object.keys(this.getOption('eventPixels')));
    arrayMerge(this.SEMANTIC_EVENTS, Object.keys(this.getOption('customEvents')));

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://vk.com/js/api/openapi.js?150',
      },
    });
  }

  initialize() {
    this.asyncQueue.push(() => {
      window.VK.Retargeting.Init(this.getOption('pixelId')); // eslint-disable-line new-cap
    });
  }

  onLoadInitiated() {
    this.asyncQueue.init();
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    if (event.name === VIEWED_PAGE) {
      return ['page.type'];
    }
    if (event.name === VIEWED_PRODUCT_DETAIL) {
      return ['product'];
    }
    if (event.name === STARTED_ORDER || event.name === ADDED_PAYMENT_INFO) {
      return ['cart'];
    }
    if (event.name === COMPLETED_TRANSACTION) {
      return ['transaction'];
    }
    if (event.name === VIEWED_PRODUCT_LISTING || event.name === SEARCHED_PRODUCTS) {
      return ['listing'];
    }
    return [];
  }

  allowNoConflictInitialization() {
    return true;
  }

  isLoaded() {
    return !!(window.VK && window.VK.Retargeting);
  }

  reset() {
    deleteProperty(window, 'VK');
  }

  getPriceListId(event) {
    let priceListId;
    if (event) {
      priceListId = getProp(event, 'priceListId');
    }
    if (!priceListId) {
      priceListId = this.getOption('priceListId');
    }
    return priceListId;
  }

  trackSingleProduct(event, method) {
    const product = event.product || {};
    this.asyncQueue.push(() => {
      window.VK.Retargeting.ProductEvent(this.getPriceListId(event), method, {
        products: [mapProduct(product)],
        total_price: product.unitSalePrice,
        currency_code: getCurrencyCode(product.currency),
      });
    });
    this.pageTracked = true;
  }

  trackLineItems(lineItems, subtotal, currency, pricelistId, method) {
    this.asyncQueue.push(() => {
      window.VK.Retargeting.ProductEvent(pricelistId, method, {
        products: lineItems.map(lineItem => mapProduct(lineItem.product)),
        total_price: subtotal,
        currency_code: getCurrencyCode(currency),
      });
    });
    this.pageTracked = true;
  }

  trackCart(event, method) {
    const lineItems = getProp(event, 'cart.lineItems') || [];
    const subtotal = getProp(event, 'cart.subtotal');
    const currency = getProp(event, 'cart.currency');
    this.trackLineItems(lineItems, subtotal, currency, this.getPriceListId(event), method);
  }

  trackTransaction(event, method) {
    const lineItems = getProp(event, 'transaction.lineItems') || [];
    const subtotal = getProp(event, 'transaction.subtotal');
    const currency = getProp(event, 'transaction.currency');
    this.trackLineItems(lineItems, subtotal, currency, this.getPriceListId(event), method);
  }

  trackEvent(event) {
    if (this.getOption('pixelId')) { // works only with new version of pixel
      const methods = {
        [VIEWED_PAGE]: 'onViewedPage',
        [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
        [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
        [VIEWED_PRODUCT_LISTING]: 'onViewedProductListing',
        [SEARCHED_PRODUCTS]: 'onSearchedProducts',
        [ADDED_PRODUCT]: 'onAddedProduct',
        [REMOVED_PRODUCT]: 'onRemovedProduct',
        [ADDED_PRODUCT_TO_WISHLIST]: 'onAddedProductToWishlist',
        [REMOVED_PRODUCT_FROM_WISHLIST]: 'onRemovedProductFromWishlist',
        [STARTED_ORDER]: 'onStartedOrder',
        [ADDED_PAYMENT_INFO]: 'onAddedPaymentInfo',
      };

      const method = methods[event.name];
      if (method) {
        this[method](event);
      }
    }

    // new version of pixel
    const customEvents = this.getOption('customEvents');
    const customEventName = customEvents[event.name];
    if (customEventName) {
      this.asyncQueue.push(() => {
        window.VK.Retargeting.Event(customEventName); // eslint-disable-line new-cap
      });
    }

    // legacy version of pixel
    const eventPixels = this.getOption('eventPixels');
    const pixelUrl = eventPixels[event.name];
    if (pixelUrl) {
      this.addPixel(pixelUrl);
    }
  }

  onViewedPage(event) {
    this.pageTracked = false;

    this.asyncQueue.push(() => {
      window.VK.Retargeting.Hit(); // eslint-disable-line new-cap
    });

    const page = event.page || {};
    if (page.type === 'home') {
      this.asyncQueue.push(() => {
        window.VK.Retargeting.ProductEvent(this.getPriceListId(event), 'view_home');
      });
      this.pageTracked = true;
    } else {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.onViewedOther(event);
        }
      }, 100);
    }
  }

  onViewedOther(event) {
    this.asyncQueue.push(() => {
      window.VK.Retargeting.ProductEvent(this.getPriceListId(event), 'view_other');
    });
    this.pageTracked = true;
  }

  onViewedProductListing(event) {
    const items = getProp(event, 'listing.items') || [];
    this.asyncQueue.push(() => {
      window.VK.Retargeting.ProductEvent(this.getPriceListId(event), 'view_category', {
        category_ids: [getProp(event, 'listing.categoryId')],
        products_recommended_ids: items.slice(0, 4).map(item => item.id),
      });
    });
    this.pageTracked = true;
  }

  onViewedProductDetail(event) {
    this.trackSingleProduct(event, 'view_product');
  }

  onSearchedProducts(event) {
    const items = getProp(event, 'listing.items') || [];
    const query = getProp(event, 'listing.query');
    this.asyncQueue.push(() => {
      window.VK.Retargeting.ProductEvent(this.getPriceListId(event), 'view_search', {
        search_string: query,
        products_recommended_ids: items.slice(0, 4).map(item => item.id),
      });
    });
    this.pageTracked = true;
  }

  onAddedProductToWishlist(event) {
    this.trackSingleProduct(event, 'add_to_wishlist');
  }

  onAddedProduct(event) {
    this.trackSingleProduct(event, 'add_to_cart');
  }

  onRemovedProductFromWishlist(event) {
    this.trackSingleProduct(event, 'remove_from_wishlist');
  }

  onRemovedProduct(event) {
    this.trackSingleProduct(event, 'remove_from_cart');
  }

  onStartedOrder(event) {
    this.trackCart(event, 'init_checkout');
  }

  onAddedPaymentInfo(event) {
    this.trackCart(event, 'add_payment_info');
  }

  onCompletedTransaction(event) {
    this.trackTransaction(event, 'purchase');
  }

  addPixel(pixelUrl) {
    (window.Image ? (new Image()) : window.document.createElement('img')).src = window.location.protocol + pixelUrl;
  }
}

export default Vkontakte;
