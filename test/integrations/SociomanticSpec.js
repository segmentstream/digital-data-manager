import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import Sociomantic from './../../src/integrations/Sociomantic.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Sociomantic', () => {
  let sociomantic;
  const options = {
    region: 'eu',
    adpanId: 'aizel-ru',
    prefix: 'sonar_',
  };

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      product: {},
      listing: {},
      cart: {},
      transaction: {},
      user: {},
      events: [],
    };
    sociomantic = new Sociomantic(window.digitalData, options);
    ddManager.addIntegration('Sociomantic', sociomantic);
  });

  afterEach(() => {
    sociomantic.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.equal(options.region, sociomantic.getOption('region'));
        assert.equal(options.adpanId, sociomantic.getOption('adpanId'));
        assert.equal(options.prefix, sociomantic.getOption('prefix'));
      });
    });
  });

  describe('after loading', () => {
    describe('#onViewedPage', () => {
      beforeEach((done) => {
        window[options.prefix + 'customer'] = undefined;
        window[options.prefix + 'basket'] = undefined;
        ddManager.once('ready', () => {
          done();
        });
        ddManager.initialize({
          autoEvents: false,
        });
      });


      it('should set customer object if user visits any pages', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          user: {
            userId: '55123',
          },
          callback: () => {
            assert.deepEqual(window[options.prefix + 'customer'], {identifier: '55123'});
            done();
          },
        });
      });

      it('should not set customer object if user is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(!window[options.prefix + 'customer']);
            done();
          },
        });
      });

      it('should not set customer object if user ID is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          user: {},
          callback: () => {
            assert.ok(!window[options.prefix + 'customer']);
            done();
          },
        });
      });

      it('should set global basket object if user visits any page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          cart: {
            lineItems: [
              { product: { id: '34343877', currency: 'RUB', unitSalePrice: 10990, unitPrice: 12990 }, quantity: 1 },
              { product: { id: '34343872', currency: 'RUB', unitSalePrice: 11990, unitPrice: 13990 }, quantity: 2 },
            ],
          },
          callback: () => {
            assert.deepEqual(window[options.prefix + 'basket'], {
              products: [
                { identifier: '34343877', amount: 10990, currency: 'RUB', quantity: 1 },
                { identifier: '34343872', amount: 11990, currency: 'RUB', quantity: 2 },
              ],
            });
            done();
          },
        });
      });

      it('should not set global basket object if cart is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(!window[options.prefix + 'basket']);
            done();
          },
        });
      });

      it('should not set global basket object if cart lineitems is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          cart: {},
          callback: () => {
            assert.ok(!window[options.prefix + 'basket']);
            done();
          },
        });
      });
    });

    describe('#onViewedProductDetail', () => {
      beforeEach((done) => {
        window[options.prefix + 'product'] = undefined;
        ddManager.once('ready', () => {
          done();
        });
        ddManager.initialize({
          autoEvents: false,
        });
      });


      it('should set product object if user visits product detail page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
          },
          callback: () => {
            assert.deepEqual(window[options.prefix + 'product'], {identifier: '123'});
            done();
          },
        });
      });

      it('should not set product object if product is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.ok(!window[options.prefix + 'product']);
            done();
          },
        });
      });

      it('should not set product object if product ID is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {},
          callback: () => {
            assert.ok(!window[options.prefix + 'product']);
            done();
          },
        });
      });
    });

    describe('#onViewedProductListing', () => {
      beforeEach((done) => {
        window[options.prefix + 'product'] = undefined;
        ddManager.once('ready', () => {
          done();
        });
        ddManager.initialize({
          autoEvents: false,
        });
      });

      it('should set global product object if user visits product category page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          listing: {
            category: [ 'shoes', 'female' ],
          },
          callback: () => {
            assert.deepEqual(window[options.prefix + 'product'], { category: [ 'shoes', 'female' ] });
            done();
          },
        });
      });

      it('should not set global product object if listing is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          callback: () => {
            assert.ok(!window[options.prefix + 'product']);
            done();
          },
        });
      });

      it('should not set product object if listing category is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          listing: {},
          callback: () => {
            assert.ok(!window[options.prefix + 'product']);
            done();
          },
        });
      });

      it('should set global product object if user search products', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            category: [ 'shoes', 'female' ],
          },
          callback: () => {
            assert.deepEqual(window[options.prefix + 'product'], { category: [ 'shoes', 'female' ] });
            done();
          },
        });
      });

      it('should not set global product object if listing is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          callback: () => {
            assert.ok(!window[options.prefix + 'product']);
            done();
          },
        });
      });

      it('should not set product object if listing category is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {},
          callback: () => {
            assert.ok(!window[options.prefix + 'product']);
            done();
          },
        });
      });
    });

    describe('#onCompletedTransaction', () => {
      beforeEach((done) => {
        window[options.prefix + 'basket'] = undefined;
        window[options.prefix + 'sale'] = undefined;
        ddManager.once('ready', () => {
          done();
        });
        ddManager.initialize({
          autoEvents: false,
        });
      });

      it('should set global sale object if user visits completed transaction page', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.deepEqual(window[options.prefix + 'sale'], {
              confirmed: true,
            });
            done();
          },
        });
      });

      it('should set global basket object if user visits completed transaction page', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: 'ASFASDAS12321',
            total: 2.99,
            currency: 'EUR',
            lineItems: [
              { product: { id: '34343877', currency: 'RUB', unitSalePrice: 10990, unitPrice: 12990 }, quantity: 1 },
              { product: { id: '34343872', currency: 'RUB', unitSalePrice: 11990, unitPrice: 13990 }, quantity: 2 },
            ],
          },
          callback: () => {
            assert.deepEqual(window[options.prefix + 'basket'], {
              products: [
                { identifier: '34343877', amount: 10990, currency: 'RUB', quantity: 1 },
                { identifier: '34343872', amount: 11990, currency: 'RUB', quantity: 2 },
              ],
              transaction: 'ASFASDAS12321',
              amount: 2.99,
              currency: 'EUR',
            });
            done();
          },
        });
      });

      it('should not set global basket object if transaction is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          callback: () => {
            assert.ok(!window[options.prefix + 'basket']);
            done();
          },
        });
      });

      it('should not set global basket object if transaction lineitems is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {},
          callback: () => {
            assert.ok(!window[options.prefix + 'basket']);
            done();
          },
        });
      });
    });
  });
});
