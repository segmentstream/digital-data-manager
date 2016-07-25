import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty';
import getProperty from './../../src/functions/getProperty';
import throwError from './../functions/throwError';
import each from './../functions/each';
import clone from 'component-clone';
import type from 'component-type';
import format from './../functions/format';
import getQueryParam from './../functions/getQueryParam';

function getEventVars(event) {
  const eventVars = clone(event);
  deleteProperty(event, 'name');
  deleteProperty(event, 'category');
  return eventVars;
}

class RetailRocket extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      partnerId: '',
      userIdProperty: 'user.userId',
      trackProducts: true, // legacy setting, use noConflict instead
      noConflict: false,
      trackAllEmails: false,
      listMethods: {},
      customVariables: {},
    }, options);

    super(digitalData, optionsWithDefaults);

    // legacy setting mapper
    if (this.getOption('trackProducts') === false) {
      this.setOption('noConflict', true);
    }

    this.addTag({
      type: 'script',
      attr: {
        id: 'rrApi-jssdk',
        src: '//cdn.retailrocket.ru/content/javascript/tracking.js',
      },
    });
  }

  initialize() {
    if (this.getOption('partnerId')) {
      window.rrPartnerId = this.getOption('partnerId');
      const userId = getProperty(this.digitalData, this.getOption('userIdProperty'));
      if (userId) {
        window.rrPartnerUserId = userId;
      }
      window.rrApi = {};
      window.rrApiOnReady = window.rrApiOnReady || [];
      window.rrApi.pageView = window.rrApi.addToBasket =
          window.rrApi.order = window.rrApi.categoryView = window.rrApi.setEmail = window.rrApi.view =
          window.rrApi.recomMouseDown = window.rrApi.recomAddToCart = window.rrApi.search = () => {};

      this.trackEmail();

      this.load(this.ready);
    } else {
      this.ready();
    }
  }

  isLoaded() {
    return !!(window.rrApi && typeof window.rrApi._initialize === 'function');
  }

  reset() {
    deleteProperty(window, 'rrPartnerId');
    deleteProperty(window, 'rrApi');
    deleteProperty(window, 'rrApiOnReady');
    deleteProperty(window, 'rrApi');
    deleteProperty(window, 'retailrocket');
    deleteProperty(window, 'retailrocket_products');
    deleteProperty(window, 'rrLibrary');
    const script = document.getElementById('rrApi-jssdk');
    if (script && script.parentNode) {
      script.parentNode.removeChild(script);
    }
  }

  trackEvent(event) {
    if (this.getOption('noConflict') !== true) {
      if (event.name === 'Viewed Product Category') {
        this.onViewedProductCategory(event.listing);
      } else if (event.name === 'Added Product') {
        this.onAddedProduct(event.product);
      } else if (event.name === 'Viewed Product Detail') {
        this.onViewedProductDetail(event.product);
      } else if (event.name === 'Clicked Product') {
        this.onClickedProduct(event.listItem);
      } else if (event.name === 'Completed Transaction') {
        this.onCompletedTransaction(event.transaction);
      } else if (event.name === 'Subscribed') {
        this.onSubscribed(event.user, getEventVars(event));
      } else if (event.name === 'Searched') {
        this.onSearched(event.listing);
      }
    } else {
      if (event.name === 'Subscribed') {
        this.onSubscribed(event.user, getEventVars(event));
      }
    }
  }

  trackEmail() {
    if (this.get('user.email')) {
      if (this.getOption('trackAllEmails') === true || this.get('user.isSubscribed') === true) {
        this.onSubscribed(this.get('user'));
      }
    } else {
      const email = getQueryParam('rr_setemail', this.getQueryString());
      if (email) {
        this.digitalData.user.email = email;
        // Retail Rocker will track this query param automatically
      } else {
        window.ddListener.push(['on', 'change:user.email', () => {
          if (this.getOption('trackAllEmails') === true || this.get('user.isSubscribed') === true) {
            this.onSubscribed(this.get('user'));
          }
        }]);
      }
    }
  }

  onViewedProductCategory(listing) {
    listing = listing || {};
    const categoryId = listing.categoryId;
    if (!categoryId) {
      this.onValidationError('listing.categoryId');
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.categoryView(categoryId);
      } catch (e) {
        this.onError(e);
      }
    });
  }

  onViewedProductDetail(product) {
    const productId = this.getProductId(product);
    if (!productId) {
      this.onValidationError('product.id');
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.view(productId);
      } catch (e) {
        this.onError(e);
      }
    });
  }

  onAddedProduct(product) {
    const productId = this.getProductId(product);
    if (!productId) {
      this.onValidationError('product.id');
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.addToBasket(productId);
      } catch (e) {
        this.onError(e);
      }
    });
  }

  onClickedProduct(listItem) {
    if (!listItem) {
      this.onValidationError('listItem.product.id');
      return;
    }
    const productId = this.getProductId(listItem.product);
    if (!productId) {
      this.onValidationError('listItem.product.id');
      return;
    }
    const listName = listItem.listName;
    if (!listName) {
      return;
    }
    const methodName = this.getOption('listMethods')[listName];
    if (!methodName) {
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.recomMouseDown(productId, methodName);
      } catch (e) {
        this.onError(e);
      }
    });
  }

  onCompletedTransaction(transaction) {
    transaction = transaction || {};
    if (!this.validateTransaction(transaction)) {
      return;
    }

    const items = [];
    const lineItems = transaction.lineItems;
    for (let i = 0, length = lineItems.length; i < length; i++) {
      if (!this.validateTransactionLineItem(lineItems[i], i)) {
        continue;
      }
      const product = lineItems[i].product;
      items.push({
        id: product.id,
        qnt: lineItems[i].quantity,
        price: product.unitSalePrice || product.unitPrice,
      });
    }

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.order({
          transaction: transaction.orderId,
          items: items,
        });
      } catch (e) {
        this.onError(e);
      }
    });
  }

  onSubscribed(user, customs) {
    user = user || {};
    if (!user.email) {
      this.onValidationError('user.email');
      return;
    }

    const rrCustoms = {};
    if (customs) {
      const settings = this.getOption('customVariables');
      each(settings, (key, value) => {
        let dimensionVal = getProperty(customs, value);
        if (dimensionVal !== undefined) {
          if (type(dimensionVal) === 'boolean') dimensionVal = dimensionVal.toString();
          rrCustoms[key] = dimensionVal;
        }
      });
    }

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.setEmail(user.email, rrCustoms);
      } catch (e) {
        this.onError(e);
      }
    });
  }

  onSearched(listing) {
    listing = listing || {};
    if (!listing.query) {
      this.onValidationError('listing.query');
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.search(listing.query);
      } catch (e) {
        this.onError(e);
      }
    });
  }

  validateTransaction(transaction) {
    let isValid = true;
    if (!transaction.orderId) {
      this.onValidationError('transaction.orderId');
      isValid = false;
    }

    const lineItems = transaction.lineItems;
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      this.onValidationError('transaction.lineItems');
      isValid = false;
    }

    return isValid;
  }

  validateLineItem(lineItem, index) {
    let isValid = true;
    if (!lineItem.product) {
      this.onValidationError(format('lineItems[%d].product', index));
      isValid = false;
    }

    return isValid;
  }

  validateTransactionLineItem(lineItem, index) {
    let isValid = this.validateLineItem(lineItem, index);

    const product = lineItem.product;
    if (!product.id) {
      this.onValidationError(format('lineItems[%d].product.id', index));
      isValid = false;
    }
    if (!product.unitSalePrice && !product.unitPrice) {
      this.onValidationError(format('lineItems[%d].product.unitSalePrice', index));
      isValid = false;
    }
    if (!lineItem.quantity) {
      this.onValidationError(format('lineItems[%d].quantity', index));
      isValid = false;
    }

    return isValid;
  }

  getProductId(product) {
    product = product || {};
    let productId;
    if (type(product) === 'object') {
      productId = product.id;
    } else {
      productId = product;
    }
    return productId;
  }

  onError(err) {
    throwError('external_error', format('Retail Rocket integration error: "%s"', err));
  }

  onValidationError(variableName) {
    throwError(
        'validation_error',
        format('Retail Rocket integration error: DDL or event variable "%s" is not defined or empty', variableName)
    );
  }

  /**
   * Can be stubbed in unit tests
   * @returns string
   */
  getQueryString() {
    return window.location.search;
  }
}

export default RetailRocket;
