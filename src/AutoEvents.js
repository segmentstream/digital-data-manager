import DOMComponentsTracking from './DOMComponentsTracking.js';
import type from 'component-type';

class AutoEvents
{
  constructor(options) {
    this.options = Object.assign({
      trackDOMComponents: false,
    }, options);
  }

  setDigitalData(digitalData) {
    this.digitalData = digitalData;
  }

  setDDListener(ddListener) {
    this.ddListener = ddListener;
  }

  onInitialize() {
    if (this.digitalData) {
      this.fireViewedPage();
      this.fireViewedProductCategory();
      this.fireViewedProductDetail();
      this.fireCompletedTransaction();
      this.fireSearched();

      if (this.ddListener) {
        this.ddListener.push(['on', 'change:page', (newPage, oldPage) => {
          this.onPageChange(newPage, oldPage);
        }]);

        this.ddListener.push(['on', 'change:product.id', (newProductId, oldProductId) => {
          this.onProductChange(newProductId, oldProductId);
        }]);

        this.ddListener.push(['on', 'change:transaction.orderId', (newOrderId, oldOrderId) => {
          this.onTransactionChange(newOrderId, oldOrderId);
        }]);
      }

      const trackDOMComponents = this.options.trackDOMComponents;
      if (!!window.jQuery && trackDOMComponents !== false) {
        const options = {};
        if (type(trackDOMComponents) === 'object') {
          options.maxWebsiteWidth = trackDOMComponents.maxWebsiteWidth;
        }
        this.domComponentsTracking = new DOMComponentsTracking(options);
        this.domComponentsTracking.initialize();
      }
    }
  }

  onPageChange(newPage, oldPage) {
    if (String(newPage.pageId) !== String(oldPage.pageId) || newPage.url !== oldPage.url ||
        newPage.type !== oldPage.type || newPage.breadcrumb !== oldPage.breadcrumb ||
        String(newPage.categoryId) !== String(oldPage.categoryId)
    ) {
      this.fireViewedPage();
      this.fireViewedProductCategory();
      this.fireSearched();
    }
  }

  onProductChange(newProductId, oldProductId) {
    if (newProductId !== oldProductId) {
      this.fireViewedProductDetail();
    }
  }

  onTransactionChange(newOrderId, oldOrderId) {
    if (newOrderId !== oldOrderId) {
      this.fireCompletedTransaction();
    }
  }

  fireViewedPage(page) {
    page = page || this.digitalData.page;
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Page',
      category: 'Content',
      page: page,
      nonInteraction: true,
    });
  }

  fireViewedProductCategory(page) {
    page = page || this.digitalData.page || {};
    if (page.type !== 'category') {
      return;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Product Category',
      category: 'Ecommerce',
      page: page,
      nonInteraction: true,
    });
  }

  fireViewedProductDetail(product) {
    product = product || this.digitalData.product;
    if (!product) {
      return;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Viewed Product Detail',
      category: 'Ecommerce',
      product: product,
      nonInteraction: true,
    });
  }

  fireCompletedTransaction(transaction) {
    transaction = transaction || this.digitalData.transaction;
    if (!transaction || transaction.isReturning === true) {
      return;
    }
    this.digitalData.events.push({
      enrichEventData: false,
      name: 'Completed Transaction',
      category: 'Ecommerce',
      transaction: transaction,
    });
  }

  fireSearched(listing) {
    listing = listing || this.digitalData.listing;
    if (!listing || !listing.query) {
      return;
    }
    const event = {
      enrichEventData: false,
      name: 'Searched',
      category: 'Content',
      query: listing.query,
    };
    if (listing.resultCount) event.resultCount = listing.resultCount;
    this.digitalData.events.push(event);
  }
}

export default AutoEvents;
