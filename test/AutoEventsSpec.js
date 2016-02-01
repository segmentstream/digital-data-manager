import assert from 'assert';
import deleteProperty from './../src/functions/deleteProperty.js';
import AutoEvents from './../src/AutoEvents.js';

describe('AutoEvents', () => {

  let _digitalData;
  let _ddListener;
  let _autoEvents;

  before(() => {
    _autoEvents = new AutoEvents();
  });

  describe('#onInitialize', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
      _ddListener = [];
      _autoEvents.setDigitalData(_digitalData);
      _autoEvents.setDDListener(_ddListener);
    });

    it('should add DDL change listeners', () => {
      _autoEvents.onInitialize();
      assert.ok(_ddListener.length == 3);
      assert.ok(_ddListener[0][1] === 'change:page');
      assert.ok(_ddListener[1][1] === 'change:product.id');
      assert.ok(_ddListener[2][1] === 'change:transaction.orderId');
    });

  });

  describe('#fireViewedPage', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'home'
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Viewed Page" event', () => {
      _autoEvents.fireViewedPage();
      assert.ok(_digitalData.events[0].name === 'Viewed Page');
      assert.ok(_digitalData.events[0].page.type === 'home');
    });

    it('should fire only "Viewed Page" event', () => {
      _autoEvents.onInitialize();
      assert.ok(_digitalData.events[0].name === 'Viewed Page');
      assert.ok(_digitalData.events[0].page.type === 'home');
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
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Viewed Product Category" event', () => {
      _autoEvents.fireViewedProductCategory();
      assert.ok(_digitalData.events[0].name === 'Viewed Product Category');
      assert.ok(_digitalData.events[0].page.type === 'category');
    });

    it('should fire "Viewed Product Category" and "Viewed Page" event', () => {
      _autoEvents.onInitialize();
      assert.ok(_digitalData.events[1].name === 'Viewed Product Category');
      assert.ok(_digitalData.events[1].page.type === 'category');
      assert.ok(_digitalData.events.length === 2);
    });

  });

  describe('#fireViewedProductDetail', () => {

    beforeEach(() => {
      _digitalData = {
        page: {
          type: 'product'
        },
        product: {
          id : '123'
        },
        events: []
      };
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Viewed Product Detail" event', () => {
      _autoEvents.fireViewedProductDetail();
      assert.ok(_digitalData.events[0].name === 'Viewed Product Detail');
      assert.ok(_digitalData.events[0].product.id === '123');
    });

    it('should fire "Viewed Product Detail" and "Viewed Page" event', () => {
      _autoEvents.onInitialize();
      assert.ok(_digitalData.events[1].name === 'Viewed Product Detail');
      assert.ok(_digitalData.events[1].product.id === '123');
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
      _autoEvents.setDigitalData(_digitalData);
    });

    it('should fire "Completed Transaction" event', () => {
      _autoEvents.fireCompletedTransaction();
      assert.ok(_digitalData.events[0].name === 'Completed Transaction');
      assert.ok(_digitalData.events[0].transaction.orderId === '123');
    });

    it('should not fire "Completed Transaction" for returning transactions', () => {
      _digitalData.transaction.isReturning = true;
      _autoEvents.onInitialize();
      assert.ok(_digitalData.events.length === 1);
    });

    it('should not fire "Completed Transaction" if transaction object doesn\'t present', () => {
      deleteProperty(_digitalData, 'transaction');
      _autoEvents.onInitialize();
      assert.ok(_digitalData.events.length === 1);
    });

    it('should fire "Completed Transaction" and "Viewed Page" event', () => {
      _autoEvents.onInitialize();
      assert.ok(_digitalData.events[1].name === 'Completed Transaction');
      assert.ok(_digitalData.events[1].transaction.orderId === '123');
      assert.ok(_digitalData.events.length === 2);
    });

  });

});