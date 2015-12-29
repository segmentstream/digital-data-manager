import assert from 'assert';
import deleteProperty from './../src/functions/deleteProperty.js';
import AutoEvents from './../src/AutoEvents.js';

describe('AutoEvents', () => {

  let _digitalData;

  describe('#fireViewedPage', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
    });

    it('should fire "Viewed Page" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireViewedPage();
      assert.ok(_digitalData.events[0].name === 'Viewed Page');
    });

    it('should fire only "Viewed Page" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[0].name === 'Viewed Page');
      assert.ok(_digitalData.events.length === 1);
    });
  });


  describe('#fireViewedProductCategory', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'category'
        },
        events: []
      };
    });

    it('should fire "Viewed Product Category" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireViewedProductCategory();
      assert.ok(_digitalData.events[0].name === 'Viewed Product Category');
    });

    it('should fire "Viewed Product Category" and "Viewed Page" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[1].name === 'Viewed Product Category');
      assert.ok(_digitalData.events.length === 2);
    });

  });

  describe('#fireViewedProductDetail', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'product'
        },
        events: []
      };
    });

    it('should fire "Viewed Product Detail" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireViewedProductDetail();
      assert.ok(_digitalData.events[0].name === 'Viewed Product Detail');
    });

    it('should fire "Viewed Product Detail" and "Viewed Page" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[1].name === 'Viewed Product Detail');
      assert.ok(_digitalData.events.length === 2);
    });

  });


  describe('#fireCompletedTransaction', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'confirmation'
        },
        transaction: {
          orderId: '123',
          total: 100
        },
        events: []
      };
    });

    it('should fire "Completed Transaction" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireCompletedTransaction();
      assert.ok(_digitalData.events[0].name === 'Completed Transaction');
    });

    it('should not fire "Completed Transaction" for returning transactions', () => {
      _digitalData.transaction.isReturning = true;
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events.length === 1);
    });

    it('should not fire "Completed Transaction" if transaction object doesn\'t present', () => {
      deleteProperty(_digitalData, 'transaction');
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events.length === 1);
    });

    it('should fire "Completed Transaction" and "Viewed Page" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[1].name === 'Completed Transaction');
      assert.ok(_digitalData.events.length === 2);
    });

  });


  describe('#fiewViewedProducts', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        listing: {
          items: [
            {
              id: '123',
              wasViewed: true,
            },
            {
              id: '234',
              wasViewed: false,
            },
          ]
        },
        recommendation: {
          items: [
            {
              id: '345',
              wasViewed: true,
            },
            {
              id: '456',
              wasViewed: false,
            },
          ]
        },
        events: [],
      };
    });

    it('should fire "Viewed Product" event for products inside "listing" object where wasViewed == true', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireViewedProducts(_digitalData.listing);
      assert.ok(_digitalData.events[0].name === 'Viewed Product');
      assert.ok(_digitalData.events[0].items.length === 1);
      assert.ok(_digitalData.events.length === 1);
    });

    it('should fire "Viewed Product" event for products inside "recommendation" object where wasViewed == true', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireViewedProducts(_digitalData.recommendation);
      assert.ok(_digitalData.events[0].name === 'Viewed Product');
      assert.ok(_digitalData.events[0].items.length === 1);
      assert.ok(_digitalData.events.length === 1);
    });

    it('should fire "Viewed Product" event for "listing" and "recommendation" objects and "Viewed Page" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[1].name === 'Viewed Product');
      assert.ok(_digitalData.events[1].items.length === 1);
      assert.ok(_digitalData.events[2].name === 'Viewed Product');
      assert.ok(_digitalData.events[2].items.length === 1);
      assert.ok(_digitalData.events.length === 3);
    });

  });


  describe('#fiewViewedCampaigns', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        campaigns: [
          {
            id: '123',
            wasViewed: true,
          },
          {
            id: '234',
            wasViewed: false,
          },
        ],
        events: [],
      };
    });

    it('should fire "Viewed Campaign" event for campaigns where wasViewed == true', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireViewedCampaigns(_digitalData.campaigns);
      assert.ok(_digitalData.events[0].name === 'Viewed Campaign');
      assert.ok(_digitalData.events[0].campaigns.length === 1);
      assert.ok(_digitalData.events.length === 1);
    });

    it('should fire "Viewed Campaign" and "Viewed Page" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[1].name === 'Viewed Campaign');
      assert.ok(_digitalData.events[1].campaigns.length === 1);
      assert.ok(_digitalData.events.length === 2);
    });

  });


  describe('#fireViewedCheckoutStep', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'cart'
        },
        events: []
      };
    });

    it('should fire "Viewed Checkout Step" event', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fireViewedCheckoutStep();
      assert.ok(_digitalData.events[0].name === 'Viewed Checkout Step');
    });

    it('should fire "Viewed Checkout Step" and "Viewed Page" event for page.type === "cart"', () => {
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[1].name === 'Viewed Checkout Step');
      assert.ok(_digitalData.events.length === 2);
    });

    it('should fire "Viewed Checkout Step" and "Viewed Page" event for page.type === "checkout"', () => {
      _digitalData.page.type = 'checkout';
      const autoEvents = new AutoEvents(_digitalData);
      autoEvents.fire();
      assert.ok(_digitalData.events[1].name === 'Viewed Checkout Step');
      assert.ok(_digitalData.events.length === 2);
    });
  });

});