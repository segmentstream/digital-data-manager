import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import { getProp } from './../functions/dotProp';
import each from './../functions/each.js';
import size from './../functions/size.js';
import clone from 'component-clone';

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
      trackOnlyCustomEvents: false,
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
      contentGroupings: {},
      productDimensions: {},
      productMetrics: {},
      namespace: 'ddl',
      noConflict: false,
      checkoutOptions: ['option', 'paymentMethod', 'shippingMethod'],
      filterEvents: [],
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//www.google-analytics.com/analytics.js',
      },
    });
  }

  initialize() {
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

      this.initializeTracker();

      if (this.getOption('noConflict')) {
        this.onLoad();
      } else {
        this.load(this.onLoad);
      }
    } else {
      this.onLoad();
    }
    this.enrichDigitalData();
  }

  initializeTracker() {
    window.ga('create', this.getOption('trackingId'), {
      // Fall back on default to protect against empty string
      cookieDomain: this.getOption('domain'),
      siteSpeedSampleRate: this.getOption('siteSpeedSampleRate'),
      allowLinker: true,
      name: this.getOption('namespace') ? this.getOption('namespace') : undefined,
    });
    // display advertising
    if (this.getOption('doubleClick')) {
      this.ga('require', 'displayfeatures');
    }
    // https://support.google.com/analytics/answer/2558867?hl=en
    if (this.getOption('enhancedLinkAttribution')) {
      this.ga('require', 'linkid', 'linkid.js');
    }

    // send global id
    const userId = this.get('user.userId');
    if (this.getOption('sendUserId') && userId) {
      this.ga('set', 'userId', userId);
    }

    // anonymize after initializing, otherwise a warning is shown
    // in google analytics debugger
    if (this.getOption('anonymizeIp')) this.ga('set', 'anonymizeIp', true);

    // custom dimensions & metrics
    const custom = this.getCustomDimensions();
    if (size(custom)) this.ga('set', custom);
  }

  ga() {
    if (!this.getOption('namespace')) {
      window.ga.apply(window, arguments);
    } else {
      if (arguments[0]) {
        arguments[0] = this.getOption('namespace') + '.' + arguments[0];
      }
      window.ga.apply(window, arguments);
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
    source = source || this.digitalData;
    let settings;
    if (!productScope) {
      settings = Object.assign(
        this.getOption('metrics'),
        this.getOption('dimensions'),
        this.getOption('contentGroupings')
      );
    } else {
      settings = Object.assign(
        this.getOption('productMetrics'),
        this.getOption('productDimensions')
      );
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

  loadEnhancedEcommerce(currency) {
    if (!this.enhancedEcommerceLoaded) {
      this.ga('require', 'ec');
      this.enhancedEcommerceLoaded = true;
    }

    // Ensure we set currency for every hit
    this.ga('set', '&cu', currency || this.getOption('defaultCurrency'));
  }

  pushEnhancedEcommerce(event) {
    this.setEventCustomDimensions(event);

    if (this.getPageview()) {
      this.flushPageview();
    } else {
      // Send a custom non-interaction event to ensure all EE data is pushed.
      // Without doing this we'd need to require page display after setting EE data.
      const cleanedArgs = [];
      const args = [
        'send',
        'event',
        event.category || 'Ecommerce',
        event.name || 'not defined',
        event.label,
        {
          nonInteraction: 1,
        },
      ];

      for (const arg of args) {
        if (arg !== undefined) {
          cleanedArgs.push(arg);
        }
      }

      this.ga.apply(this, cleanedArgs);
    }
  }

  enrichDigitalData() {
    window.ga((tracker) => {
      const trackerName = this.getOption('namespace');
      tracker = tracker || window.ga.getByName(trackerName);
      if (tracker) {
        const clientId = tracker.get('clientId');
        this.digitalData.integrations.googleAnalytics = { clientId };
      }
      this.onEnrich();
    });
  }

  isEventFiltered(eventName) {
    const filterEvents = this.getOption('filterEvents') || [];
    if (filterEvents.indexOf(eventName) >= 0) {
      return true;
    }
    return false;
  }

  isPageviewDelayed(pageType) {
    if (!this.getOption('enhancedEcommerce')) {
      return false;
    }
    const map = {
      'category': 'Viewed Product Category',
      'product': 'Viewed Product Detail',
      'cart': ['Viewed Cart', 'Viewed Checkout Step'],
      'confirmation': 'Completed Transaction',
      'search': 'Searched Products',
      'checkout': 'Viewed Checkout Step',
    };

    let eventNames = map[pageType];
    if (!eventNames) {
      return false;
    }

    if (!Array.isArray(eventNames)) {
      eventNames = [eventNames];
    }
    for (const eventName of eventNames) {
      if (!this.isEventFiltered(eventName)) {
        // if at least on of events is not filtered
        return true;
      }
    }
    return false;
  }

  trackEvent(event) {
    if (this.isEventFiltered(event.name)) {
      return;
    }
    if (event.name === 'Viewed Page') {
      if (!this.getOption('noConflict')) {
        this.onViewedPage(event);
      }
    } else if (this.getOption('enhancedEcommerce')) {
      const methods = {
        'Viewed Product': this.onViewedProduct,
        'Clicked Product': this.onClickedProduct,
        'Viewed Product Detail': this.onViewedProductDetail,
        'Added Product': this.onAddedProduct,
        'Removed Product': this.onRemovedProduct,
        'Completed Transaction': this.onCompletedTransactionEnhanced,
        'Refunded Transaction': this.onRefundedTransaction,
        'Viewed Campaign': this.onViewedCampaign,
        'Clicked Campaign': this.onClickedCampaign,
        'Viewed Checkout Step': this.onViewedCheckoutStep,
        'Completed Checkout Step': this.onCompletedCheckoutStep,
        'Viewed Product Category': this.onViewedProductCategory, // stub
        'Viewed Cart': this.onViewedCart, // stub
        'Searched Products': this.onSearchedProducts, // stub
      };
      const method = methods[event.name];
      if (method) {
        method.bind(this)(event);
      } else {
        this.onCustomEvent(event);
      }
    } else {
      if (event.name === 'Completed Transaction' && !this.getOption('noConflict')) {
        this.onCompletedTransaction(event);
      } else {
        this.onCustomEvent(event);
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
    this.ga('send', 'pageview', this.pageview);
    this.pageCalled = true;
    this.pageview = null;
  }

  onViewedPage(event) {
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
    this.ga('set', {
      page: pagePath,
      title: pageTitle,
    });

    // send
    this.setEventCustomDimensions(event);

    if (!this.isPageviewDelayed(page.type)) {
      this.flushPageview();
    } else {
      setTimeout(() => {
        if (this.isLoaded() && this.getPageview()) {
          this.flushPageview(); // flush anyway in 100ms
        }
      }, 100);
    }
  }

  onViewedProduct(event) {
    let listItems = event.listItems;
    if ((!listItems || !Array.isArray(listItems)) && event.listItem) {
      listItems = [event.listItem];
    }

    for (const listItem of listItems) {
      const product = listItem.product;
      if (!product.id && !product.skuCode && !product.name) {
        continue;
      }
      this.loadEnhancedEcommerce(product.currency);

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
      this.ga('ec:addImpression', gaProduct);
    }

    this.pushEnhancedEcommerce(event);
  }

  onClickedProduct(event) {
    if (!event.listItem) {
      return;
    }
    const product = event.listItem.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'click', {
      list: event.listItem.listName,
    });
    this.pushEnhancedEcommerce(event);
  }

  onViewedProductDetail(event) {
    const product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'detail');
    this.pushEnhancedEcommerce(event);
  }

  onAddedProduct(event) {
    const product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'add');
    this.pushEnhancedEcommerce(event);
  }

  onRemovedProduct(event) {
    const product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    this.enhancedEcommerceProductAction(event, 'remove');
    this.pushEnhancedEcommerce(event);
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    // require ecommerce
    if (!this.ecommerce) {
      this.ga('require', 'ecommerce');
      this.ecommerce = true;
    }

    // add transaction
    this.ga('ecommerce:addTransaction', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      shipping: transaction.shippingCost,
      tax: transaction.tax,
      revenue: transaction.total || transaction.subtotal || 0,
      currency: transaction.currency,
    });

    // add products
    each(transaction.lineItems, (key, lineItem) => {
      const product = lineItem.product;
      if (product) {
        this.ga('ecommerce:addItem', {
          id: product.id,
          category: getProductCategory(product),
          quantity: lineItem.quantity,
          price: product.unitSalePrice || product.unitPrice,
          name: product.name,
          sku: product.skuCode,
          currency: product.currency || transaction.currency,
        });
      }
    });

    // send
    this.ga('ecommerce:send');
  }

  onCompletedTransactionEnhanced(event) {
    const transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    this.loadEnhancedEcommerce(transaction.currency);

    each(transaction.lineItems, (key, lineItem) => {
      const product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || this.getOption('defaultCurrency');
        this.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    const voucher = getTransactionVoucher(transaction);
    this.ga('ec:setAction', 'purchase', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      revenue: transaction.total || transaction.subtotal || 0,
      tax: transaction.tax,
      shipping: transaction.shippingCost,
      coupon: voucher,
    });

    this.pushEnhancedEcommerce(event);
  }

  onRefundedTransaction(event) {
    const transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;
    this.loadEnhancedEcommerce(transaction.currency);

    each(transaction.lineItems, (key, lineItem) => {
      const product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || this.getOption('defaultCurrency');
        this.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga('ec:setAction', 'refund', {
      id: transaction.orderId,
    });

    this.pushEnhancedEcommerce(event);
  }

  onViewedCampaign(event) {
    let campaigns = event.campaigns;
    if ((!campaigns || !Array.isArray(campaigns)) && event.campaign) {
      campaigns = [event.campaign];
    }

    this.loadEnhancedEcommerce();

    for (const campaign of campaigns) {
      if (!campaign || !campaign.id) {
        continue;
      }

      this.ga('ec:addPromo', {
        id: campaign.id,
        name: campaign.name,
        creative: campaign.design || campaign.creative,
        position: campaign.position,
      });
    }

    this.pushEnhancedEcommerce(event);
  }

  onClickedCampaign(event) {
    const campaign = event.campaign;

    if (!campaign || !campaign.id) {
      return;
    }

    this.loadEnhancedEcommerce();
    this.ga('ec:addPromo', {
      id: campaign.id,
      name: campaign.name,
      creative: campaign.design || campaign.creative,
      position: campaign.position,
    });
    this.ga('ec:setAction', 'promo_click', {});
    this.pushEnhancedEcommerce(event);
  }

  onViewedCheckoutStep(event) {
    const cartOrTransaction = this.get('cart') || this.get('transaction');

    this.loadEnhancedEcommerce(cartOrTransaction.currency);

    each(cartOrTransaction.lineItems, (key, lineItem) => {
      const product = lineItem.product;
      if (product) {
        product.currency = product.currency || cartOrTransaction.currency || this.getOption('defaultCurrency');
        this.enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    this.ga('ec:setAction', 'checkout', {
      step: event.step || 1,
      option: getCheckoutOptions(event, this.getOption('checkoutOptions')) || undefined,
    });

    this.pushEnhancedEcommerce(event);
  }

  onCompletedCheckoutStep(event) {
    const cartOrTransaction = this.get('cart') || this.get('transaction');
    const options = getCheckoutOptions(event, this.getOption('checkoutOptions'));
    if (!event.step || !options) {
      return;
    }

    this.loadEnhancedEcommerce(cartOrTransaction.currency);

    this.ga('ec:setAction', 'checkout_option', {
      step: event.step,
      option: options,
    });

    this.pushEnhancedEcommerce(event);
  }

  onViewedProductCategory(event) {
    this.pushEnhancedEcommerce(event);
  }

  onViewedCart(event) {
    this.pushEnhancedEcommerce(event);
  }

  onSearchedProducts(event) {
    this.pushEnhancedEcommerce(event);
  }

  onCustomEvent(event) {
    const payload = {
      eventAction: event.name || 'event',
      eventCategory: event.category || 'All',
      eventLabel: event.label,
      eventValue: Math.round(event.value) || 0,
      nonInteraction: !!event.nonInteraction,
    };

    this.setEventCustomDimensions(event);
    this.ga('send', 'event', payload);
  }

  setEventCustomDimensions(event) {
    // custom dimensions & metrics
    const source = clone(event);
    for (const prop of ['name', 'category', 'label', 'nonInteraction', 'value']) {
      deleteProperty(source, prop);
    }
    const custom = this.getCustomDimensions(source);
    if (size(custom)) this.ga('set', custom);
  }

  enhancedEcommerceTrackProduct(product, quantity, position) {
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
    this.ga('ec:addProduct', gaProduct);
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
    this.enhancedEcommerceTrackProduct(product, event.quantity, position);
    this.ga('ec:setAction', action, data || {});
  }
}

export default GoogleAnalytics;
