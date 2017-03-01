import {
  Integration,
  getEnrichableVariableMappingProps,
  extractVariableMappingValues,
} from './../Integration';
import deleteProperty from './../functions/deleteProperty';
import arrayMerge from './../functions/arrayMerge';
import {
  VIEWED_PAGE,
  LOGGED_IN,
  REGISTERED,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION,
} from './../events';

function getProductCategory(product) {
  let category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = category + '/' + product.subcategory;
  }
  return category;
}

function getProductId(product) {
  return product.id || product.skuCode || undefined;
}

function getProduct(product, quantity) {
  const yaProduct = {};
  const id = getProductId(product);
  const brand = product.brand || product.manufacturer;
  const price = product.unitSalePrice || product.unitPrice;
  const category = getProductCategory(product);
  if (id) yaProduct.id = id;
  if (product.name) yaProduct.name = product.name;
  if (brand) yaProduct.brand = brand;
  if (price) yaProduct.price = price;
  if (category) yaProduct.category = category;
  if (product.variant) yaProduct.variant = product.variant;
  if (product.voucher) yaProduct.coupon = product.voucher;
  if (quantity) yaProduct.quantity = quantity;
  return yaProduct;
}

class YandexMetrica extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      counterId: '',
      clickmap: false,
      webvisor: false,
      trackLinks: true,
      trackHash: false,
      purchaseGoalId: undefined,
      goals: {},
      visitParamsVars: {},
      userParamsVars: {},
      noConflict: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    // use custom dataLayer name to avoid conflicts
    this.dataLayerName = 'yandexDL';

    this.enrichableUserParamsProps = getEnrichablePropsFromVariableMapping(this.getOption('userParamsVars'));
    this.enrichableVisitParamsProps = getEnrichablePropsFromVariableMapping(this.getOption('visitParamsVars'));

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      REMOVED_PRODUCT,
      COMPLETED_TRANSACTION,
      LOGGED_IN,
      REGISTERED,
    ];

    this.goalEvents = Object.keys(this.getOption('goals'));
    for (const goalEvent of this.goalEvents) {
      if (this.SEMANTIC_EVENTS.indexOf(goalEvent) < 0) {
        this.SEMANTIC_EVENTS.push(goalEvent);
      }
    }

    this.pageCalled = false;

    this.addTag({
      type: 'script',
      attr: {
        src: '//mc.yandex.ru/metrika/watch.js',
      },
    });
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getGoalEvents() {
    return this.goalEvents;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case VIEWED_PRODUCT_DETAIL:
      enrichableProps = [
        'product',
      ];
      break;
    case COMPLETED_TRANSACTION:
      enrichableProps = [
        'transaction',
      ];
      break;
    default:
      const goalEvents = this.getGoalEvents();
      if (goalEvents.indexOf(event.name) >= 0) {
        arrayMerge(enrichableProps, this.getEnrichableUserParamsProps());
        arrayMerge(enrichableProps, this.getEnrichableVisitParamsProps());
      }
    }
    return enrichableProps;
  }

  getEnrichableUserParamsProps() {
    return this.enrichableUserParamsProps;
  }

  getEnrichableVisitParamsProps() {
    return this.enrichableVisitParamsProps;
  }

  getUserParams(event) {
    return extractVariableMappingValues(event, this.getOption('userParamsVars'));
  }

  getVisitParams(event) {
    return extractVariableMappingValues(event, this.getOption('visitParamsVars'));
  }

  initialize() {
    window.yandex_metrika_callbacks = window.yandex_metrika_callbacks || [];
    this.dataLayer = window[this.dataLayerName] = window[this.dataLayerName] || [];
    if (!this.getOption('noConflict')) {
      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  isLoaded() {
    return !!(window.Ya && window.Ya.Metrika);
  }

  reset() {
    deleteProperty(window, 'Ya');
    deleteProperty(window, 'yandex_metrika_callbacks');
    deleteProperty(window, this.dataLayerName);
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [REMOVED_PRODUCT]: 'onRemovedProduct',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };
    if (this.getOption('counterId')) {
      const method = methods[event.name];
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      }

      const goals = this.getOption('goals');
      const goalIdentificator = goals[event.name];
      if (goalIdentificator) {
        this.yaCounter.reachGoal(goalIdentificator);
      }
    }
  }

  onViewedPage(event) {
    const id = this.getOption('counterId');
    if (!id) return;

    window.yandex_metrika_callbacks.push(() => {
      if (!this.pageCalled) {
        this.yaCounter = window['yaCounter' + id] = new window.Ya.Metrika({
          id,
          clickmap: this.getOption('clickmap'),
          webvisor: this.getOption('webvisor'),
          trackLinks: this.getOption('trackLinks'),
          trackHash: this.getOption('trackHash'),
          ecommerce: this.dataLayerName,
          params: this.getVisitParams(event),
          userParams: this.getUserParams(event),
        });
        this.pageCalled = true;
      } else {
        // ajax pageview
        const page = event.page || {};
        const url = event.page.url || window.location.href;
        this.yaCounter.hit(url, {
          referer: event.page.referrer || document.referrer,
          title: event.page.title || document.title,
          params: this.getVisitParams(event),
        });
      }
    });
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (!getProductId(product) && !product.name) return;
    this.dataLayer.push({
      ecommerce: {
        detail: {
          products: [ getProduct(product) ],
        },
      },
    });
  }

  onAddedProduct(event) {
    const product = event.product;
    if (!getProductId(product) && !product.name) return;
    const quantity = event.quantity || 1;
    this.dataLayer.push({
      ecommerce: {
        add: {
          products: [ getProduct(product, quantity) ],
        },
      },
    });
  }

  onRemovedProduct(event) {
    const product = event.product;
    if (!getProductId(product) && !product.name) return;
    const quantity = event.quantity;
    this.dataLayer.push({
      ecommerce: {
        remove: {
          products: [
            {
              id: getProductId(product),
              name: product.name,
              category: getProductCategory(product),
              quantity: quantity,
            },
          ],
        },
      },
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (!transaction.orderId) return;

    const products = transaction.lineItems.filter((lineItem) => {
      const product = lineItem.product;
      return (getProductId(product) || product.name);
    }).map((lineItem) => {
      const product = lineItem.product;
      const quantity = lineItem.quantity || 1;
      return getProduct(product, quantity);
    });
    const purchase = {
      actionField: {
        id: transaction.orderId,
        goal_id: this.getOption('purchaseGoalId'),
      },
      products,
    };

    if (transaction.vouchers && transaction.vouchers.length) {
      purchase.actionField.coupon = transaction.vouchers[0];
    }

    if (transaction.total) {
      purchase.actionField.revenue = transaction.total;
    } else if (transaction.subtotal) {
      purchase.actionField.revenue = transaction.subtotal;
    }

    this.dataLayer.push({
      ecommerce: { purchase },
    });
  }
}

export default YandexMetrica;
