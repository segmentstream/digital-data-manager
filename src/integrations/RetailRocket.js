import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty';
import { getProp } from './../functions/dotProp';
import getVarValue from './../functions/getVarValue';
import each from './../functions/each';
import type from 'component-type';

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

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
    case 'Viewed Page':
      enrichableProps = [
        'user.email',
        'user.isSubscribed',
      ];
      break;
    case 'Viewed Product Detail':
      enrichableProps = [
        'product.id',
      ];
      break;
    case 'Viewed Product Category':
      enrichableProps = [
        'listing.categoryId',
      ];
      break;
    case 'Searched Products':
      enrichableProps = [
        'listing.query',
      ];
      break;
    case 'Completed Transaction':
      enrichableProps = [
        'transaction',
      ];
      break;
    default:
      // do nothing
    }

    if (['Viewed Page', 'Subscribed'].indexOf(event.name) >= 0) {
      const settings = this.getOption('customVariables');
      each(settings, (key, variable) => {
        if (variable.type === 'digitalData') {
          enrichableProps.push(variable.value);
        }
      });
    }

    return enrichableProps;
  }

  initialize() {
    if (this.getOption('partnerId')) {
      window.rrPartnerId = this.getOption('partnerId');
      const userId = getProp(this.digitalData, this.getOption('userIdProperty'));
      if (userId) {
        window.rrPartnerUserId = userId;
      }
      window.rrApi = {};
      window.rrApiOnReady = window.rrApiOnReady || [];
      window.rrApi.pageView = window.rrApi.addToBasket =
          window.rrApi.order = window.rrApi.categoryView = window.rrApi.setEmail = window.rrApi.view =
          window.rrApi.recomMouseDown = window.rrApi.recomAddToCart = window.rrApi.search = () => {};

      this.load(this.onLoad);
    } else {
      this.onLoad();
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
      if (event.name === 'Viewed Page') {
        this.onViewedPage(event);
      } else if (event.name === 'Viewed Product Category') {
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
        this.onSubscribed(event);
      } else if (event.name === 'Searched Products') {
        this.onSearched(event.listing);
      }
    } else {
      if (event.name === 'Subscribed') {
        this.onSubscribed(event);
      }
    }
  }

  onViewedPage(event) {
    const user = event.user;
    if (user && user.email) {
      if (this.getOption('trackAllEmails') === true || user.isSubscribed === true) {
        this.onSubscribed(event);
      }
    }
  }

  onViewedProductCategory(listing) {
    listing = listing || {};
    const categoryId = listing.categoryId;
    if (!categoryId) {
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.categoryView(categoryId);
      } catch (e) {
        // do nothing
      }
    });
  }

  onViewedProductDetail(product) {
    const productId = this.getProductId(product);
    if (!productId) {
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.view(productId);
      } catch (e) {
        // do nothing
      }
    });
  }

  onAddedProduct(product) {
    const productId = this.getProductId(product);
    if (!productId) {
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.addToBasket(productId);
      } catch (e) {
        // do nothing
      }
    });
  }

  onClickedProduct(listItem) {
    if (!listItem) {
      return;
    }
    const productId = this.getProductId(listItem.product);
    if (!productId) {
      return;
    }
    const listId = listItem.listId;
    if (!listId) {
      return;
    }
    const methodName = this.getOption('listMethods')[listId];
    if (!methodName) {
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.recomMouseDown(productId, methodName);
      } catch (e) {
        // do nothing
      }
    });
  }

  onCompletedTransaction(transaction) {
    transaction = transaction || {};
    if (!this.validateTransaction(transaction)) {
      return;
    }

    let areLineItemsValid = true;
    const items = [];
    const lineItems = transaction.lineItems;
    for (let i = 0, length = lineItems.length; i < length; i++) {
      if (!this.validateTransactionLineItem(lineItems[i])) {
        areLineItemsValid = false;
        break;
      }
      const product = lineItems[i].product;
      items.push({
        id: product.id,
        qnt: lineItems[i].quantity,
        price: product.unitSalePrice || product.unitPrice,
      });
    }

    if (!areLineItemsValid) {
      return;
    }

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.order({
          transaction: transaction.orderId,
          items: items,
        });
      } catch (e) {
        // do nothing
      }
    });
  }

  onSubscribed(event) {
    const user = event.user || {};
    if (!user.email) {
      return;
    }

    const rrCustoms = {};
    const settings = this.getOption('customVariables');
    each(settings, (key, variable) => {
      let rrCustom;
      if (type(variable) === 'string') { // TODO: remove backward compatibility in later versions
        rrCustom = getProp(event, variable);
      } else {
        rrCustom = getVarValue(variable, event);
      }
      if (rrCustom !== undefined) {
        if (type(rrCustom) === 'boolean') rrCustom = rrCustom.toString();
        rrCustoms[key] = rrCustom;
      }
    });

    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.setEmail(user.email, rrCustoms);
      } catch (e) {
        // do nothing
      }
    });
  }

  onSearched(listing) {
    listing = listing || {};
    if (!listing.query) {
      return;
    }
    window.rrApiOnReady.push(() => {
      try {
        window.rrApi.search(listing.query);
      } catch (e) {
        // do nothing
      }
    });
  }

  validateTransaction(transaction) {
    let isValid = true;
    if (!transaction.orderId) {
      isValid = false;
    }

    const lineItems = transaction.lineItems;
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      isValid = false;
    }

    return isValid;
  }

  validateLineItem(lineItem) {
    let isValid = true;
    if (!lineItem.product) {
      isValid = false;
    }

    return isValid;
  }

  validateTransactionLineItem(lineItem) {
    let isValid = this.validateLineItem(lineItem);

    const product = lineItem.product;
    if (!product.id) {
      isValid = false;
    }
    if (!product.unitSalePrice && !product.unitPrice) {
      isValid = false;
    }
    if (!lineItem.quantity) {
      isValid = false;
    }

    return isValid;
  }

  getProductId(product) {
    product = product || {};
    const productId = product.id;

    return productId;
  }
}

export default RetailRocket;
