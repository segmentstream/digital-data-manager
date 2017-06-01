import Integration from './../Integration.js';
import { getProp } from './../functions/dotProp';
import each from './../functions/each';
import cleanObject from './../functions/cleanObject';
import { DIGITALDATA_VAR } from './../variableTypes';
import {
  VIEWED_PAGE,
  LOGGED_IN,
  REGISTERED,
  SUBSCRIBED,
  UPDATED_PROFILE_INFO,
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
      operationMapping: {},
      setCartOperation: '',
      userVars: {},
      userIdProvider: undefined,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.prepareEnrichableUserProps();

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      LOGGED_IN,
      REGISTERED,
      SUBSCRIBED,
      UPDATED_PROFILE_INFO,
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      ADDED_PRODUCT,
      REMOVED_PRODUCT,
      COMPLETED_TRANSACTION,
    ];

    this.operationEvents = Object.keys(this.getOption('operationMapping'));
    for (const operationEvent of this.operationEvents) {
      if (this.SEMANTIC_EVENTS.indexOf(operationEvent) < 0) {
        this.SEMANTIC_EVENTS.push(operationEvent);
      }
    }

    this.addTag({
      type: 'script',
      attr: {
        id: 'mindbox',
        src: '//api.mindbox.ru/scripts/v1/tracker.js',
      },
    });
  }

  initialize() {
    window.mindbox = window.mindbox || function mindboxStub() {
      window.mindbox.queue.push(arguments);
    };
    window.mindbox.queue = window.mindbox.queue || [];

    window.mindbox('create', {
      projectSystemName: this.getOption('projectSystemName'),
      brandSystemName: this.getOption('brandSystemName'),
      pointOfContactSystemName: this.getOption('pointOfContactSystemName'),
      projectDomain: this.getOption('projectDomain'),
    });

    this.load(this.onLoad);
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  prepareEnrichableUserProps() {
    this.enrichableUserProps = [];
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
    case VIEWED_PAGE:
      enrichableProps.push('cart');
      break;
    case LOGGED_IN:
      enrichableProps.push('user.userId');
      break;
    case REGISTERED:
    case SUBSCRIBED:
    case UPDATED_PROFILE_INFO:
      enrichableProps = this.getEnrichableUserProps();
      enrichableProps.push('user.userId');
      enrichableProps.push('user.isSubscribed');
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

  getEventValidationConfig(event) {
    let viewedPageFields = [];
    let viewedPageValidations = {};

    const setCartOperation = this.getOption('setCartOperation');
    if (setCartOperation) {
      viewedPageFields = [
        'cart.lineItems[].product.id',
        'cart.lineItems[].product.unitSalePrice',
        'cart.lineItems[].product.skuCode',
        'cart.lineItems[].quantity',
      ];
      viewedPageValidations = {
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
        'cart.lineItems[].product.skuCode': {
          warnings: ['required', 'string'],
        },
      };
    }

    const addRemoveProductFields = [
      'product.id',
      'product.skuCode',
      'product.unitSalePrice',
    ];
    const addRemoveProductValidations = {
      'product.id': {
        errors: ['required'],
        warnings: ['string'],
      },
      'product.skuCode': {
        warnings: ['required', 'string'],
      },
      'product.unitSalePrice': {
        errors: ['required'],
        warnings: ['numeric'],
      },
    };

    const config = {
      [VIEWED_PAGE]: {
        fields: viewedPageFields,
        validations: viewedPageValidations,
      },
      [VIEWED_PRODUCT_DETAIL]: {
        fields: ['product.id'],
        validation: {
          'product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_PRODUCT_LISTING]: {
        fields: ['listing.categoryId'],
        validations: {
          'listing.categoryId': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [ADDED_PRODUCT]: {
        fields: addRemoveProductFields,
        validations: addRemoveProductValidations,
      },
      [REMOVED_PRODUCT]: {
        fields: addRemoveProductFields,
        validations: addRemoveProductValidations,
      },
      [COMPLETED_TRANSACTION]: {
        fields: [
          'transaction.orderId',
          'transaction.total',
          'transaction.shippingMethod',
          'transaction.paymentMethod',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.skuCode',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.lineItems[].quantity',
        ],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric'],
          },
          'transaction.shippingMethod': {
            warnings: ['required', 'string'],
          },
          'transaction.paymentMethod': {
            warnings: ['required', 'string'],
          },
          'transaction.lineItems[].product.id': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.lineItems[].product.skuCode': {
            warnings: ['required', 'string'],
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
      [VIEWED_PAGE]: this.onViewedPage.bind(this),
      [VIEWED_PRODUCT_DETAIL]: this.onViewedProductDetail.bind(this),
      [VIEWED_PRODUCT_LISTING]: this.onViewedProductListing.bind(this),
      [ADDED_PRODUCT]: this.onAddedProduct.bind(this),
      [REMOVED_PRODUCT]: this.onRemovedProduct.bind(this),
      [LOGGED_IN]: this.onLoggedIn.bind(this),
      [REGISTERED]: this.onRegistered.bind(this),
      [SUBSCRIBED]: this.onSubscribed.bind(this),
      [UPDATED_PROFILE_INFO]: this.onUpdatedProfileInfo.bind(this),
      [COMPLETED_TRANSACTION]: this.onCompletedTransaction.bind(this),
    };
    // get operation name either from email or from integration settings
    const operation = getProp(event, 'integrations.mindbox.operation') || this.getOperationName(event.name);

    if (!operation && event.name !== VIEWED_PAGE) return;

    if (eventMap[event.name]) {
      eventMap[event.name](event, operation);
    } else {
      this.onCustomEvent(event, operation);
    }
  }

  setCart(cart, operation) {
    const lineItems = cart.lineItems;
    if (!lineItems || !lineItems.length) {
      return;
    }

    const mindboxItems = lineItems.map((lineItem) => {
      const quantity = lineItem.quantity || 1;
      return cleanObject({
        productId: getProp(lineItem, 'product.id'),
        skuId: getProp(lineItem, 'product.skuCode'),
        count: quantity,
        price: getProp(lineItem, 'product.unitSalePrice') * quantity,
      });
    });
    window.mindbox('performOperation', {
      operation,
      data: {
        action: {
          personalOffers: mindboxItems,
        },
      },
    });
  }

  onViewedPage(event) {
    const setCartOperation = this.getOption('setCartOperation');
    if (setCartOperation && event.cart) {
      this.setCart(event.cart, setCartOperation);
    }
  }

  onLoggedIn(event, operation) {
    const identificator = this.getIdentificator(event);
    if (!identificator) return;

    window.mindbox('identify', {
      operation,
      identificator,
    });
  }

  onRegistered(event, operation) {
    this.onUpdatedProfileInfo(event, operation);
  }

  onUpdatedProfileInfo(event, operation) {
    const identificator = this.getIdentificator(event);
    if (!identificator) return;

    const data = cleanObject(this.getUserData(event));
    if (getProp(event, 'user.isSubscribed')) {
      data.subscriptions = data.subscriptions || [];
      data.subscriptions.push({
        pointOfContact: 'Email',
        isSubscribed: true,
        valueByDefault: true,
      });
    }
    if (getProp(event, 'user.isSubscribedBySms')) {
      data.subscriptions = data.subscriptions || [];
      data.subscriptions.push({
        pointOfContact: 'Sms',
        isSubscribed: true,
        valueByDefault: true,
      });
    }
    window.mindbox('identify', {
      operation,
      identificator,
      data,
    });
  }

  onSubscribed(event, operation) {
    const identificator = this.getIdentificator(event, PROVIDER_EMAIL);
    if (!identificator) return;

    const data = cleanObject(this.getUserData(event));
    data.subscriptions = [
      cleanObject({
        pointOfContact: 'Email',
        topic: event.subscriptionList,
        isSubscribed: true,
        valueByDefault: true,
      }),
    ];

    window.mindbox('identify', {
      operation,
      identificator,
      data,
    });
  }

  onViewedProductDetail(event, operation) {
    const productId = getProp(event, 'product.id');
    if (!productId) return;

    window.mindbox('performOperation', {
      operation,
      data: {
        action: { productId },
      },
    });
  }

  onViewedProductListing(event, operation) {
    const productCategoryId = getProp(event, 'listing.categoryId');
    if (!productCategoryId) return;

    window.mindbox('performOperation', {
      operation,
      data: {
        action: { productCategoryId },
      },
    });
  }

  onAddedProduct(event, operation) {
    const productId = getProp(event, 'product.id');
    if (!productId) return;

    window.mindbox('performOperation', {
      operation,
      data: {
        action: cleanObject({
          productId,
          skuId: getProp(event, 'product.skuCode'),
          price: getProp(event, 'product.unitSalePrice'),
        }),
      },
    });
  }

  onRemovedProduct(event, operation) {
    const productId = getProp(event, 'product.id');
    if (!productId) return;

    window.mindbox('performOperation', {
      operation,
      data: {
        action: cleanObject({
          productId,
          skuId: getProp(event, 'product.skuCode'),
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
    let mindboxItems = [];
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

    const data = this.getUserData(event);
    data.order = {
      webSiteId: orderId,
      price: getProp(event, 'transaction.total'),
      deliveryType: getProp(event, 'transaction.shippingMethod'),
      paymentType: getProp(event, 'transaction.paymentMethod'),
      items: mindboxItems,
    };

    window.mindbox('identify', cleanObject({
      operation,
      identificator,
      data,
    }));
  }

  onCustomEvent(event, operation) {
    let identificator;
    let data;
    if (event.user) {
      identificator = this.getIdentificator(event);
      data = this.getUserData(event);
    }
    window.mindbox('performOperation', cleanObject({
      operation,
      identificator,
      data,
    }));
  }
}

export default Mindbox;
