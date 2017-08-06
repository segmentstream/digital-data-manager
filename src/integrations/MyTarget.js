import Integration from './../Integration';
import deleteProperty from 'driveback-utils/deleteProperty';
import getVarValue from 'driveback-utils/getVarValue';
import { getProp } from 'driveback-utils/dotProp';
import { DIGITALDATA_VAR } from './../variableTypes';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
} from './../events/semanticEvents';

function lineItemsToProductIds(lineItems) {
  const productIds = lineItems.filter(lineItem => !!(lineItem.product.id)).map(lineItem => lineItem.product.id);
  return productIds;
}

class MyTarget extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      counterId: '',
      listVar: {
        type: 'constant',
        value: '1',
      },
      noConflict: false,
      goals: {},
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      VIEWED_CART,
      COMPLETED_TRANSACTION,
    ];
    this.addGoalsToSemanticEvents();

    this.addTag({
      type: 'script',
      attr: {
        id: 'topmailru-code',
        src: '//top-fwz1.mail.ru/js/code.js',
      },
    });
  }

  initialize() {
    window._tmr = window._tmr || [];
  }

  addGoalsToSemanticEvents() {
    const goalEvents = Object.keys(this.getOption('goals'));
    for (const goalEvent of goalEvents) {
      if (this.SEMANTIC_EVENTS.indexOf(goalEvent) < 0) {
        this.SEMANTIC_EVENTS.push(goalEvent);
      }
    }
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          'page.type',
        ];
        break;
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'product',
        ];
        break;
      case VIEWED_CART:
        enrichableProps = [
          'cart',
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

    const listVar = this.getOption('listVar');
    if (listVar && listVar.type === 'digitalData') {
      enrichableProps.push(listVar.value);
    }
    return enrichableProps;
  }

  getEventValidationConfig(event) {
    const config = {
      [VIEWED_PAGE]: {
        fields: ['page.type', 'integrations.mytarget.list'],
        validations: {
          'page.type': {
            errors: ['required', 'string'],
          },
          'integrations.mytarget.list': {
            warnings: ['numeric'],
          },
        },
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: ['product.id', 'product.unitSalePrice', 'integrations.mytarget.list'],
        validations: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'product.unitSalePrice': {
            warings: ['required', 'numeric'],
          },
          'integrations.mytarget.list': {
            warnings: ['numeric'],
          },
        },
      },
      [VIEWED_CART]: {
        fields: ['cart.total', 'cart.lineItems[].product.id', 'integrations.mytarget.list'],
        validations: {
          'cart.total': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'cart.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'integrations.mytarget.list': {
            warnings: ['numeric'],
          },
        },
      },
      [COMPLETED_TRANSACTION]: {
        fields: ['transaction.total', 'transaction.lineItems[].product.id', 'integrations.mytarget.list'],
        validations: {
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'integrations.mytarget.list': {
            warnings: ['numeric'],
          },
        },
      },
    };

    const validationConfig = config[event.name];

    if (validationConfig) {
      // check if listVar presents in event
      const listVar = this.getOption('listVar');
      if (listVar && listVar.type === DIGITALDATA_VAR) {
        validationConfig.fields.push('listVar.value');
        validationConfig.validations[listVar.value] = {
          errors: ['required'],
          warnings: ['numeric'],
        };
      }
    }

    return validationConfig;
  }

  isLoaded() {
    return !!(window._tmr && window._tmr.unload);
  }

  reset() {
    deleteProperty(window, '_tmr');
  }

  getList(event) {
    let list;
    if (event) {
      list = getProp(event, 'integrations.mytarget.list');
    }
    if (list === undefined) {
      const listVar = this.getOption('listVar');
      if (listVar) {
        list = getVarValue(listVar, event);
      }
    }

    return list;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_LISTING]: 'onViewedProductCategory',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [VIEWED_CART]: 'onViewedCart',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
    };

    const method = methods[event.name];
    if (this.getOption('counterId')) {
      if (method && !this.getOption('noConflict')) {
        this[method](event);
      }
      this.trackCustomEvent(event);
    }
  }

  onViewedPage(event) {
    this.pageTracked = false;

    window._tmr.push({
      id: this.getOption('counterId'),
      type: 'pageView',
      start: Date.now(),
    });

    const page = event.page || {};
    if (page.type === 'home') {
      this.onViewedHome(event);
    }

    if (!this.pageTracked) {
      setTimeout(() => {
        if (!this.pageTracked) {
          this.onViewedOtherPage(event);
        }
      }, 100);
    }
  }

  onViewedHome(event) {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'home',
      totalvalue: '',
      list: this.getList(event),
    });
    this.pageTracked = true;
  }

  onViewedProductCategory(event) {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'category',
      totalvalue: '',
      list: this.getList(event),
    });
    this.pageTracked = true;
  }

  onViewedProductDetail(event) {
    const product = event.product;
    window._tmr.push({
      type: 'itemView',
      productid: product.id || '',
      pagetype: 'product',
      totalvalue: product.unitSalePrice || '',
      list: this.getList(event),
    });
    this.pageTracked = true;
  }

  onViewedCart(event) {
    const cart = event.cart;
    let productIds;

    if (cart.lineItems && cart.lineItems.length > 0) {
      productIds = lineItemsToProductIds(cart.lineItems);
    }

    window._tmr.push({
      type: 'itemView',
      productid: productIds || '',
      pagetype: 'cart',
      totalvalue: cart.total || '',
      list: this.getList(event),
    });
    this.pageTracked = true;
  }

  onViewedOtherPage(event) {
    window._tmr.push({
      type: 'itemView',
      productid: '',
      pagetype: 'other',
      totalvalue: '',
      list: this.getList(event),
    });
    this.pageTracked = true;
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    let productIds;

    if (transaction.lineItems && transaction.lineItems.length > 0) {
      productIds = lineItemsToProductIds(transaction.lineItems);
    }
    window._tmr.push({
      type: 'itemView',
      productid: productIds || '',
      pagetype: 'purchase',
      totalvalue: transaction.total || transaction.subtotal || '',
      list: this.getList(event),
    });
    this.pageTracked = true;
  }

  trackCustomEvent(event) {
    const goals = this.getOption('goals');
    const goalIdentificator = goals[event.name];
    if (goalIdentificator) {
      window._tmr.push({
        id: this.getOption('counterId'),
        type: 'reachGoal',
        goal: goalIdentificator,
      });
    }
  }
}

export default MyTarget;
