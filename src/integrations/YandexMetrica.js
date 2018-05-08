import {
  getEnrichableVariableMappingProps,
  extractVariableMappingValues,
} from './../IntegrationUtils';
import Integration from './../Integration';
import deleteProperty from 'driveback-utils/deleteProperty';
import cleanObject from 'driveback-utils/cleanObject';
import arrayMerge from 'driveback-utils/arrayMerge';
import size from 'driveback-utils/size';
import cookie from 'js-cookie';
import { getProp } from 'driveback-utils/dotProp';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';
import { bind } from 'driveback-utils/eventListener';


function getProductCategory(product) {
  let category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = `${category}/${product.subcategory}`;
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
      sendUserId: true,
      clickmap: false,
      webvisor: false,
      webvisorVersion: 1,
      trackLinks: true,
      trackHash: false,
      purchaseGoalId: undefined,
      goals: {},
      visitParamsVars: {},
      userParamsVars: {},
    }, options);

    super(digitalData, optionsWithDefaults);

    // use custom dataLayer name to avoid conflicts
    this.dataLayerName = 'yandexDL';

    this.yaCounterClass = 'Metrika';
    this.yaCallbacksArrayName = 'yandex_metrika_callbacks';
    if (options.webvisor && options.webvisorVersion === 2) {
      this.yaCounterClass += '2';
      this.yaCallbacksArrayName += '2';
    }

    this.enrichableUserParamsProps = getEnrichableVariableMappingProps(this.getOption('userParamsVars'));
    this.enrichableVisitParamsProps = getEnrichableVariableMappingProps(this.getOption('visitParamsVars'));

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      ADDED_PRODUCT,
      REMOVED_PRODUCT,
      COMPLETED_TRANSACTION,
    ];

    this.goalEvents = Object.keys(this.getOption('goals'));
    this.goalEvents.forEach((goalEvent) => {
      if (this.SEMANTIC_EVENTS.indexOf(goalEvent) < 0) {
        this.SEMANTIC_EVENTS.push(goalEvent);
      }
    });

    this.pageCalled = false;
    this.dataLayer = [];

    this.addTag({
      type: 'script',
      attr: {
        src: `https://mc.yandex.ru/metrika/${(options.webvisor && options.webvisorVersion === 2) ? 'tag' : 'watch'}.js`,
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
      case VIEWED_PAGE:
        enrichableProps = [
          'user.userId',
        ];
        arrayMerge(enrichableProps, this.getEnrichableUserParamsProps());
        arrayMerge(enrichableProps, this.getEnrichableVisitParamsProps());
        break;
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
      default: {
        const goalEvents = this.getGoalEvents();
        if (goalEvents.indexOf(event.name) >= 0) {
          arrayMerge(enrichableProps, this.getEnrichableUserParamsProps());
          arrayMerge(enrichableProps, this.getEnrichableVisitParamsProps());
        }
      }
    }
    return enrichableProps;
  }

  getEventValidationConfig(event) {
    const viewedPageFields = [];
    arrayMerge(viewedPageFields, this.getEnrichableUserParamsProps());
    arrayMerge(viewedPageFields, this.getEnrichableVisitParamsProps());

    const config = {
      [VIEWED_PAGE]: {
        fields: viewedPageFields,
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: [
          'product.id',
          'product.name',
          'product.category',
          'product.unitSalePrice',
          'product.currency',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.name': {
            warnings: ['required', 'string'],
          },
          'product.category': {
            warnings: ['required', 'array'],
          },
          'product.unitSalePrice': {
            errors: ['numeric'],
            warnings: ['required'],
          },
          'product.currency': {
            warnings: ['required', 'string'],
          },
        },
      },
      [ADDED_PRODUCT]: {
        fields: [
          'product.id',
          'product.name',
          'product.category',
          'product.unitSalePrice',
          'product.currency',
          'quantity',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.name': {
            warnings: ['required', 'string'],
          },
          'product.category': {
            warnings: ['required', 'array'],
          },
          'product.unitSalePrice': {
            errors: ['numeric'],
            warnings: ['required'],
          },
          'product.currency': {
            warnings: ['required', 'string'],
          },
          quantity: {
            warnings: ['required', 'numeric'],
          },
        },
      },
      [REMOVED_PRODUCT]: {
        fields: [
          'product.id',
          'product.name',
          'product.category',
          'quantity',
        ],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.name': {
            warnings: ['required', 'string'],
          },
          'product.category': {
            warnings: ['required', 'array'],
          },
          quantity: {
            warnings: ['required', 'numeric'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.category',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.total',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warning: ['string'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.name': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.category': {
            warnings: ['required', 'array'],
          },
          'transaction.lineItems[].product.unitSalePrice': {
            warnings: ['required', 'numeric'],
          },
          'transaction.total': {
            warnings: ['required', 'numeric'],
          },
        },
      },
    };

    return config[event.name];
  }

  getEnrichableUserParamsProps() {
    return this.enrichableUserParamsProps || [];
  }

  getEnrichableVisitParamsProps() {
    return this.enrichableVisitParamsProps || [];
  }

  getUserParams(event) {
    return extractVariableMappingValues(event, this.getOption('userParamsVars'));
  }

  getVisitParams(event) {
    return extractVariableMappingValues(event, this.getOption('visitParamsVars'));
  }

  yaCounterCall(method, args) {
    if (window[this.yaCallbacksArrayName]) {
      window[this.yaCallbacksArrayName].push(() => {
        this.yaCounter[method].apply(this, args);
      });
    } else {
      this.yaCounter[method].apply(this, args);
    }
  }

  onYaCounterInited(handler) {
    if (this.yaCounter) {
      handler();
    } else {
      const id = this.getOption('counterId');
      bind(document, `yacounter${id}inited`, handler);
    }
  }

  yaCounterCreate(params, userParams) {
    const id = this.getOption('counterId');

    const newCounter = () => {
      this.yaCounter = window[`yaCounter${id}`] = new window.Ya[this.yaCounterClass]({
        id,
        clickmap: this.getOption('clickmap'),
        webvisor: this.getOption('webvisor'),
        trackLinks: this.getOption('trackLinks'),
        trackHash: this.getOption('trackHash'),
        triggerEvent: true,
        ecommerce: this.dataLayerName,
        params,
        userParams,
      });
    };

    if (window[this.yaCallbacksArrayName]) {
      window[this.yaCallbacksArrayName].push(() => {
        newCounter();
      });
    } else {
      newCounter();
    }
  }

  allowNoConflictInitialization() {
    return true;
  }

  initialize() {
    window[this.yaCallbacksArrayName] = window[this.yaCallbacksArrayName] || [];
    this.dataLayer = window[this.dataLayerName] = window[this.dataLayerName] || [];

    this.enrichDigitalData();
  }

  enrichDigitalData() {
    const pushClientId = (clientId) => {
      this.digitalData.changes.push(['user.yandexClientId', clientId, 'DDM Yandex Metrica Integration']);
    };

    const yandexClientId = cookie.get('_ym_uid');
    this.digitalData.user = this.digitalData.user || {};
    if (yandexClientId) {
      pushClientId(yandexClientId);
      this.onEnrich();
    } else {
      this.onYaCounterInited(() => {
        pushClientId(this.yaCounter.getClientID());
        this.onEnrich();
      });
    }
  }

  isLoaded() {
    return !!(window.Ya && (window.Ya.Metrika || window.Ya.Metrika2));
  }

  reset() {
    deleteProperty(window, 'Ya');
    deleteProperty(window, this.yaCallbacksArrayName);
    deleteProperty(window, this.dataLayerName);
    this.pageCalled = false;
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
      if (method) {
        this[method](event);
      }
      this.trackCustomEvent(event);
    }
  }

  onViewedPage(event) {
    const id = this.getOption('counterId');
    if (!id) return;

    const visitParams = cleanObject(this.getVisitParams(event));
    const userParams = cleanObject(this.getUserParams(event));

    if (!this.pageCalled) {
      this.yaCounterCreate(visitParams, userParams);
      this.pageCalled = true;
    } else {
      // ajax pageview
      const page = event.page || {};
      const url = page.url || window.location.href;

      // send hit with visit params
      this.yaCounterCall('hit', [url, {
        referer: page.referrer || document.referrer,
        title: page.title || document.title,
        params: visitParams,
      }]);

      // send user params
      if (size(userParams)) {
        this.yaCounterCall('userParams', [userParams]);
      }
    }

    // send userId
    if (this.getOption('sendUserId')) {
      const userId = getProp(event, 'user.userId');
      if (userId) {
        this.yaCounterCall('setUserID', [userId]);
      }
    }
  }

  onViewedProductDetail(event) {
    const product = event.product;
    if (!getProductId(product) && !product.name) return;
    this.dataLayer.push({
      ecommerce: {
        detail: {
          products: [getProduct(product)],
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
          products: [getProduct(product, quantity)],
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
              quantity,
            },
          ],
        },
      },
    });
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    if (!transaction || !transaction.orderId) return;

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

  trackCustomEvent(event) {
    const goals = this.getOption('goals');
    const goalIdentificator = goals[event.name];
    if (goalIdentificator) {
      const visitParams = cleanObject(this.getVisitParams(event));
      const args = [goalIdentificator];
      if (size(visitParams)) {
        args.push(visitParams);
      }
      this.yaCounterCall('reachGoal', args);
    }
  }
}

export default YandexMetrica;
