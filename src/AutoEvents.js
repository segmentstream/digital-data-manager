class AutoEvents
{
  constructor(digitalData) {
    this.digitalData = digitalData;
  }

  fire() {
    this.fireViewedPage();

    if (this.digitalData.page) {
      if (this.digitalData.page.type === 'category') {
        this.fireViewedProductCategory();
      }

      if (this.digitalData.page.type === 'product') {
        this.fireViewedProductDetail();
      }

      if (this.digitalData.page.type === 'cart' || this.digitalData.page.type === 'checkout') {
        this.fireViewedCheckoutStep();
      }
    }

    if (this.digitalData.transaction && this.digitalData.transaction.isReturning !== true) {
      this.fireCompletedTransaction();
    }

    if (this.digitalData.listing) {
      this.fireViewedProducts(this.digitalData.listing);
    }

    if (this.digitalData.recommendation) {
      this.fireViewedProducts(this.digitalData.recommendation);
    }

    if (this.digitalData.campaigns) {
      this.fireViewedCampaigns(this.digitalData.campaigns);
    }
  }

  fireViewedProducts(listing) {
    if (listing.items && listing.items.length > 0) {
      const items = [];
      for (const product of listing.items) {
        if (product.wasViewed) {
          items.push(product.id);
        }
      }

      const event = {
        updateDigitalData: false,
        name: 'Viewed Product',
        category: 'Ecommerce',
        items: items,
      };

      if (listing.listName) {
        event.listName = listing.listName;
      }

      this.digitalData.events.push(event);
    }
  }

  fireViewedCampaigns(campaigns) {
    if (campaigns.length > 0) {
      const viewedCampaigns = [];
      for (const campaign of campaigns) {
        if (campaign.wasViewed) {
          viewedCampaigns.push(campaign.id);
        }
      }
      this.digitalData.events.push({
        updateDigitalData: false,
        name: 'Viewed Campaign',
        category: 'Promo',
        campaigns: viewedCampaigns,
      });
    }
  }

  fireViewedPage() {
    this.digitalData.events.push({
      updateDigitalData: false,
      name: 'Viewed Page',
      category: 'Content',
    });
  }

  fireViewedProductCategory() {
    this.digitalData.events.push({
      updateDigitalData: false,
      name: 'Viewed Product Category',
      category: 'Ecommerce',
    });
  }

  fireViewedProductDetail() {
    this.digitalData.events.push({
      updateDigitalData: false,
      name: 'Viewed Product Detail',
      category: 'Ecommerce',
    });
  }

  fireViewedCheckoutStep() {
    this.digitalData.events.push({
      updateDigitalData: false,
      name: 'Viewed Checkout Step',
      category: 'Ecommerce',
    });
  }

  fireCompletedTransaction() {
    this.digitalData.events.push({
      updateDigitalData: false,
      name: 'Completed Transaction',
      category: 'Ecommerce',
    });
  };
}

export default AutoEvents;
