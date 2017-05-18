import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import { setProp, getProp } from './../functions/dotProp';
import cleanObject from './../functions/cleanObject';
import each from './../functions/each.js';
import size from './../functions/size.js';
import clone from './../functions/clone';
import cookie from 'js-cookie';
import {
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
} from './../events';
import {
  EVENT_VAR,
  DIGITALDATA_VAR,
  PRODUCT_VAR,
} from './../variableTypes';

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
  let voucher;
  if (Array.isArray(transaction.vouchers)) {
    voucher = transaction.vouchers[0];
  } else {
    voucher = transaction.voucher;
  }

  return voucher;
}

function getCheckoutOptions(event, checkoutOptions) {
  const optionNames = checkoutOptions;
  const options = [];
  for (const optionName of optionNames) {
    const optionValue = getProp(event, optionName);
    if (optionValue) {
      options.push(optionValue);
    }
  }
  return options.join(', ');
}

function getProductCategory(product) {
  let category = product.category;
  if (Array.isArray(category)) {
    category = category.join('/');
  } else if (category && product.subcategory) {
    category = category + '/' + product.subcategory;
  }
  return category;
}

class GoogleAnalytics extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      trackingId: '',
      alternativeTrackingId: '',
      doubleClick: false,
      enhancedLinkAttribution: false,
      enhancedEcommerce: false,
      sendUserId: false,
      anonymizeIp: false,
      domain: 'auto',
      includeSearch: false,
      siteSpeedSampleRate: 1,
      defaultCurrency: 'USD',
      metrics: {},
      dimensions: {},
      contentGroupings: {}, // legacy version
      contentGroups: {},
      productDimensions: {},
      productMetrics: {},
      namespace: undefined,
      alternativeNamespace: undefined,
      noConflict: false,
      checkoutOptions: ['option', 'paymentMethod', 'shippingMethod'],
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://www.google-analytics.com/analytics.js',
      },
    });
  }

  getSemanticEvents() {
    if (this.getOption('enhancedEcommerce')) {
      return EC_SEMANTIC_EVENTS;
    }
    return SEMANTIC_EVENTS;
  }

  allowCustomEvents() {
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
    for (const enrichableDimensionsProp of enrichableDimensionsProps) {
      enrichableProps.push(enrichableDimensionsProp);
    }

    return enrichableProps;
  }

  getEventValidations(event) {
    let validations = [];
    switch (event.name) {
    case VIEWED_PRODUCT_DETAIL:
      validations = [
        ['product.id', { required: true }],
        ['product.name', { required: true }, { critical: false }],
        ['product.category', { required: true }, { critical: false }],
        ['product.unitSalePrice', { required: true }, { critical: false }],
      ];
      break;
    case ADDED_PRODUCT:
      validations = [
        ['product.id', { required: true }],
        ['product.name', { required: true }, { critical: false }],
        ['product.category', { required: true }, { critical: false }],
        ['product.unitSalePrice', { required: true }, { critical: false }],
        ['quantity', { required: true }, { critical: false }],
      ];
      break;
    case REMOVED_PRODUCT:
      validations = [
        ['product.id', { required: true }],
        ['product.name', { required: true }, { critical: false }],
        ['product.category', { required: true }, { critical: false }],
        ['quantity', { required: true }, { critical: false }],
      ];
      break;
    case COMPLETED_TRANSACTION:
      validations = [
        ['transaction.orderId', { required: true }],
        ['transaction.lineItems[].product.id', { required: true }],
        ['transaction.lineItems[].product.name', { required: true }, { critical: false }],
        ['transaction.lineItems[].product.category', { required: true }, { critical: false }],
        ['transaction.lineItems[].product.unitSalePrice', { required: true }, { critical: false }],
        ['transaction.total', { required: true }, { critical: false }],
      ];
      break;
    default:
      // do nothing
    }

    return validations;
  }

  initialize(version) {
    this.initVersion = version;

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

      // display advertising
      if (this.getOption('doubleClick')) {
        this.ga(['require', 'displayfeatures'], this.getOption('noConflict'));
      }
      // https://support.google.com/analytics/answer/2558867?hl=en
      if (this.getOption('enhancedLinkAttribution')) {
        this.ga(['require', 'linkid', 'linkid.js'], this.getOption('noConflict'));
      }

      if (this.getOption('enhancedEcommerce')) {
        this.loadEnhancedEcommerce();
      }

      // anonymize after initializing, otherwise a warning is shown
      // in google analytics debugger
      if (this.getOption('anonymizeIp')) this.ga(['set', 'anonymizeIp', true], this.getOption('noConflict'));

      if (this.getOption('noConflict')) {
        if (
          this.getOption('alternativeTrackingId') &&
          this.getOption('alternativeNamespace') &&
          !this.isLoaded()
        ) {
          this.load(this.onLoad);
        } else {
          this.onLoad();
        }
      } else {
        this.load(this.onLoad);
      }
    } else {
      super.onLoad();
    }
    this.enrichDigitalData();
  }

  prepareCustomDimensions() {
    this.enrichableDimensionsProps = [];
    this.productLevelDimensions = {};
    this.hitLevelDimensions = {};

    let settings = Object.assign(
      this.getOption('metrics'),
      this.getOption('dimensions'),
      this.getOption('contentGroups')
    );

    if (!this.initVersion) {
      settings = Object.assign(settings, this.getOption('contentGroupings'));
      each(settings, (key, value) => {
        this.enrichableDimensionsProps.push(value);
        this.hitLevelDimensions[key] = value;
      });
      const productSettings = Object.assign(
        this.getOption('productMetrics'),
        this.getOption('productDimensions')
      );
      each(productSettings, (key, value) => {
        this.productLevelDimensions[key] = value;
      });
    } else {
      each(settings, (key, variable) => {
        if (variable.type === PRODUCT_VAR) {
          this.productLevelDimensions[key] = variable.value;
        } else {
          if (variable.type === DIGITALDATA_VAR) {
            this.enrichableDimensionsProps.push(variable.value);
            this.hitLevelDimensions[key] = variable.value;
          } else if (variable.type === EVENT_VAR) {
            this.hitLevelDimensions[key] = variable.value;
          }
        }
      });
    }
  }

  getEnrichableDimensionsProps() {
    return this.enrichableDimensionsProps || [];
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
      name: namespace ? namespace : undefined,
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
      window.ga.apply(window, namespacedParams);
    }
  }

  gaAlternative(args) {
    this.gaWithNamespace(this.getOption('alternativeNamespace'), args);
  }

  ga(args, noConflict = false) {
    if (!noConflict) {
      if (!this.getOption('namespace')) {
        window.ga.apply(window, args);
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
    if (this.getPageview()) {
      this.flushPageview();
    } else {
      this.setEventCustomDimensions(event, noConflict);

      // Send a custom non-interaction event to ensure all EE data is pushed.
      // Without doing this we'd need to require page display after setting EE data.
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

      for (const arg of args) {
        if (arg !== undefined) {
          cleanedArgs.push(arg);
        }
      }

      this.ga(cleanedArgs, noConflict);
    }
  }

  enrichDigitalData() {
    const gaCookie = cookie.get('_ga');
    if (gaCookie) {
      const match = gaCookie.match(/(\d+\.\d+)$/);
      const googleClientId = (match) ? match[1] : null;
      if (googleClientId) {
        this.digitalData.user = this.digitalData.user || {};
        this.digitalData.user.googleClientId = googleClientId;
      }
    }

    // TODO: remove asynс enrichment
    window.ga((tracker) => {
      const trackerName = this.getOption('namespace');
      tracker = tracker || window.ga.getByName(trackerName);
      if (tracker) {
        this.digitalData.user = this.digitalData.user || {};
        this.digitalData.user.googleClientId = tracker.get('clientId');
        setProp(this.digitalData, 'integrations.googleAnalytics.clientId', tracker.get('clientId'));
      }

      this.onEnrich();
    });
  }

  isPageviewDelayed(pageType) {
    if (!this.getOption('enhancedEcommerce')) {
      return false;
    }
    const map = {
      'product': VIEWED_PRODUCT_DETAIL,
      'cart': [VIEWED_CHECKOUT_STEP],
      'confirmation': COMPLETED_TRANSACTION,
      'checkout': VIEWED_CHECKOUT_STEP,
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

  trackEvent(event) {
    if ([VIEWED_PRODUCT_LISTING, SEARCHED_PRODUCTS, VIEWED_CART].indexOf(event.name) >= 0) {
      return; // ignore events (not semantic for GA)
    }
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
    } else {
      if (event.name === COMPLETED_TRANSACTION) {
        this.onCompletedTransaction(event);
      } else {
        if ([
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
    // send global id
    const page = event.page;
    const pageview = {};
    const pageUrl = page.url;
    let pagePath = page.path;

    if (this.getOption('includeSearch') && page.queryString) {
      pagePath = pagePath + page.queryString;
    }
    const pageTitle = page.name || page.title;
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

    let listItems = event.listItems;
    if ((!listItems || !Array.isArray(listItems)) && event.listItem) {
      listItems = [event.listItem];
    }

    for (const listItem of listItems) {
      const product = listItem.product;
      if (!product.id && !product.skuCode && !product.name) {
        continue;
      }

      const custom = this.getCustomDimensions(product, true);
      const gaProduct = Object.assign({
        id: product.id || product.skuCode,
        name: product.name,
        list: listItem.listName,
        category: getProductCategory(product),
        brand: product.brand || product.manufacturer,
        price: product.unitSalePrice || product.unitPrice,
        currency: product.currency || this.getOption('defaultCurrency'),
        variant: product.variant,
        position: listItem.position,
      }, custom);
      this.ga(['ec:addImpression', gaProduct], this.getOption('noConflict'));
    }

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
    const transaction = event.transaction;
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
      const product = lineItem.product;
      if (product) {
        this.ga(['ecommerce:addItem', {
          id: product.id,
          category: getProductCategory(product),
          quantity: lineItem.quantity,
          price: product.unitSalePrice || product.unitPrice,
          name: product.name,
          sku: product.skuCode,
          currency: product.currency || transaction.currency,
        }], this.getOption('noConflict'));
      }
    });

    // send
    this.ga(['ecommerce:send'], this.getOption('noConflict'));
  }

  onCompletedTransactionEnhanced(event) {
    const transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    each(transaction.lineItems, (key, lineItem) => {
      const product = lineItem.product;
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
    const transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    each(transaction.lineItems, (key, lineItem) => {
      const product = lineItem.product;
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

    let campaigns = event.campaigns;
    if ((!campaigns || !Array.isArray(campaigns)) && event.campaign) {
      campaigns = [event.campaign];
    }

    for (const campaign of campaigns) {
      if (!campaign || !campaign.id) {
        continue;
      }

      this.ga(['ec:addPromo', {
        id: campaign.id,
        name: campaign.name,
        creative: campaign.design || campaign.creative,
        position: campaign.position,
      }]);
    }

    this.pushEnhancedEcommerce(event); // ignore noConflict
  }

  onClickedCampaign(event) {
    const campaign = event.campaign;

    if (!campaign || !campaign.id) {
      return;
    }

    this.ga(['ec:addPromo', {
      id: campaign.id,
      name: campaign.name,
      creative: campaign.design || campaign.creative,
      position: campaign.position,
    }]);
    this.ga(['ec:setAction', 'promo_click', {}]);
    this.pushEnhancedEcommerce(event); // ignore noConflict
  }

  onViewedCheckoutStep(event) {
    event.nonInteraction = true;

    const cartOrTransaction = getProp(event, 'cart') || getProp(event, 'transaction');

    each(cartOrTransaction.lineItems, (key, lineItem) => {
      const product = lineItem.product;
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
      }]);
    }
  }

  setEventCustomDimensions(event, noConflict) {
    // custom dimensions & metrics
    const source = clone(event);
    for (const prop of ['name', 'category', 'label', 'nonInteraction', 'value']) {
      deleteProperty(source, prop);
    }
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
      name: product.name,
      category: getProductCategory(product),
      price: product.unitSalePrice || product.unitPrice,
      brand: product.brand || product.manufacturer,
      variant: product.variant,
      currency: product.currency,
    }, custom);
    if (quantity) gaProduct.quantity = quantity;
    if (position) gaProduct.position = position;
    // append coupon if it set
    // https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-transactions
    if (product.voucher) gaProduct.coupon = product.voucher;
    this.ga(['ec:addProduct', gaProduct], this.getOption('noConflict'));
  }

  enhancedEcommerceProductAction(event, action, data) {
    let position;
    let product;
    if (event.listItem) {
      position = event.listItem.position;
      product = event.listItem.product;
    } else {
      product = event.product;
    }
    if (!product || !product.id) return;

    this.enhancedEcommerceTrackProduct(product, event.quantity, position);
    this.ga(['ec:setAction', action, data || {}], this.getOption('noConflict'));
  }
}

export default GoogleAnalytics;
