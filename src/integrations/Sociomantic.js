import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

function lineItemsToSociomanticsItems(lineItems) {
  const products = [];
  for (let i = 0, length = lineItems.length; i < length; i++) {
    const lineItem = lineItems[i];
    if (lineItem.product) {
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
      scriptURL: '',
      prefix: ''
    }, options);
    super(digitalData, optionsWithDefaults);

    const protocol = 'https:' === document.location.protocol ? 'https://' : 'http://';

    this.addTag({
      type: 'script',
      attr: {
        type: 'text/javascript',
        async: true,
        src: `${protocol}${options.scriptURL}`
      },
    });
  }

  initialize() {
    this.onLoad();
  }

  isLoaded() {
    return !!(window.sociomantic && window.sociomantic.sonar);
  }

  reset() {
    deleteProperty(window, 'sociomantic');
  }

  trackEvent(event) {
    const methods = {
      'Viewed Product Detail': 'onViewedProductDetail',
      'Completed Transaction': 'onCompletedTransaction',
      'Viewed Product Category': 'onViewedProductCategory',
      'Viewed Cart': 'onViewedCart',
      'Searched': 'onSearched',
      'Subscribed': 'onSubscribed',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedProductDetail(event) {
    const prefix = this.getOption('prefix');
    const objectName = prefix + 'product';
    const { product } = event.product;
    if (product) {
      window[objectName] = {
        identifier: product.id || product.skuCode || '',
        quantity: product.stock || 1,
        fn: product.name || '',
        description: product.description || '',
        category: product.category || '',
        brand: product.manufacturer || '',
        price: product.unitSalePrice || 0,
        amount: product.unitPrice || 0,
        currency: product.currency || '',
        url: product.url || '',
        photo: product.imageUrl || '',
      };
    }
  }

  onViewedCart(event) {
    const prefix = this.getOption('prefix');
    const objectName = prefix + 'basket';
    const cart = event.cart;
    if (cart && cart.lineItems) {
      const products = lineItemsToSociomanticsItems(event.cart.lineItems);
      window[objectName] = {
        products: products
      }
    }
  }

  onCompletedTransaction(event) {
    const prefix = this.getOption('prefix');
    const objectName = prefix + 'basket';
    const transaction = event.transaction;
    if (transaction) {
      const products = lineItemsToSociomanticsItems(transaction.lineItems);
      window[objectName] = {
        products: products,
        transaction: transaction.orderId,
        amount: transaction.total,
        currency: transaction.currency
      };
    }
  }

  onViewedProductCategory(event) {
    const prefix = this.getOption('prefix');
    const objectName = prefix + 'product';
    const listing = event.listing;
    if (listing) {
      window[objectName] = {
        category: event.listing.category || ''
      };
    }
  }

  onSearched(event) {
    const prefix = this.getOption('prefix');
    const objectName = prefix + 'search';
    const listing = event.listing;
    if (listing) {
      window[objectName] = {
        query: event.listing.query,
       type: 2 // 2 - retail products
      };
    }
  }

  onSubscribed(event) {
    const prefix = this.getOption('prefix');
    const objectName = prefix + 'lead';
    const user = event.user;
    if (user) {
      window[objectName] = {
        identifier: event.user.userId || ''
      };
    }
  }
}

export default Sociomantic;
