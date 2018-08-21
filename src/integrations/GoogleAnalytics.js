import deleteProperty from 'driveback-utils/deleteProperty';
import { getProp } from 'driveback-utils/dotProp';
import cleanObject from 'driveback-utils/cleanObject';
import each from 'driveback-utils/each';
import size from 'driveback-utils/size';
import clone from 'driveback-utils/clone';
import cookie from 'js-cookie';
import arrayMerge from 'driveback-utils/arrayMerge';
import Integration from '../Integration';
import transliterate from './utils/transliterate';
import {
  SESSION_STARTED,
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_LISTING,
  SEARCHED_PRODUCTS,
  VIEWED_CART,
  COMPLETED_TRANSACTION,
  REFUNDED_TRANSACTION,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_CHECKOUT_STEP,
  VIEWED_PRODUCT,
  CLICKED_PRODUCT,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CAMPAIGN,
  CLICKED_CAMPAIGN,
  EXCEPTION,
} from '../events/semanticEvents';
import {
  EVENT_VAR,
  DIGITALDATA_VAR,
  PRODUCT_VAR,
} from '../variableTypes';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  COMPLETED_TRANSACTION,
];

const EC_SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
  REFUNDED_TRANSACTION,
  VIEWED_CHECKOUT_STEP,
  COMPLETED_CHECKOUT_STEP,
  VIEWED_PRODUCT,
  CLICKED_PRODUCT,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CAMPAIGN,
  CLICKED_CAMPAIGN,
  EXCEPTION,
];

function getTransactionVoucher(transaction) {
  return Array.isArray(transaction.vouchers) ? transaction.vouchers[0] : transaction.voucher;
}

function getCheckoutOptions(event, checkoutOptions) {
  const optionNames = checkoutOptions;
  const options = [];
  optionNames.forEach((optionName) => {
    const optionValue = getProp(event, optionName);
    if (optionValue) {
      options.push(optionValue);
    }
  });
  return options.join(', ');
}

class GoogleAnalytics extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      trackingId: '',
      alternativeTrackingId: '',
      optimizeContainerId: '',
      enhancedLinkAttribution: false,
      enhancedEcommerce: false,
      sendUserId: false,
      anonymizeIp: false,
      domain: 'auto',
      siteSpeedSampleRate: 1,
      defaultCurrency: 'USD',
      fields: {},
      metrics: {},
      dimensions: {},
      contentGroupings: {}, // legacy version
      contentGroups: {},
      productDimensions: {},
      productMetrics: {},
      namespace: undefined,
      alternativeNamespace: undefined,
      noConflict: false,
      useProxy: false,
      checkoutOptions: ['option', 'paymentMethod', 'shippingMethod'],
      transliteration: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://www.google-analytics.com/analytics.js',
      },
    });

    this.addTag('proxy', {
      type: 'script',
      attr: {
        src: 'https://google-analytics.ddmanager.ru/proxy/analytics.js',
      },
    });
  }

  getSemanticEvents() {
    if (this.getOption('enhancedEcommerce')) {
      return EC_SEMANTIC_EVENTS;
    }
    return SEMANTIC_EVENTS;
  }

  getIgnoredEvents() {
    return [SESSION_STARTED, VIEWED_PRODUCT_LISTING, SEARCHED_PRODUCTS, VIEWED_CART];
  }

  allowCustomEvents() {
    return true;
  }

  allowNoConflictInitialization() {
    return true;
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case VIEWED_PAGE:
        enrichableProps = [
          'user.userId',
          'website.currency',
          'page',
        ];
        break;
      case VIEWED_PRODUCT_DETAIL:
        enrichableProps = [
          'product',
        ];
        break;
      case VIEWED_CHECKOUT_STEP:
        enrichableProps = [
          'cart',
          'transaction',
        ];
        break;
      case COMPLETED_TRANSACTION:
      case REFUNDED_TRANSACTION:
        enrichableProps = [
          'transaction',
        ];
        break;
      default:
      // do nothing
    }
    const enrichableDimensionsProps = this.getEnrichableDimensionsProps();
    enrichableDimensionsProps.forEach((enrichableDimensionsProp) => {
      enrichableProps.push(enrichableDimensionsProp);
    });
    return enrichableProps;
  }

  getEventValidationConfig(event) {
    const productFields = [
      'product.id',
      'product.name',
      'product.category',
      'product.unitSalePrice',
      'product.manufacturer',
      'product.variation',
      'product.voucher',
      'product.currency',
    ];
    const productValidations = {
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
        errors: ['required'],
        warnings: ['numeric'],
      },
      'product.manufacturer': {
        warnings: ['string'],
      },
      'product.variant': {
        warnings: ['string'],
      },
      'product.currency': {
        warnings: ['required', 'string'],
      },
    };
    const addProductFields = () => productFields.concat('quantity');

    const listItemFields = () => productFields.map(productField => ['listItem', productField].join('.'))
      .concat(['listItem.listName', 'listItem.position']);

    const listItemsFields = () => productFields.map(productField => ['listItems[]', productField].join('.'))
      .concat(['listItems[].listName', 'listItems[].position']);

    const cartLineItemsFields = () => productFields.map(productField => ['cart.lineItems[]', productField].join('.'))
      .concat(['cart.lineItems[].quantity']);

    const transactionLineItemsFields = () => productFields
      .map(productField => ['transaction.lineItems[]', productField].join('.'))
      .concat(['transaction.lineItems[].quantity']);

    const viewedCheckoutStepFields = () => {
      const fields = (event.transaction) ? transactionLineItemsFields() : cartLineItemsFields();
      arrayMerge(fields, ['step', 'option']);
      return fields;
    };

    const addProductValidations = () => Object.assign(productValidations, {
      quantity: {
        warnings: ['required', 'numeric'],
      },
    });

    const listItemValidations = () => Object.keys(productValidations)
      .reduce((validations, productField) => {
        const key = ['listItem', productField].join('.');
        validations[key] = productValidations[productField];
        return validations;
      }, {
        'listItem.listName': {
          warnings: ['string'],
        },
        'listItem.position': {
          warnings: ['numeric'],
        },
      });

    const listItemsValidations = () => Object.keys(productValidations)
      .reduce((validations, productField) => {
        const key = ['listItems[]', productField].join('.');
        validations[key] = productValidations[productField];
        return validations;
      }, {
        'listItems[].listName': {
          warnings: ['string'],
        },
        'listItems[].position': {
          warnings: ['numeric'],
        },
      });

    const cartLineItemsValidations = () => Object.keys(productValidations)
      .reduce((validations, productField) => {
        const key = ['cart.lineItems[]', productField].join('.');
        validations[key] = productValidations[productField];
        return validations;
      }, {
        'cart.lineItems[].quantity': {
          warnings: ['required', 'numeric'],
        },
      });

    const transactionLineItemsValidations = () => Object.keys(productValidations)
      .reduce((validations, productField) => {
        const key = ['transaction.lineItems[]', productField].join('.');
        validations[key] = productValidations[productField];
        return validations;
      }, {
        'transaction.lineItems[].quantity': {
          warnings: ['required', 'numeric'],
        },
      });

    const viewedCheckoutStepValidations = () => {
      const validations = (event.transaction) ? transactionLineItemsValidations() : cartLineItemsValidations();
      return Object.assign(validations, {
        step: {
          errors: ['required'],
          warnings: ['numeric'],
        },
      });
    };

    const campaignFields = [
      'campaign.id',
      'campaign.name',
      'campaign.design',
      'campaign.position',
    ];
    const campaignsFields = [
      'campaigns[].id',
      'campaigns[].name',
      'campaigns[].design',
      'campaigns[].position',
    ];
    const campaignValidations = {
      'campaign.id': {
        errors: ['required'],
        warnings: ['string'],
      },
      'campaign.name': {
        warnings: ['required', 'string'],
      },
      'campaign.design': {
        warnings: ['string'],
      },
      'campaign.position': {
        warnings: ['required', 'string'],
      },
    };
    const campaignsValidations = {
      'campaigns[].id': {
        errors: ['required'],
        warnings: ['string'],
      },
      'campaigns[].name': {
        warnings: ['required', 'string'],
      },
      'campaigns[].design': {
        warnings: ['string'],
      },
      'campaigns[].position': {
        warnings: ['required', 'string'],
      },
    };
    const pageValidations = {
      'page.url': {
        warnings: ['string'],
      },
      'page.path': {
        warnings: ['string'],
      },
      'page.queryString': {
        warnings: ['string'],
      },
      'page.name': {
        warnings: ['string'],
      },
      'page.title': {
        warnings: ['string'],
      },
    };

    if (!this.pageCalled) {
      pageValidations['page.url'].warnings.push('required');
    }

    const config = {
      [VIEWED_PAGE]: () => ({
        fields: ['page.url', 'page.path', 'page.queryString', 'page.name', 'page.title'],
        validations: pageValidations,
      }),
      [VIEWED_PRODUCT_DETAIL]: () => ({
        fields: productFields,
        validations: productValidations,
      }),
      [ADDED_PRODUCT]: () => ({
        fields: addProductFields(),
        validations: addProductValidations(),
      }),
      [REMOVED_PRODUCT]: () => ({
        fields: productFields,
        validations: productValidations,
      }),
      [CLICKED_PRODUCT]: () => ({
        fields: listItemFields(),
        validations: listItemValidations(),
      }),
      [VIEWED_PRODUCT]: () => ({
        fields: event.listItem ? listItemFields() : listItemsFields(),
        validations: event.listItem ? listItemValidations() : listItemsValidations(),
      }),
      [CLICKED_CAMPAIGN]: () => ({
        fields: campaignFields,
        validations: campaignValidations,
      }),
      [VIEWED_CAMPAIGN]: () => ({
        fields: event.campaign ? campaignFields : campaignsFields,
        validations: event.campaign ? campaignValidations : campaignsValidations,
      }),
      [VIEWED_CHECKOUT_STEP]: () => ({
        fields: viewedCheckoutStepFields(),
        validations: viewedCheckoutStepValidations(),
      }),
      [COMPLETED_CHECKOUT_STEP]: () => ({
        fields: ['step', 'option'],
        validations: {
          step: {
            errors: ['required'],
            warnings: ['numeric'],
          },
          option: {
            warnings: ['required', 'string'],
          },
        },
      }),
      [COMPLETED_TRANSACTION]: () => ({
        fields: [
          'transaction.orderId',
          'transaction.lineItems[].product.id',
          'transaction.lineItems[].product.name',
          'transaction.lineItems[].product.category',
          'transaction.lineItems[].product.unitSalePrice',
          'transaction.total',
          'transaction.affiliation',
          'transaction.tax',
          'transaction.shippingCost',
          'transaction.vouchers',
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
          'transaction.currency': {
            warnings: ['required', 'string'],
          },
          'transaction.vouchers': {
            warnings: ['array'],
          },
          'transaction.tax': {
            warnings: ['numeric'],
          },
        },
      }),
    };

    let validationConfig = config[event.name];
    if (!validationConfig) {
      validationConfig = {
        fields: ['label', 'action', 'category', 'value', 'nonInteraction'],
        validations: {
          label: {
            warnings: ['string'],
          },
          action: {
            warnings: ['string'],
          },
          category: {
            warnings: ['string'],
          },
          value: {
            warnings: ['numeric'],
          },
          nonInteraction: {
            warnings: ['boolean'],
          },
        },
      };
    } else {
      validationConfig = validationConfig();
    }

    arrayMerge(validationConfig.fields, this.getAllDimensionsProps());

    return validationConfig;
  }

  initialize(version) {
    this.initVersion = version || this.initVersion; // for unit tests

    // support of legacy version
    if (!this.initVersion && !this.getOption('namespace') && this.getOption('namespace') !== false) {
      this.setOption('namespace', 'ddl');
    }

    this.prepareCustomDimensions();

    if (this.getOption('trackingId')) {
      this.pageCalled = false;

      // setup the tracker globals
      window.GoogleAnalyticsObject = 'ga';
      window.ga = window.ga || function gaPlaceholder() {
        window.ga.q = window.ga.q || [];
        window.ga.q.push(arguments);
      };
      window.ga.l = new Date().getTime();

      if (window.location.hostname === 'localhost') {
        this.setOption('domain', 'none');
      }

      this.initializeTracker(this.getOption('trackingId'), this.getOption('namespace'));
      if (this.getOption('alternativeTrackingId') && this.getOption('alternativeNamespace')) {
        this.initializeTracker(this.getOption('alternativeTrackingId'), this.getOption('alternativeNamespace'));
      }

      // https://support.google.com/analytics/answer/2558867?hl=en
      if (this.getOption('enhancedLinkAttribution')) {
        this.ga(['require', 'linkid', 'linkid.js'], this.getOption('noConflict'));
      }

      if (this.getOption('optimizeContainerId')) {
        this.ga(['require', this.getOption('optimizeContainerId')], this.getOption('noConflict'));
      }

      if (this.getOption('enhancedEcommerce')) {
        this.loadEnhancedEcommerce();
      }

      // anonymize after initializing, otherwise a warning is shown
      // in google analytics debugger
      if (this.getOption('anonymizeIp')) this.ga(['set', 'anonymizeIp', true], this.getOption('noConflict'));

      // send client id
      const clientIdCustomDimension = this.getOption('clientIdCustomDimension');
      if (clientIdCustomDimension) {
        this.ga([(tracker) => {
          const clientId = tracker.get('clientId');
          tracker.set(clientIdCustomDimension, clientId);
        }]);
      }
    }

    this.enrichDigitalData();
  }

  prepareCustomDimensions() {
    this.enrichableDimensionsProps = [];
    this.allDimensionsProps = [];
    this.productLevelDimensions = {};
    this.hitLevelDimensions = {};

    let settings = Object.assign(
      this.getOption('metrics'),
      this.getOption('dimensions'),
      this.getOption('contentGroups'),
      this.getOption('fields'),
    );

    if (!this.initVersion) {
      settings = Object.assign(settings, this.getOption('contentGroupings'));
      each(settings, (key, value) => {
        this.enrichableDimensionsProps.push(value);
        this.hitLevelDimensions[key] = value;
      });
      const productSettings = Object.assign(
        this.getOption('productMetrics'),
        this.getOption('productDimensions'),
      );
      each(productSettings, (key, value) => {
        this.productLevelDimensions[key] = value;
      });
    } else {
      each(settings, (key, variable) => {
        if (variable.type === PRODUCT_VAR) {
          this.productLevelDimensions[key] = variable.value;
        } else if (variable.type === DIGITALDATA_VAR) {
          this.enrichableDimensionsProps.push(variable.value);
          this.allDimensionsProps.push(variable.value);
          this.hitLevelDimensions[key] = variable.value;
        } else if (variable.type === EVENT_VAR) {
          this.allDimensionsProps.push(variable.value);
          this.hitLevelDimensions[key] = variable.value;
        }
      });
    }
  }

  getEnrichableDimensionsProps() {
    return this.enrichableDimensionsProps || [];
  }

  getAllDimensionsProps() {
    return this.allDimensionsProps || [];
  }

  getProductLevelDimensions() {
    return this.productLevelDimensions || [];
  }

  getHitLevelDimensions() {
    return this.hitLevelDimensions || [];
  }

  initializeTracker(trackingId, namespace) {
    window.ga('create', trackingId, cleanObject({
      // Fall back on default to protect against empty string
      cookieDomain: this.getOption('domain'),
      siteSpeedSampleRate: this.getOption('siteSpeedSampleRate'),
      allowLinker: true,
      name: namespace || undefined,
    }));
  }

  hasAlternativeTracker() {
    return (this.getOption('alternativeTrackingId') && this.getOption('alternativeNamespace'));
  }

  gaWithNamespace(namespace, args) {
    const command = args.slice(0).shift();
    const params = args.slice(1);
    if (command) {
      const namespacedCommand = [namespace, command].join('.');
      const namespacedParams = [namespacedCommand, ...params];
      window.ga(...namespacedParams);
    }
  }

  gaAlternative(args) {
    this.gaWithNamespace(this.getOption('alternativeNamespace'), args);
  }

  ga(args, noConflict = false) {
    if (!noConflict) {
      if (!this.getOption('namespace')) {
        window.ga(...args);
      } else {
        this.gaWithNamespace(this.getOption('namespace'), args);
      }
    }

    if (this.hasAlternativeTracker()) {
      this.gaAlternative(args);
    }
  }

  isLoaded() {
    return !!window.gaplugins;
  }

  reset() {
    deleteProperty(window, 'GoogleAnalyticsObject');
    deleteProperty(window, 'ga');
    deleteProperty(window, 'gaplugins');
    this.pageCalled = false;
  }

  getCustomDimensions(source, productScope = false) {
    let settings;
    if (productScope) {
      settings = this.getProductLevelDimensions();
    } else {
      settings = this.getHitLevelDimensions();
    }
    const custom = {};
    each(settings, (key, value) => {
      let dimensionVal = getProp(source, value);
      if (dimensionVal !== undefined) {
        if (typeof dimensionVal === 'boolean') dimensionVal = dimensionVal.toString();
        custom[key] = dimensionVal;
      }
    });

    return custom;
  }

  loadEnhancedEcommerce() {
    let noConflict = this.getOption('noConflict');
    if (this.getOption('namespace')) {
      noConflict = false; // always load for custom namespace
    }
    this.ga(['require', 'ec'], noConflict);
    this.enhancedEcommerceLoaded = true;
  }

  pushEnhancedEcommerce(event, noConflict) {
    this.setEventCustomDimensions(event, noConflict);
    if (this.getPageview()) {
      this.flushPageview();
    } else {
      // Send a custom non-interaction event to ensure all EE data is pushed.
      // Without doing this we'd need to require page display
      // after setting EE data.
      const cleanedArgs = [];
      const args = [
        'send',
        'event',
        event.category || 'Ecommerce',
        event.action || event.name || 'not defined',
        event.label,
        {
          nonInteraction: !!event.nonInteraction,
        },
      ];

      args.forEach((arg) => {
        if (arg !== undefined) {
          cleanedArgs.push(arg);
        }
      });

      this.ga(cleanedArgs, noConflict);
    }
  }

  getGaClientId() {
    const gaCookie = cookie.get('_ga');
    if (gaCookie) {
      const match = gaCookie.match(/(\d+\.\d+)$/);
      return (match) ? match[1] : null;
    }
    return undefined;
  }

  enrichDigitalData() {
    const googleClientId = this.getGaClientId();
    if (googleClientId) {
      this.digitalData.changes.push([
        'user.googleClientId',
        googleClientId,
        `${this.getName()} Integration`,
      ]);
    }

    // TODO: remove asynс enrichment
    if (!googleClientId) {
      window.ga((tracker) => {
        const trackerName = this.getOption('namespace');
        tracker = tracker || window.ga.getByName(trackerName);
        if (tracker) {
          this.digitalData.changes.push([
            'user.googleClientId',
            tracker.get('clientId'),
            `${this.getName()} Integration`,
          ]);
        }
      });
    }

    this.onEnrich();
  }

  isPageviewDelayed(pageType) {
    if (!this.getOption('enhancedEcommerce')) {
      return false;
    }
    const map = {
      product: VIEWED_PRODUCT_DETAIL,
      cart: [VIEWED_CHECKOUT_STEP],
      confirmation: COMPLETED_TRANSACTION,
      checkout: VIEWED_CHECKOUT_STEP,
    };

    let eventNames = map[pageType];
    if (!eventNames) {
      return false;
    }

    if (!Array.isArray(eventNames)) {
      eventNames = [eventNames];
    }

    return true;
  }

  getProductCategory(product) {
    let { category } = product;
    if (Array.isArray(category)) {
      category = category.join('/');
    } else if (category && product.subcategory) {
      category = `${category}/${product.subcategory}`;
    }
    return this.transliterate(category);
  }

  transliterate(str) {
    if (!this.getOption('transliterate')) return str;
    if (!this.transliterateObj) {
      this.transliterateObj = transliterate();
    }
    return this.transliterateObj.transform(str);
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage(event);
    } else if (event.name === EXCEPTION) {
      this.onException(event);
    } else if (this.getOption('enhancedEcommerce')) {
      const methods = {
        [VIEWED_PRODUCT]: this.onViewedProduct,
        [CLICKED_PRODUCT]: this.onClickedProduct,
        [VIEWED_PRODUCT_DETAIL]: this.onViewedProductDetail,
        [ADDED_PRODUCT]: this.onAddedProduct,
        [REMOVED_PRODUCT]: this.onRemovedProduct,
        [COMPLETED_TRANSACTION]: this.onCompletedTransactionEnhanced,
        [REFUNDED_TRANSACTION]: this.onRefundedTransaction,
        [VIEWED_CAMPAIGN]: this.onViewedCampaign,
        [CLICKED_CAMPAIGN]: this.onClickedCampaign,
        [VIEWED_CHECKOUT_STEP]: this.onViewedCheckoutStep,
        [COMPLETED_CHECKOUT_STEP]: this.onCompletedCheckoutStep,
      };
      const method = methods[event.name];
      if (method) {
        method.bind(this)(event);
      } else {
        this.onCustomEvent(event);
      }
    } else if (event.name === COMPLETED_TRANSACTION) {
      this.onCompletedTransaction(event);
    } else if ([
      VIEWED_PRODUCT_DETAIL,
      VIEWED_PRODUCT_LISTING,
      SEARCHED_PRODUCTS,
      COMPLETED_TRANSACTION,
      VIEWED_PRODUCT,
      CLICKED_PRODUCT,
      ADDED_PRODUCT,
      REMOVED_PRODUCT,
      VIEWED_CHECKOUT_STEP,
      COMPLETED_CHECKOUT_STEP,
    ].indexOf(event.name) < 0) {
      this.onCustomEvent(event);
    }
  }

  setPageview(pageview) {
    this.pageview = pageview;
  }

  getPageview() {
    return this.pageview;
  }

  flushPageview() {
    this.ga(['send', 'pageview', this.pageview], this.getOption('noConflict'));
    this.pageCalled = true;
    this.pageview = null;
  }

  onViewedPage(event) {
    if (!this.pageCalled && this.getOption('useProxy') === true) {
      this.load('proxy');
    }

    // send global id
    const { page } = event;
    const pageview = {};
    const pageUrl = page.url;
    let pagePath = page.path;

    if (page.queryString) {
      pagePath += page.queryString;
    }
    const pageTitle = this.transliterate(page.name || page.title);
    pageview.page = pagePath;
    pageview.title = pageTitle;
    pageview.location = pageUrl;

    if (this.pageCalled) {
      deleteProperty(pageview, 'location');
    }
    this.setPageview(pageview);
    // set
    if (this.getOption('sendUserId')) {
      const userId = getProp(event, 'user.userId');
      if (userId) {
        this.ga(['set', 'userId', userId], this.getOption('noConflict'));
      }
    }

    // set
    if (this.getOption('enhancedEcommerce')) {
      const currency = getProp(event, 'website.currency') || this.getOption('defaultCurrency');
      this.ga(['set', '&cu', currency], this.getOption('noConflict'));
    }

    // set
    this.ga(['set', {
      page: pagePath,
      title: pageTitle,
    }], this.getOption('noConflict'));

    // send
    this.setEventCustomDimensions(event, this.getOption('noConflict'));

    if (!this.isPageviewDelayed(page.type)) {
      this.flushPageview();
    } else {
      setTimeout(() => {
        if (this.getPageview()) {
          this.flushPageview(); // flush anyway in 100ms
        }
      }, 100);
    }
  }

  onViewedProduct(event) {
    event.nonInteraction = true;
    let { listItems } = event;
    if ((!listItems || !Array.isArray(listItems)) && event.listItem) {
      listItems = [event.listItem];
    }

    listItems.forEach((listItem) => {
      const { product } = listItem;
      if (!product.id && !product.skuCode && !product.name) {
        return;
      }

      const custom = this.getCustomDimensions(product, true);
      const gaProduct = Object.assign({
        id: product.id || product.skuCode,
        name: this.transliterate(product.name),
        list: this.transliterate(listItem.listName),
        category: this.getProductCategory(product),
        brand: this.transliterate(product.brand || product.manufacturer),
        price: product.unitSalePrice || product.unitPrice,
        currency: product.currency || this.getOption('defaultCurrency'),
        variant: this.transliterate(product.variant),
        position: listItem.position,
      }, custom);
      this.ga(['ec:addImpression', gaProduct], this.getOption('noConflict'));
    });

    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onClickedProduct(event) {
    if (!event.listItem) {
      return;
    }
    this.enhancedEcommerceProductAction(event, 'click', {
      list: event.listItem.listName,
    });
    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onViewedProductDetail(event) {
    event.nonInteraction = true;
    this.enhancedEcommerceProductAction(event, 'detail');
    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onAddedProduct(event) {
    this.enhancedEcommerceProductAction(event, 'add');
    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onRemovedProduct(event) {
    this.enhancedEcommerceProductAction(event, 'remove');
    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onCompletedTransaction(event) {
    const { transaction } = event;
    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    // require ecommerce
    if (!this.ecommerce) {
      this.ga(['require', 'ecommerce'], this.getOption('noConflict'));
      this.ecommerce = true;
    }

    // add transaction
    this.ga(['ecommerce:addTransaction', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      shipping: transaction.shippingCost,
      tax: transaction.tax,
      revenue: transaction.total || transaction.subtotal || 0,
      currency: transaction.currency,
    }], this.getOption('noConflict'));

    // add products
    each(transaction.lineItems, (key, lineItem) => {
      const { product } = lineItem;
      if (product) {
        this.ga(['ecommerce:addItem', {
          id: product.id,
          category: this.getProductCategory(product),
          quantity: lineItem.quantity,
          price: product.unitSalePrice || product.unitPrice,
          name: this.transliterate(product.name),
          sku: product.skuCode,
          currency: product.currency || transaction.currency,
        }], this.getOption('noConflict'));
      }
    });

    // send
    this.ga(['ecommerce:send'], this.getOption('noConflict'));
  }

  onCompletedTransactionEnhanced(event) {
    const { transaction } = event;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    each(transaction.lineItems, (key, lineItem) => {
      const { product } = lineItem;
      if (product) {
        product.currency = product.currency || transaction.currency || this.getOption('defaultCurrency');
        this.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    const voucher = getTransactionVoucher(transaction);
    this.ga(['ec:setAction', 'purchase', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      revenue: transaction.total || transaction.subtotal || 0,
      tax: transaction.tax,
      shipping: transaction.shippingCost,
      coupon: voucher,
    }], this.getOption('noConflict'));

    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onRefundedTransaction(event) {
    const { transaction } = event;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    each(transaction.lineItems, (key, lineItem) => {
      const { product } = lineItem;
      if (product) {
        product.currency = product.currency || transaction.currency || this.getOption('defaultCurrency');
        this.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga(['ec:setAction', 'refund', {
      id: transaction.orderId,
    }], this.getOption('noConflict'));

    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onViewedCampaign(event) {
    event.nonInteraction = true;

    let { campaigns } = event;
    if ((!campaigns || !Array.isArray(campaigns)) && event.campaign) {
      campaigns = [event.campaign];
    }

    campaigns.forEach((campaign) => {
      if (!campaign || !campaign.id) {
        return;
      }

      this.ga(['ec:addPromo', {
        id: this.transliterate(campaign.id),
        name: this.transliterate(campaign.name),
        creative: this.transliterate(campaign.design || campaign.creative),
        position: this.transliterate(campaign.position),
      }]);
    });

    this.pushEnhancedEcommerce(event); // ignore noConflict
  }

  onClickedCampaign(event) {
    const { campaign } = event;

    if (!campaign || !campaign.id) return;

    this.ga(['ec:addPromo', {
      id: campaign.id,
      name: this.transliterate(campaign.name),
      creative: this.transliterate(campaign.design || campaign.creative),
      position: this.transliterate(campaign.position),
    }]);
    this.ga(['ec:setAction', 'promo_click', {}]);
    this.pushEnhancedEcommerce(event); // ignore noConflict
  }

  onViewedCheckoutStep(event) {
    event.nonInteraction = true;

    const cartOrTransaction = getProp(event, 'cart') || getProp(event, 'transaction');

    each(cartOrTransaction.lineItems, (key, lineItem) => {
      const { product } = lineItem;
      if (product) {
        product.currency = product.currency || cartOrTransaction.currency || this.getOption('defaultCurrency');
        this.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga(['ec:setAction', 'checkout', {
      step: event.step || 1,
      option: getCheckoutOptions(event, this.getOption('checkoutOptions')) || undefined,
    }], this.getOption('noConflict'));

    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onCompletedCheckoutStep(event) {
    const options = getCheckoutOptions(event, this.getOption('checkoutOptions'));
    if (!event.step || !options) {
      return;
    }

    this.ga(['ec:setAction', 'checkout_option', {
      step: event.step,
      option: options,
    }], this.getOption('noConflict'));

    this.pushEnhancedEcommerce(event, this.getOption('noConflict'));
  }

  onCustomEvent(event) {
    const payload = {
      eventAction: event.action || event.name || 'event',
      eventCategory: event.category || 'All',
      eventLabel: event.label,
      eventValue: Math.round(event.value) || 0,
      nonInteraction: !!event.nonInteraction,
    };

    this.setEventCustomDimensions(event);
    this.ga(['send', 'event', payload]);
  }

  onException(event) {
    if (event.exception && event.exception.message) {
      this.ga(['send', 'exception', {
        exDescription: event.exception.description || event.exception.message,
        exFatal: event.exception.isFatal || false,
        nonInteraction: true,
      }]);
    }
  }

  setEventCustomDimensions(event, noConflict) {
    // custom dimensions & metrics
    const source = clone(event);
    ['name', 'category', 'label', 'nonInteraction', 'value'].forEach((prop) => {
      deleteProperty(source, prop);
    });
    const custom = this.getCustomDimensions(source);
    if (size(custom)) {
      this.ga(['set', custom], noConflict);
    }
  }

  enhancedEcommerceTrackProduct(product, quantity, position) {
    if (!product) return;
    const custom = this.getCustomDimensions(product, true);
    const gaProduct = Object.assign({
      id: product.id || product.skuCode,
      name: this.transliterate(product.name),
      category: this.getProductCategory(product),
      price: product.unitSalePrice || product.unitPrice,
      brand: this.transliterate(product.brand || product.manufacturer),
      variant: this.transliterate(product.variant),
      currency: product.currency,
    }, custom);
    if (quantity) gaProduct.quantity = quantity;
    if (position) gaProduct.position = position;
    // append coupon if it set
    // https://developers.google.com/analytics/devguides/collection
    //  /analyticsjs/enhanced-ecommerce#measuring-transactions
    if (product.voucher) gaProduct.coupon = product.voucher;
    this.ga(['ec:addProduct', gaProduct], this.getOption('noConflict'));
  }

  enhancedEcommerceProductAction(event, action, data) {
    const position = (event.listItem) ? event.listItem.position : undefined;
    const product = (event.listItem) ? event.listItem.product : event.product;

    if (!product || !product.id) return;

    this.enhancedEcommerceTrackProduct(product, event.quantity, position);
    this.ga(['ec:setAction', action, data || {}], this.getOption('noConflict'));
  }
}

export default GoogleAnalytics;
