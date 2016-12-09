import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

function lineItemsToSociomanticsItems(lineItems) {
  const products = [];
  for (let i = 0, length = lineItems.length; i < length; i++) {
    const lineItem = lineItems[i];
    if (lineItem && lineItem.product) {
      const productId = lineItem.product.id || lineItem.product.skuCode;
      if (productId) {
        const product = {
          identifier: productId,
          amount: lineItem.product.unitSalePrice || lineItem.product.unitPrice || 0,
          quantity: lineItem.quantity || 1,
          currency: lineItem.product.currency || ''
        };
        products.push(product);
      }
    }
  }
  return products;
}

class Sociomantic extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      region: '',
      adpanId: '',
      prefix: ''
    }, options);
    super(digitalData, optionsWithDefaults);
  }

  loadTrackingScript() {
    const adpanId = this.getOption('adpanId');
    if (window.sociomantic &&
        window.sociomantic.sonar &&
        window.sociomantic.sonar.adv[adpanId])
    {
      window.sociomantic.sonar.adv[adpanId].enable();
    } else {
      const protocol = 'https:' === document.location.protocol ? 'https://' : 'http://';
      const region = `${this.getOption('region')}-` || '';
      const scriptURL = region + 'sonar.sociomantic.com/js/2010-07-01/adpan/' + this.getOption('adpanId');
      const src = protocol + scriptURL;

      this.addTag({
        type: 'script',
        attr: {
          type: 'text/javascript',
          async: true,
          src: src
        },
      });
    }

    this.onLoad();
  }

  isLoaded() {
    return !!(window.sociomantic && window.sociomantic.sonar);
  }

  reset() {
    deleteProperty(window, 'sociomantic');
  }

  getEnrichableEventProps(event) {
    let enrichableProps = [];
    switch (event.name) {
      case 'Viewed Product Detail':
        enrichableProps = [
          'product',
        ];
        break;
      case 'Viewed Product Category':
        enrichableProps = [
          'listing.category',
        ];
        break;
      case 'Searched Products':
        enrichableProps = [
          'listing.category',
        ];
        break;
      case 'Viewed Cart':
        enrichableProps = [
          'cart.lineItems',
        ];
        break;
      case 'Completed Transaction':
        enrichableProps = [
          'transaction',
        ];
        break;
      case 'Subscribed':
        enrichableProps = [
          'user.userId',
        ];
        break;
      default:
        // do nothing
    }

    return enrichableProps;
  }

  trackEvent(event) {
    const methods = {
      'Viewed Product Detail': 'onViewedProductDetail',
      'Viewed Product Category': 'onViewedProductListing',
      'Viewed Cart': 'onViewedCart',
      'Completed Transaction': 'onCompletedTransaction',
      'Subscribed': 'onSubscribed',
      'Searched Products': 'onViewedProductListing',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedProductDetail(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'product';
    const product = event.product;
    if (product) {
      if (product.id || product.skuCode) {
        window[trackingObjectName] = {
          identifier: product.id || product.skuCode
        }
      }
    }

    if (product && product.id) {
      if (product.stock) {
        window[trackingObjectName].quantity = product.stock;
      }
      if (product.name) {
        window[trackingObjectName].fn = product.name;
      }
      if (product.description) {
        window[trackingObjectName].description = product.description;
      }
      if (product.category) {
        window[trackingObjectName].category = product.category;
      }
      if (product.manufacturer) {
        window[trackingObjectName].brand = product.manufacturer;
      }
      if (product.unitSalePrice) {
        window[trackingObjectName].price = product.unitSalePrice;
      }
      if (product.unitPrice) {
        window[trackingObjectName].amount = product.unitPrice;
      }
      if (product.currency) {
        window[trackingObjectName].currency = product.currency;
      }
      if (product.url) {
        window[trackingObjectName].url = product.url;
      }
      if (product.imageUrl) {
        window[trackingObjectName].photo = product.imageUrl;
      }

      loadTrackingScript();
    }
  }

  onViewedProductListing(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'product';
    const listing = event.listing;
    if (listing && listing.category) {
      window[trackingObjectName] = {
        category: listing.category
      };
      loadTrackingScript();
    }
  }

  onViewedCart(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'basket';
    const cart = event.cart;
    if (cart && cart.lineItems) {
      const products = lineItemsToSociomanticsItems(cart.lineItems);
      window[trackingObjectName] = {
        products: products
      }
      loadTrackingScript();
    }
  }

  onCompletedTransaction(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectSaleName = prefix + 'sale';
    const trackingObjectBasketName = prefix + 'basket';
    const transaction = event.transaction;

    window[trackingObjectSaleName] = {
      confirmed: true
    }

    if (transaction && transaction.lineItems) {
      const products = lineItemsToSociomanticsItems(transaction.lineItems);
      window[trackingObjectBasketName] = {
        products: products,
        transaction: transaction.orderId,
        amount: transaction.total,
        currency: transaction.currency
      };
      loadTrackingScript();
    }
  }

  onSubscribed(event) {
    const prefix = this.getOption('prefix');
    const trackingObjectName = prefix + 'lead';
    const user = event.user;
    if (user && user.userId) {
      window[trackingObjectName] = {
        identifier: user.userId
      };
      loadTrackingScript();
    }
  }
}

export default Sociomantic;
