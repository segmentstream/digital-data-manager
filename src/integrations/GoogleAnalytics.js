import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import each from './../functions/each.js';

function enhancedEcommerceTrackProduct(product, quantity) {
  const gaProduct = {
    id: product.id || product.skuCode,
    name: product.name,
    category: product.category,
    quantity: quantity,
    price: product.unitSalePrice || product.unitPrice,
    brand: product.brand || product.manufacturer,
    variant: product.variant,
    currency: product.currency,
  };
  // append coupon if it set
  // https://developers.google.com/analytics/devguides/collection/analyticsjs/enhanced-ecommerce#measuring-transactions
  if (product.voucher) gaProduct.coupon = product.voucher;
  window.ga('ec:addProduct', gaProduct);
}

function enhancedEcommerceProductAction(event, action, data) {
  enhancedEcommerceTrackProduct(event.product, event.quantity);
  window.ga('ec:setAction', action, data || {});
}

function getTransactionVoucher(transaction) {
  let voucher;
  if (Array.isArray(transaction.vouchers)) {
    voucher = transaction.vouchers[0];
  } else {
    voucher = transaction.voucher;
  }
  if (!voucher) {
    if (Array.isArray(transaction.promotions)) {
      voucher = transaction.promotions[0];
    } else {
      voucher = transaction.promotion;
    }
  }
  return voucher;
}

function getCheckoutOptions(event) {
  const optionNames = ['paymentMethod', 'shippingMethod'];
  const options = [];
  for (const optionName of optionNames) {
    if (event[optionName]) {
      options.push(event[optionName]);
    }
  }
  return options.join(', ');
}

class GoogleAnalytics extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      trackingId: '',
      doubleClick: false,
      enhancedLinkAttribution: false,
      enhancedEcommerce: false,
      sendUserId: false,
      anonymizeIp: false,
      domain: 'auto',
      includeSearch: false,
      siteSpeedSampleRate: 1,
      defaultCurrency: 'USD'
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: '//www.google-analytics.com/analytics.js',
      },
    });

    this.addTag('double click', {
      type: 'script',
      attr: {
        src: '//stats.g.doubleclick.net/dc.js',
      },
    });
  }

  static getName() {
    return 'Google Analytics';
  }

  initialize() {
    if (this.getOption('trackingId')) {
      this.pageCalled = false;

      // setup the tracker globals
      window.GoogleAnalyticsObject = 'ga';
      window.ga = window.ga || function() {
        window.ga.q = window.ga.q || [];
        window.ga.q.push(arguments);
      };
      window.ga.l = new Date().getTime();

      if (window.location.hostname === 'localhost') {
        this.setOption('domain', 'none');
      }

      window.ga('create', this.getOption('trackingId'), {
        // Fall back on default to protect against empty string
        cookieDomain: this.getOption('domain'),
        siteSpeedSampleRate: this.getOption('siteSpeedSampleRate'),
        allowLinker: true
      });

      // display advertising
      if (this.getOption('doubleClick')) {
        window.ga('require', 'displayfeatures');
      }
      // https://support.google.com/analytics/answer/2558867?hl=en
      if (this.getOption('enhancedLinkAttribution')) {
        window.ga('require', 'linkid', 'linkid.js');
      }

      // send global id
      const userId = this.get('user.id');
      if (this.getOption('sendUserId') && userId) {
        window.ga('set', 'userId', userId);
      }

      // anonymize after initializing, otherwise a warning is shown
      // in google analytics debugger
      if (this.getOption('anonymizeIp')) window.ga('set', 'anonymizeIp', true);

      // custom dimensions & metrics
      // TODO
      this.load(this.ready);
    } else {
      this.ready();
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

  loadEnhancedEcommerce(currency) {
    if (!this.enhancedEcommerceLoaded) {
      window.ga('require', 'ec');
      this.enhancedEcommerceLoaded = true;
    }

    // Ensure we set currency for every hit
    window.ga('set', '&cu', currency || this.getOption('defaultCurrency'));
  };

  pushEnhancedEcommerce(event) {
    // Send a custom non-interaction event to ensure all EE data is pushed.
    // Without doing this we'd need to require page display after setting EE data.
    let eventCategory = event.category || 'Ecommerce';
    let eventAction = event.name || 'not defined';
    let eventLabel = event.label;

    window.ga('send', 'event', eventCategory, eventAction, eventLabel, {
      nonInteraction: 1
    });
  }

  trackEvent(event) {
    if (event.name === 'Viewed Page') {
      this.onViewedPage(event);
    } else if (this.getOption('enhancedEcommerce')) {
      if (event.name === 'Viewed Product') {
        this.onViewedProduct(event);
      } else if (event.name === 'Clicked Product') {
        this.onClickedProduct(event);
      } else if (event.name === 'Viewed Product Detail') {
        this.onViewedProductDetail(event);
      } else if (event.name === 'Added Product') {
        this.onAddedProduct(event);
      } else if (event.name === 'Removed Product') {
        this.onRemovedProduct(event);
      } else if (event.name === 'Completed Transaction') {
        this.onCompletedTransactionEnhanced(event);
      } else if (event.name === 'Refunded Transaction') {
        this.onRefundedTransaction(event);
      } else if (event.name === 'Viewed Product Category') {
        this.onViewedProductCategory(event);
      } else if (event.name === 'Viewed Campaign') {
        this.onViewedCampaign(event);
      } else if (event.name === 'Clicked Campaign') {
        this.onClickedCampaign(event);
      } else if (event.name === 'Viewed Checkout Step') {
        this.onViewedCheckoutStep(event);
      } else if (event.name === 'Completed Checkout Step') {
        this.onCompletedCheckoutStep(event);
      }else {
        this.onCustomEvent(event);
      }
    } else {
      if (event.name === 'Completed Transaction') {
        this.onCompletedTransaction(event);
      } else {
        this.onCustomEvent(event);
      }
    }
  }

  onViewedPage(event) {
    var page = event.page;
    var campaign = this.get('context.campaign') || {};
    var pageview = {};
    var pageUrl = page.url;
    var pagePath = page.path;
    if (this.getOption('includeSearch') && page.queryString) {
      pagePath = pagePath + page.queryString;
    }
    var pageTitle = page.name || page.title;

    pageview.page = pagePath;
    pageview.title = pageTitle;
    pageview.location = pageUrl;

    if (campaign.name) pageview.campaignName = campaign.name;
    if (campaign.source) pageview.campaignSource = campaign.source;
    if (campaign.medium) pageview.campaignMedium = campaign.medium;
    if (campaign.content) pageview.campaignContent = campaign.content;
    if (campaign.term) pageview.campaignKeyword = campaign.term;

    // custom dimensions and metrics
    //var custom = metrics(props, opts);
    //if (len(custom)) window.ga('set', custom);

    // set
    window.ga('set', {
      page: pagePath,
      title: pageTitle
    });

    if (this.pageCalled) {
      deleteProperty(pageview, 'location');
    }

    // send
    window.ga('send', 'pageview', pageview);

    this.pageCalled = true;
  }

  onViewedProductCategory(page) {

  }

  onViewedProduct(event) {
    const product = event.product;
    if (!product.id && !product.skuCode && !product.name) {
      return;
    }
    this.loadEnhancedEcommerce(product.currency);
    window.ga('ec:addImpression', {
      id: product.id || product.skuCode,
      name: product.name,
      list: product.listName,
      category: product.category,
      brand: product.brand || product.manufacturer,
      price: product.unitSalePrice || product.unitPrice,
      currency: product.currency || this.getOption('defaultCurrency'),
      variant: product.variant,
      position: product.position
    });
    this.pushEnhancedEcommerce(event);
  }

  onClickedProduct(event) {
    const product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    enhancedEcommerceProductAction(event, 'click', {
      list: product.listName
    });
    this.pushEnhancedEcommerce(event);
  }

  onViewedProductDetail(event) {
    const product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    enhancedEcommerceProductAction(event, 'detail');
    this.pushEnhancedEcommerce(event);
  }

  onAddedProduct(event) {
    const product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    enhancedEcommerceProductAction(event, 'add');
    this.pushEnhancedEcommerce(event);
  }

  onRemovedProduct(event) {
    const product = event.product;
    this.loadEnhancedEcommerce(product.currency);
    enhancedEcommerceProductAction(event, 'remove');
    this.pushEnhancedEcommerce(event);
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction;
    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    // require ecommerce
    if (!this.ecommerce) {
      window.ga('require', 'ecommerce');
      this.ecommerce = true;
    }

    // add transaction
    window.ga('ecommerce:addTransaction', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      shipping: transaction.shippingCost,
      tax: transaction.tax,
      revenue: transaction.total || transaction.subtotal || 0,
      currency: transaction.currency,
    });

    // add products
    each(transaction.lineItems, function(key, lineItem) {
      const product = lineItem.product;
      if (product) {
        window.ga('ecommerce:addItem', {
          id: transaction.orderId,
          category: product.category,
          quantity: lineItem.quantity,
          price: product.unitSalePrice || product.unitPrice,
          name: product.name,
          sku: product.skuCode,
          currency: product.currency || transaction.currency,
        });
      }
    });

    // send
    window.ga('ecommerce:send');
  }

  onCompletedTransactionEnhanced(event) {
    const transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    this.loadEnhancedEcommerce(transaction.currency);

    each(transaction.lineItems, function(key, lineItem) {
      const product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || this.getOption('defaultCurrency');
        enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    let voucher = getTransactionVoucher(transaction);
    window.ga('ec:setAction', 'purchase', {
      id: transaction.orderId,
      affiliation: transaction.affiliation,
      revenue: transaction.total || transaction.subtotal || 0,
      tax: transaction.tax,
      shipping: transaction.shippingCost,
      coupon: voucher
    });

    this.pushEnhancedEcommerce(event);
  }

  onRefundedTransaction(event) {
    const transaction = event.transaction;

    // orderId is required.
    if (!transaction || !transaction.orderId) return;

    this.loadEnhancedEcommerce(transaction.currency);

    each(transaction.lineItems, function(key, lineItem) {
      const product = lineItem.product;
      if (product) {
        product.currency = product.currency || transaction.currency || this.getOption('defaultCurrency');
        enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    window.ga('ec:setAction', 'refund', {
      id: transaction.orderId,
    });

    this.pushEnhancedEcommerce(event);
  }

  onViewedCampaign(event) {
    const campaign = event.campaign;

    if (!campaign || !campaign.id) {
      return;
    }

    this.loadEnhancedEcommerce();
    window.ga('ec:addPromo', {
      id: campaign.id,
      name: campaign.name,
      creative: campaign.design || campaign.creative,
      position: campaign.position
    });
    this.pushEnhancedEcommerce(event);
  }

  onClickedCampaign(event) {
    const campaign = event.campaign;

    if (!campaign || !campaign.id) {
      return;
    }

    this.loadEnhancedEcommerce();
    window.ga('ec:addPromo', {
      id: campaign.id,
      name: campaign.name,
      creative: campaign.design || campaign.creative,
      position: campaign.position
    });
    window.ga('ec:setAction', 'promo_click', {});
    this.pushEnhancedEcommerce(event);
  }

  onViewedCheckoutStep(event) {
    const cartOrTransaction = this.get('cart') || this.get('transaction');

    this.loadEnhancedEcommerce(cartOrTransaction.currency);

    each(cartOrTransaction.lineItems, function(key, lineItem) {
      const product = lineItem.product;
      if (product) {
        product.currency = product.currency || cartOrTransaction.currency || this.getOption('defaultCurrency');
        enhancedEcommerceTrackProduct(lineItem.product, lineItem.quantity);
      }
    });

    window.ga('ec:setAction', 'checkout', {
      step: event.step || 1,
      option: getCheckoutOptions(event) || undefined,
    });

    this.pushEnhancedEcommerce(event);
  }

  onCompletedCheckoutStep(event) {
    const cartOrTransaction = this.get('cart') || this.get('transaction');
    const options = getCheckoutOptions(event);

    if (!event.step || !options) {
      return;
    }

    this.loadEnhancedEcommerce(cartOrTransaction.currency);

    window.ga('ec:setAction', 'checkout_option', {
      step: event.step,
      option: options,
    });

    this.pushEnhancedEcommerce(event);
  }

  onCustomEvent(event) {
    var campaign = this.get('context.campaign') || {};

    // custom dimensions & metrics
    // TODO: add custom dimensions & metrics

    var payload = {
      eventAction: event.name || 'event',
      eventCategory: event.category || 'All',
      eventLabel: event.label,
      eventValue: Math.round(event.value) || 0,
      nonInteraction: !!event.nonInteraction
    };

    if (campaign.name) payload.campaignName = campaign.name;
    if (campaign.source) payload.campaignSource = campaign.source;
    if (campaign.medium) payload.campaignMedium = campaign.medium;
    if (campaign.content) payload.campaignContent = campaign.content;
    if (campaign.term) payload.campaignKeyword = campaign.term;

    window.ga('send', 'event', payload);
  }
}

export default GoogleAnalytics;
