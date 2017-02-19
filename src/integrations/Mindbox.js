import Integration from './../Integration.js';
import { getProp } from './../functions/dotProp';
import each from './../functions/each';
import cleanObject from './../function/cleanObject';
import { DIGITALDATA_VAR } from './../variableTypes';
import {
  LOGGED_IN,
  REGISTERED,
  SUBSCRIBED,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  COMPLETED_TRANSACTION,
} from './../events';

const PROVIDER_USER_ID = 'userId';
const PROVIDER_EMAIL = 'email';

class Mindbox extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      projectSystemName: '',
      brandSystemName: '',
      pointOfContactSystemName: '',
      projectDomain: '',
      serviceKey: '',
      operationMapping: {},
      userVars: {},
      userIdProvider: undefined,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.enrichableUserProps = [];

    this.SEMANTIC_EVENTS = [
      LOGGED_IN,
      REGISTERED,
      SUBSCRIBED,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      ADDED_PRODUCT,
      REMOVED_PRODUCT,
      COMPLETED_TRANSACTION,
    ];

    this.addTag({
      type: 'script',
      attr: {
        id: 'directCrm',
        src: `//tracker.directcrm.ru/scripts/v1/tracker.js?v=${Math.random()}`,
      },
    });
  }

  initialize() {
    window.directCrm = window.directCrm || function directCrmStub() {
      window.directCrm.Queue = window.directCrm.Queue || [];
      window.directCrm.Queue.push(arguments);
    };
    this.load(this.onLoad);
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  allowCustomEvents() {
    return true;
  }

  prepareEnrichableTagProps() {
    const userVarsSettings = this.getOption('userVars');
    each(userVarsSettings, (key, variable) => {
      if (variable.type === DIGITALDATA_VAR) {
        this.enrichableUserProps.push(variable.value);
      }
    });
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case REGISTERED:
      enrichableProps = this.getEnrichableUserProps();
      enrichableProps.push('user.userId');
      break;
    case SUBSCRIBED:
      enrichableProps = this.getEnrichableUserProps();
      enrichableProps.push('user.userId');
      break;
    case COMPLETED_TRANSACTION:
      enrichableProps = this.getEnrichableUserProps();
      enrichableProps.push('user.userId');
      enrichableProps.push('transaction');
      break;
    case VIEWED_PRODUCT_DETAIL:
      enrichableProps = ['product'];
      break;
    case VIEWED_PRODUCT_LISTING:
      enrichableProps = ['listing.categoryId'];
      break;
    default:
      // do nothing
    }

    return enrichableProps;
  }

  getEnrichableUserProps() {
    return this.enrichableUserProps;
  }

  isLoaded() {
    return window.mindboxInitialized;
  }

  getOperationName(eventName) {
    return this.getOption('operationMapping')[eventName];
  }

  getIdentificator(event, priorityProvider) {
    let identificator;

    // identify by userId
    if (this.getOption('userIdProvider')) {
      const userId = getProp(event, 'user.userId');
      if (userId) {
        identificator = {
          provider: this.getOption('userIdProvider'),
          identity: userId,
        };
        if (!priorityProvider || priorityProvider === PROVIDER_USER_ID) {
          return identificator;
        }
      }
    }

    // identify by email
    const email = getProp(event, 'user.email');
    if (email) {
      identificator = {
        provider: 'email',
        identity: email,
      };
    }
    if (identificator && (!priorityProvider || priorityProvider === PROVIDER_EMAIL)) {
      return identificator;
    }

    // identify by mobilePhone
    const phone = getProp(event, 'user.phone');
    if (phone) {
      return {
        provider: 'mobilePhone',
        identity: phone,
      };
    }

    return null;
  }

  getUserData(event) {
    const userVars = this.getOption('userVars');
    const userData = {};
    each(userVars, (key, variable) => {
      let userVarValue = getProp(event, variable.value);
      if (userVarValue !== undefined) {
        if (typeof userVarValue === 'boolean') userVarValue = userVarValue.toString();
        userData[key] = userVarValue;
      }
    });
    return userData;
  }

  trackEvent(event) {
    const eventMap = {
      [VIEWED_PRODUCT_DETAIL]: this.onViewedProductDetail,
    };

    // get operation name either from email or from integration settings
    const operation = getProp(event, 'mindbox.operation') || this.getOperationName(event.name);
    if (!operation) return;

    if (eventMap[event.name]) {
      eventMap[event.name](event, operation);
    } else {
      this.onCustomEvent(event, operation);
    }
  }

  onLoggedIn(event, operation) {
    const identificator = this.getIdentificator(event);
    if (!identificator) return;

    window.directCrm('identify', {
      operation,
      identificator,
    });
  }

  onRegistered(event, operation) {
    const identificator = this.getIdentificator(event);
    if (!identificator) return;

    window.directCrm('identify', {
      operation,
      identificator,
      data: cleanObject(this.getUserData(event)),
    });
  }

  onSubscribed(event, operation) {
    const identificator = this.getIdentificator(event, PROVIDER_EMAIL);
    if (!identificator) return;

    window.directCrm('identify', {
      operation,
      identificator,
      data: cleanObject(this.getUserData(event)),
    });
  }

  onViewedProductDetail(event, operation) {
    const productId = getProp(event, 'product.id');
    if (!productId) return;

    window.directCrm('performOperation', {
      operation,
      data: {
        action: { productId },
      },
    });
  }

  onViewedProductListing(event, operation) {
    const productCategoryId = getProp(event, 'listing.categoryId');
    if (!productCategoryId) return;

    window.directCrm('performOperation', {
      operation,
      data: {
        action: { productCategoryId },
      },
    });
  }

  onAddedProduct(event, operation) {
    const productId = getProp(event, 'product.id');
    if (!productId) return;

    window.directCrm('performOperation', {
      operation,
      data: {
        action: cleanObject({
          productId,
          skuId: getProp(event, 'product.skuCode'),
          quantity: getProp(event, 'quantity'),
          price: getProp(event, 'product.unitSalePrice'),
        }),
      },
    });
  }

  onRemovedProduct(event, operation) {
    const productId = getProp(event, 'product.id');
    if (!productId) return;

    window.directCrm('performOperation', {
      operation,
      data: {
        action: cleanObject({
          productId,
          skuId: getProp(event, 'product.skuCode'),
          quantity: getProp(event, 'quantity'),
          price: getProp(event, 'product.unitSalePrice'),
        }),
      },
    });
  }

  onCompletedTransaction(event, operation) {
    const identificator = this.getIdentificator(event);
    if (!identificator) return;

    const orderId = getProp(event, 'transaction.orderId');
    if (!orderId) return;

    const lineItems = getProp(event, 'transaction.lineItems');
    let mindboxItems;
    if (lineItems && lineItems.length) {
      mindboxItems = lineItems.map((lineItem) => {
        return cleanObject({
          productId: getProp(lineItem, 'product.id'),
          skuId: getProp(lineItem, 'product.skuCode'),
          quantity: lineItem.quantity || 1,
          price: getProp(lineItem, 'product.unitSalePrice'),
        });
      });
    }

    window.directCrm('identify', cleanObject({
      operation,
      identificator,
      data: this.getUserData(event),
      order: {
        webSiteId: orderId,
        price: getProp(event, 'transaction.total'),
        deliveryType: getProp(event, 'transaction.shippingMethod'),
        paymentType: getProp(event, 'transaction.paymentMethod'),
      },
      items: mindboxItems,
    }));
  }

  onCustomEvent(event, operation) {
    let identificator;
    let data;
    if (event.user) {
      identificator = this.getIdentificator(event);
      data = this.getUserData(event);
    }
    window.directCrm('performOperation', cleanObject({
      operation,
      identificator,
      data,
    }));
  }
}

export default Mindbox;
