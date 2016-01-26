class AutoEvents
{
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

        // TODO: checkout step change
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
}

export default AutoEvents;
