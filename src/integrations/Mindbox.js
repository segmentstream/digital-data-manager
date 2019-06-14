import { getProp, setProp } from 'driveback-utils/dotProp';
import deleteProperty from 'driveback-utils/deleteProperty';
import cleanObject from 'driveback-utils/cleanObject';
import isEmpty from 'driveback-utils/isEmpty';
import arrayMerge from 'driveback-utils/arrayMerge';
import Integration from '../Integration';
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
  UPDATED_CART,
  COMPLETED_TRANSACTION,
  ALLOWED_PUSH_NOTIFICATIONS,
  BLOCKED_PUSH_NOTIFICATIONS,
} from '../events/semanticEvents';
import {
  getEnrichableVariableMappingProps,
  extractVariableMappingValues,
} from '../IntegrationUtils';

const PUSH_NOTIFICATIONS_EVENTS_CATEGORY = 'Push Notifications';

const PROVIDER_USER_ID = 'userId';
const PROVIDER_EMAIL = 'email';

const V2 = 'V2';
const V3 = 'V3';

const CUSTOMER_FIELDS_AUTHENTICATION_TICKET = 'authenticationTicket';

const DEFAULT_CUSTOMER_FIELDS = [
  CUSTOMER_FIELDS_AUTHENTICATION_TICKET,
  'ids',
  'area',
  'firstName',
  'lastName',
  'middleName',
  'fullName',
  'mobilePhone',
  'email',
  'birthDate',
  'sex',
];

const mapSubscriptionType = (subscriptionType) => {
  const map = {
    email: 'Email',
    sms: 'Sms',
  };
  return map[subscriptionType];
};

class Mindbox extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      apiVersion: V2,
      endpointId: '',
      projectSystemName: '',
      webpush: false,
      firebaseMessagingSenderId: '',
      brandSystemName: '',
      pointOfContactSystemName: '',
      projectDomain: '',
      operationMapping: {},
      setCartOperation: '',
      userVars: {},
      productVars: {},
      orderVars: {},
      userIdProvider: undefined,
      customerIdsMapping: {},
      productIdsMapping: {},
      productSkuIdsMapping: {},
      productCategoryIdsMapping: {},
      areaIdsMapping: {},
      orderIdsMapping: {},
      pushSubscriptionTriggerEvent: 'Agreed to Receive Push Notifications',
    }, options);

    super(digitalData, optionsWithDefaults);

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
      UPDATED_CART,
    ];
    if (this.isWebpush()) {
      this.SEMANTIC_EVENTS.push(this.getOption('pushSubscriptionTriggerEvent'));
    }

    this.prepareEnrichableUserProps();
    this.prepareEnrichableAreaIds();
    this.prepareEnrichableUserIds();
    this.prepareEnrichableCategoryIds();

    this.operationEvents = Object.keys(this.getOption('operationMapping'));
    this.operationEvents.forEach((operationEvent) => {
      if (this.SEMANTIC_EVENTS.indexOf(operationEvent) < 0) {
        this.SEMANTIC_EVENTS.push(operationEvent);
      }
    });

    this.addTag({
      type: 'script',
      attr: {
        id: 'mindbox',
        src: '//api.mindbox.ru/scripts/v1/tracker.js',
      },
    });

    if (this.isWebpush()) {
      this.addTag('webpush', {
        type: 'link',
        attr: {
          rel: 'manifest',
          href: 'https://api.mindbox.ru/assets/manifest.json',
        },
      });
    }
  }

  initialize() {
    window.mindbox = window.mindbox || function mindboxStub() {
      window.mindbox.queue.push(arguments);
    };
    window.mindbox.queue = window.mindbox.queue || [];

    const options = this.getOption('apiVersion') === V3
      ? { endpointId: this.getOption('endpointId') }
      : {
        projectSystemName: this.getOption('projectSystemName'),
        brandSystemName: this.getOption('brandSystemName'),
        pointOfContactSystemName: this.getOption('pointOfContactSystemName'),
        projectDomain: this.getOption('projectDomain'),
      };

    if (this.isWebpush()) {
      this.load('webpush');
      options.firebaseMessagingSenderId = this.getOption('firebaseMessagingSenderId');
    }

    window.mindbox('create', options);

    if (this.isWebpush()) window.mindbox('webpush.create');
  }


  isWebpush() {
    return this.getOption('webpush');
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  prepareEnrichableUserProps() {
    this.enrichableUserProps = getEnrichableVariableMappingProps(this.getOption('userVars'));
  }

  prepareEnrichableAreaIds() {
    this.enrichableAreIds = getEnrichableVariableMappingProps(this.getOption('areaIdsMapping'));
  }

  prepareEnrichableUserIds() {
    this.enrichableUserIds = getEnrichableVariableMappingProps(this.getOption('customerIdsMapping'));
  }

  prepareEnrichableCategoryIds() {
    this.enrichableCategoryIds = getEnrichableVariableMappingProps(this.getOption('productCategoryIdsMapping'));
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          ...this.getEnrichableUserIds(),
          'cart',
        ];
        break;
      case UPDATED_CART:
        enrichableProps = ['cart'];
        break;
      case LOGGED_IN:
      case REGISTERED:
        enrichableProps = [
          ...this.getEnrichableUserIds(),
          ...this.getEnrichableAreaIds(),
        ];
        if (!event.user) {
          arrayMerge(enrichableProps, [
            ...this.getEnrichableUserProps(),
            'user.userId', // might be duplicated
            'user.isSubscribed',
            'user.isSubscribedBySms',
            'user.subscriptions',
          ]);
        }
        break;
      // we should't pass userId for subscriptions
      case SUBSCRIBED:
        enrichableProps = [
          ...this.getEnrichableAreaIds(),
        ];
        if (!event.user) {
          arrayMerge(enrichableProps, [
            ...this.getEnrichableUserProps(),
            'user.isSubscribed',
            'user.isSubscribedBySms',
            'user.subscriptions',
          ]);
        }
        break;
      case UPDATED_PROFILE_INFO:
        if (!event.user) {
          enrichableProps = [
            ...this.getEnrichableUserIds(),
            ...this.getEnrichableAreaIds(),
            ...this.getEnrichableUserProps(),
            'user.userId', // might be duplicated
            'user.isSubscribed',
            'user.isSubscribedBySms',
            'user.subscriptions',
          ];
        }
        break;
      case COMPLETED_TRANSACTION:
        enrichableProps = [
          ...this.getEnrichableUserIds(),
          ...this.getEnrichableAreaIds(),
          ...this.getEnrichableUserProps(),
          'user.userId', // might be duplicated (failing V2 tests)
          'transaction',
        ];
        break;
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = ['product'];
        break;
      case VIEWED_PRODUCT_LISTING:
        enrichableProps = [
          ...this.getEnrichableCategoryIds(),
          'listing.categoryId', // might be duplicated
        ];
        break;
      default:
      // do nothing
    }

    return enrichableProps;
  }

  getEventValidationConfig(event) {
    let viewedPageFields = [];
    let viewedPageValidations = {};

    const updatedCartFields = [
      'cart.lineItems[].product.id',
      'cart.lineItems[].product.unitSalePrice',
      'cart.lineItems[].quantity',
    ];
    const updatedCartValidations = {
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
    };

    const setCartOperation = this.getOption('setCartOperation');
    if (setCartOperation) {
      viewedPageFields = updatedCartFields;
      viewedPageValidations = updatedCartValidations;
    }

    const userFields = [...this.getEnrichableUserProps(), 'user.userId', 'user.isSubscribed'];

    const addRemoveProductFields = [
      'product.id',
      'product.unitSalePrice',
    ];
    const addRemoveProductValidations = {
      'product.id': {
        errors: ['required'],
        warnings: ['string'],
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
      [REGISTERED]: {
        fields: userFields,
      },
      [SUBSCRIBED]: {
        fields: userFields,
      },
      [UPDATED_PROFILE_INFO]: {
        fields: userFields,
      },
      [LOGGED_IN]: {
        fields: userFields,
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
      [UPDATED_CART]: {
        fields: updatedCartFields,
        validations: updatedCartValidations,
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
          ...userFields,
          'transaction.orderId',
          'transaction.total',
          'transaction.shippingMethod',
          'transaction.paymentMethod',
          'transaction.lineItems[].product.id',
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

  getEnrichableUserIds() {
    return this.enrichableUserIds;
  }

  getEnrichableAreaIds() {
    return this.enrichableAreIds;
  }

  getEnrichableCategoryIds() {
    return this.enrichableCategoryIds;
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

  getCustomerData(event) {
    const userVars = this.getOption('userVars');
    const userData = extractVariableMappingValues(event, userVars);
    // authentication should be sent only for profile update
    if (userData[CUSTOMER_FIELDS_AUTHENTICATION_TICKET] && event.name !== UPDATED_PROFILE_INFO) {
      deleteProperty(userData, CUSTOMER_FIELDS_AUTHENTICATION_TICKET);
    }
    if (this.getOption('apiVersion') === V3) {
      const customerIds = this.getCustomerIds(event);
      const area = this.getV3Area(event);
      if (customerIds) userData.ids = customerIds;
      if (area && event.name !== COMPLETED_TRANSACTION) {
        userData.area = area;
      }
      const keys = Object.keys(userData);
      keys.reduce((acc, key) => {
        if (DEFAULT_CUSTOMER_FIELDS.indexOf(key) < 0) {
          setProp(userData, `customFields.${key}`, userData[key]);
          deleteProperty(userData, key);
        }
        return userData;
      }, userData);
    }
    return userData;
  }

  getSubscriptions(event, useDefaultValue) {
    const userSubscriptions = getProp(event, 'user.subscriptions');
    let subscriptions;

    if (userSubscriptions && Array.isArray(userSubscriptions)) { // version 1.1.3 is used
      subscriptions = userSubscriptions.map(subscription => ({
        pointOfContact: mapSubscriptionType(subscription.type),
        topic: subscription.topic,
        isSubscribed: subscription.isSubscribed,
        valueByDefault: (useDefaultValue) ? true : undefined,
      }));
    } else {
      const isSubscribed = getProp(event, 'user.isSubscribed');
      if (isSubscribed !== undefined) {
        subscriptions = subscriptions || [];
        subscriptions.push(cleanObject({
          pointOfContact: 'Email',
          isSubscribed,
          valueByDefault: (useDefaultValue) ? true : undefined,
        }));
      }

      const isSubscribedBySms = getProp(event, 'user.isSubscribedBySms');
      if (isSubscribedBySms !== undefined) {
        subscriptions = subscriptions || [];
        subscriptions.push(cleanObject({
          pointOfContact: 'Sms',
          isSubscribed: isSubscribedBySms,
          valueByDefault: (useDefaultValue) ? true : undefined,
        }));
      }
    }

    return subscriptions;
  }

  getProductCustoms(product) {
    const productVars = this.getOption('productVars');
    const customs = {};
    Object.keys(productVars).forEach((key) => {
      const customVal = getProp(product, productVars[key]);
      if (customVal) customs[key] = customVal;
    });
    return customs;
  }

  getProductIds(product) {
    const mapping = this.getOption('productIdsMapping');
    const productIds = extractVariableMappingValues(product, mapping);
    return (!isEmpty(productIds)) ? productIds : undefined;
  }

  getProductSkuIds(product) {
    const mapping = this.getOption('productSkuIdsMapping');
    const productSkuIds = extractVariableMappingValues(product, mapping);
    return (!isEmpty(productSkuIds)) ? productSkuIds : undefined;
  }

  getProductCategoryIds(event) {
    const mapping = this.getOption('productCategoryIdsMapping');
    const categoryIds = extractVariableMappingValues(event, mapping);
    return (!isEmpty(categoryIds)) ? categoryIds : undefined;
  }

  getAreaIds(event) {
    const mapping = this.getOption('areaIdsMapping');
    const areaIds = extractVariableMappingValues(event, mapping);
    return (!isEmpty(areaIds)) ? areaIds : undefined;
  }

  getOrderIds(event) {
    const mapping = this.getOption('orderIdsMapping');
    const orderIds = extractVariableMappingValues(event, mapping);
    return (!isEmpty(orderIds)) ? orderIds : undefined;
  }

  getCustomerIds(event) {
    const mapping = this.getOption('customerIdsMapping');
    const customerIds = extractVariableMappingValues(event, mapping);
    return (!isEmpty(customerIds)) ? customerIds : undefined;
  }

  getV3Area(event) {
    const areaIds = this.getAreaIds(event);
    if (!areaIds) return undefined;
    return { ids: areaIds };
  }

  getV3Product(product) {
    const skuIds = this.getProductSkuIds(product);
    return {
      ids: this.getProductIds(product),
      sku: (skuIds) ? { ids: skuIds } : undefined,
    };
  }

  getV3ProductList(lineItems) {
    return lineItems.map((lineItem) => {
      const product = this.getV3Product(lineItem.product);
      const count = lineItem.quantity || 1;
      return {
        product,
        count,
        price: lineItem.subtotal || count * getProp(lineItem, 'product.unitSalePrice'),
      };
    });
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
      [UPDATED_CART]: this.onUpdatedCart.bind(this),
      [COMPLETED_TRANSACTION]: this.onCompletedTransaction.bind(this),
    };

    // if event name match pushSubscriptionTriggerEvent
    // show push notifications subscription to user, and proceed
    // event as usial
    const pushSubscriptionTriggerEvent = this.getOption('pushSubscriptionTriggerEvent');
    if (pushSubscriptionTriggerEvent === event.name) {
      this.onPushSubscriptionTriggerEvent(event);
    }

    // get operation name either from email or from integration settings
    const operation = event.operation
      || getProp(event, 'integrations.mindbox.operation')
      || this.getOperationName(event.name);

    if (!operation && event.name !== VIEWED_PAGE) return;

    if (eventMap[event.name]) {
      eventMap[event.name](event, operation);
    } else {
      this.onCustomEvent(event, operation);
    }
  }

  onViewedPage(event) {
    const setCartOperation = this.getOption('setCartOperation');
    if (setCartOperation && event.cart) {
      this.onUpdatedCart(event, setCartOperation);
    }
  }

  onUpdatedCart(event, operation) {
    const cart = event.cart || {};
    const lineItems = cart.lineItems || [];

    if (this.getOption('apiVersion') === V3) {
      const customerIds = this.getCustomerIds(event);
      let customer;
      if (customerIds) {
        customer = { ids: customerIds };
      }
      window.mindbox('async', cleanObject({
        operation,
        data: {
          customer,
          productList: this.getV3ProductList(lineItems),
        },
      }));
    } else {
      window.mindbox('performOperation', {
        operation,
        data: {
          action: {
            personalOffers: lineItems.map((lineItem) => {
              const quantity = lineItem.quantity || 1;
              return {
                productId: getProp(lineItem, 'product.id'),
                count: quantity,
                price: getProp(lineItem, 'product.unitSalePrice') * quantity,
                ...this.getProductCustoms(lineItem.product),
              };
            }),
          },
        },
      });
    }
  }

  onLoggedIn(event, operation) {
    if (this.getOption('apiVersion') === V3) {
      const user = event.user || {};
      const customerIds = this.getCustomerIds(event);
      if (!customerIds) return;
      window.mindbox('async', {
        operation,
        data: {
          customer: cleanObject({
            ids: customerIds,
            email: getProp(user, 'email'),
            mobilePhone: getProp(user, 'phone'),
          }),
        },
      });
    } else {
      const identificator = this.getIdentificator(event);
      if (!identificator) return;
      const data = cleanObject(this.getCustomerData(event));
      window.mindbox('identify', {
        operation,
        identificator,
        data,
      });
    }
  }

  onRegistered(event, operation) {
    this.onUpdatedProfileInfo(event, operation, true);
  }

  onUpdatedProfileInfo(event, operation, useSubscriptionDefaultValue = false) {
    const subscriptions = this.getSubscriptions(event, useSubscriptionDefaultValue);
    if (this.getOption('apiVersion') === V3) {
      const customer = this.getCustomerData(event);
      if (!customer) return;
      if (subscriptions) customer.subscriptions = subscriptions;
      window.mindbox('async', cleanObject({
        operation,
        data: { customer },
      }));
    } else {
      const identificator = this.getIdentificator(event);
      if (!identificator) return;
      const data = this.getCustomerData(event);
      if (subscriptions) data.subscriptions = subscriptions;
      window.mindbox('identify', cleanObject({
        operation,
        identificator,
        data,
      }));
    }
  }

  onSubscribed(event, operation) {
    const user = event.user || {};
    const { email } = user;
    if (!email) return;

    let subscriptions;
    const eventSubscriptions = getProp(event, 'user.subscriptions') || event.subscriptions;
    if (eventSubscriptions) {
      subscriptions = (eventSubscriptions || []).map(subscription => ({
        pointOfContact: mapSubscriptionType(subscription.type),
        topic: subscription.topic,
      }));
    } else {
      subscriptions = [{
        pointOfContact: 'Email',
        topic: event.subscriptionList,
      }];
    }

    if (this.getOption('apiVersion') === V3) {
      const customer = this.getCustomerData(event);
      window.mindbox('async', cleanObject({
        operation,
        data: {
          customer: {
            ...customer,
            subscriptions,
          },
          pointOfContact: getProp(event, 'campaign.name'),
        },
      }));
    } else {
      const identificator = this.getIdentificator(event, PROVIDER_EMAIL);
      if (!identificator) return;
      const data = this.getCustomerData(event);
      data.subscriptions = subscriptions;
      window.mindbox('identify', cleanObject({ operation, identificator, data }));
    }
  }

  onViewedProductDetail(event, operation) {
    const product = getProp(event, 'product') || {};
    if (!product.id) return;

    if (this.getOption('apiVersion') === V3) {
      const customerIds = this.getCustomerIds(event);
      let customer;
      if (customerIds) {
        customer = { ids: customerIds };
      }
      window.mindbox('async', cleanObject({
        operation,
        data: {
          customer,
          product: this.getV3Product(product),
        },
      }));
    } else {
      window.mindbox('performOperation', {
        operation,
        data: {
          action: {
            productId: product.id,
            ...this.getProductCustoms(product),
          },
        },
      });
    }
  }

  onViewedProductListing(event, operation) {
    if (this.getOption('apiVersion') === V3) {
      window.mindbox('async', {
        operation,
        data: {
          productCategory: {
            ids: this.getProductCategoryIds(event),
          },
        },
      });
    } else {
      const productCategoryId = getProp(event, 'listing.categoryId');
      if (!productCategoryId) return;
      window.mindbox('performOperation', {
        operation,
        data: {
          action: { productCategoryId },
        },
      });
    }
  }

  onAddedProduct(event, operation) {
    if (this.getOption('apiVersion') === V3) {
      this.onCustomEvent(event, operation);
    } else {
      const product = getProp(event, 'product') || {};
      if (!product.id) return;
      window.mindbox('performOperation', {
        operation,
        data: {
          action: {
            productId: product.id,
            price: product.unitSalePrice,
            ...this.getProductCustoms(product),
          },
        },
      });
    }
  }

  onRemovedProduct(event, operation) {
    if (this.getOption('apiVersion') === V3) {
      this.onCustomEvent(event, operation);
    } else {
      const product = getProp(event, 'product') || {};
      if (!product.id) return;
      window.mindbox('performOperation', {
        operation,
        data: {
          action: {
            productId: product.id,
            price: product.unitSalePrice,
            ...this.getProductCustoms(product),
          },
        },
      });
    }
  }

  getV3ProductForTransaction(product) {
    const skuIds = this.getProductSkuIds(product);
    return {
      ids: this.getProductIds(product),
      sku: (skuIds) ? { ids: skuIds } : undefined,
    };
  }

  onCompletedTransactionV3(event, operation) {
    const customer = this.getCustomerData(event);

    const lineItems = getProp(event, 'transaction.lineItems');
    let mindboxItems = [];
    if (lineItems && lineItems.length) {
      mindboxItems = lineItems.map(
        (lineItem) => {
          let customs = this.getProductCustoms(lineItem.product);
          customs = customs && Object.keys(customs).length !== 0 ? customs : undefined;

          return cleanObject({
            product: this.getV3ProductForTransaction(lineItem.product),
            quantity: lineItem.quantity || 1,
            basePricePerItem: getProp(lineItem, 'product.unitPrice'),
            customFields: customs,
          });
        },
      );
    }

    const orderVars = this.getOption('orderVars');
    const orderCustomFields = extractVariableMappingValues(event, orderVars);

    const paymentMethod = getProp(event, 'transaction.paymentMethod');
    let payments;
    if (paymentMethod) {
      payments = [{
        type: paymentMethod,
        amount: getProp(event, 'transaction.total'),
      }];
    }

    const order = {
      ids: this.getOrderIds(event),
      totalPrice: getProp(event, 'transaction.total'),
      deliveryCost: getProp(event, 'transaction.shippingCost'),
      lines: mindboxItems,
      payments,
      area: this.getV3Area(event),
      customFields: orderCustomFields,
    };

    window.mindbox('async', cleanObject({
      operation,
      data: {
        customer,
        order,
      },
    }));
  }

  onCompletedTransaction(event, operation) {
    if (this.getOption('apiVersion') === V3) {
      this.onCompletedTransactionV3(event, operation);
      return;
    }
    const identificator = this.getIdentificator(event);
    if (!identificator) return;

    const orderId = getProp(event, 'transaction.orderId');
    if (!orderId) return;

    const lineItems = getProp(event, 'transaction.lineItems');
    let mindboxItems = [];
    if (lineItems && lineItems.length) {
      mindboxItems = lineItems.map(lineItem => cleanObject({
        productId: getProp(lineItem, 'product.id'),
        skuId: getProp(lineItem, 'product.skuCode'),
        quantity: lineItem.quantity || 1,
        price: getProp(lineItem, 'product.unitSalePrice'),
        ...this.getProductCustoms(lineItem.product),
      }));
    }

    const data = this.getCustomerData(event);

    const orderVars = this.getOption('orderVars');
    const orderCustomFields = extractVariableMappingValues(event, orderVars);

    data.order = {
      webSiteId: orderId,
      price: getProp(event, 'transaction.total'),
      deliveryType: getProp(event, 'transaction.shippingMethod'),
      paymentType: getProp(event, 'transaction.paymentMethod'),
      items: mindboxItems,
      ...orderCustomFields,
    };

    window.mindbox('identify', cleanObject({
      operation,
      identificator,
      data,
    }));
  }

  onPushSubscriptionTriggerEvent() {
    if (!this.isWebpush()) return;

    const category = PUSH_NOTIFICATIONS_EVENTS_CATEGORY;
    window.mindbox(
      'webpush.subscribe', {
        getSubscriptionOperation: 'GetWebPushSubscription',
        subscribeOperation: 'SubscribeToWebpush',
        onGranted: () => {
          this.digitalData.events.push({ category, name: ALLOWED_PUSH_NOTIFICATIONS });
        },
        onDenied: () => {
          this.digitalData.events.push({ category, name: BLOCKED_PUSH_NOTIFICATIONS });
        },
      },
    );
  }

  onCustomEvent(event, operation) {
    let identificator;
    let data;
    if (event.user) {
      identificator = this.getIdentificator(event);
      data = this.getCustomerData(event);
    }
    if (this.getOption('apiVersion') === V3) {
      window.mindbox('async', cleanObject({
        operation,
        data,
      }));
    } else {
      window.mindbox('performOperation', cleanObject({
        operation,
        identificator,
        data,
      }));
    }
  }
}

export default Mindbox;
