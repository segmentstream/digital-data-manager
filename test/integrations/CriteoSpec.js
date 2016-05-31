import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import Criteo from './../../src/integrations/Criteo.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Criteo', () => {

  let criteo;
  const options = {
    account: '123',
  };

  beforeEach(() => {
    window.digitalData = {
      page: {},
      user: {},
      events: []
    };
    criteo = new Criteo(window.digitalData, options);
    ddManager.addIntegration('Criteo', criteo);
  });

  afterEach(() => {
    criteo.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(criteo, 'load');
    });

    afterEach(function () {
      criteo.load.restore();
    });

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.equal(options.account, criteo.getOption('account'));
        assert.equal(undefined, criteo.getOption('deduplication'));
        assert.equal('script', criteo.getTag().type);
        assert.equal(criteo.getTag().attr.src, '//static.criteo.net/js/ld/ld.js');
      });
    });

    describe('#initialize', () => {
      it('should initialize criteo queue object', () => {
        ddManager.initialize();
        assert.ok(window.criteo_q);
        assert.ok(window.criteo_q.push);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(criteo.load.calledOnce);
      });

      it('should define account id', () => {
        ddManager.initialize();
        assert.deepEqual(window.criteo_q[0], { event: 'setAccount', account: options.account });
      });

      it('should define "d" site type if other option is not specified', () => {
        ddManager.initialize();
        assert.deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "d" site type if digitalData.page.siteType is not one of: "desktop", "tablet" or "mobile"', () => {
        window.digitalData.page.siteType = "test";
        ddManager.initialize();
        assert.deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "d" site type if digitalData.page.siteType is "desktop"', () => {
        window.digitalData.page.siteType = "desktop";
        ddManager.initialize();
        assert.deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "d" });
      });

      it('should define "t" site type if digitalData.page.siteType is "tablet"', () => {
        window.digitalData.page.siteType = "tablet";
        ddManager.initialize();
        assert.deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "t" });
      });

      it('should define "m" site type if digitalData.page.siteType is "mobile"', () => {
        window.digitalData.page.siteType = "mobile";
        ddManager.initialize();
        assert.deepEqual(window.criteo_q[1], { event: 'setSiteType', type: "m" });
      });

      it('should set email if digitalData.user.email is defined', () => {
        window.digitalData.user.email = 'test@driveback.ru';
        ddManager.initialize();
        assert.deepEqual(window.criteo_q[2], { event: 'setEmail', email: window.digitalData.user.email });
      });


    });
  });

  describe('loading', function () {
    beforeEach(() => {
      sinon.stub(criteo, 'load', () => {
        window.criteo_q = {
          push: function() {}
        };
        criteo.ready();
      });
    });

    afterEach(() => {
      criteo.load.restore();
    });

    it('should load', function (done) {
      assert.ok(!criteo.isLoaded());
      ddManager.once('ready', () => {
        assert.ok(criteo.isLoaded());
        done();
      });
      ddManager.initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(criteo, 'load', () => {
        criteo.ready();
      });
      ddManager.once('ready', done);
      ddManager.initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      criteo.load.restore();
    });

    it('should set email if digitalData.user.email is changed at any time', (done) => {
      assert.ok(!window.criteo_q[2]);
      window.digitalData.user.email = 'test@driveback.ru';
      setTimeout(() => {
        assert.deepEqual(window.criteo_q[2], {event: 'setEmail', email: window.digitalData.user.email});
        done();
      }, 101);
    });

    describe('#onViewedHome', () => {
      it('should send viewHome event if user visits home page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {event: 'viewHome'})
            done();
          }
        });
      });

      it('should not send viewHome event if user visits other pages', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'product'
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewHome event if noConflict setting is true', (done) => {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onViewedProductListing', () => {
      it('should send viewList event if user visits listing page with more than 3 items', (done) => {
        window.digitalData.listing = {
          items: [
            {
              id: '123'
            },
            {
              id: '234'
            },
            {
              id: '345'
            },
            {
              id: '456'
            }
          ]
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {event: 'viewList', item: ['123', '234', '345']});
            done();
          }
        });
      });

      it('should send viewList event if user visits listing page with less than 3 items', (done) => {
        window.digitalData.listing = {
          items: [
            {
              id: '123'
            },
            {
              id: '234'
            }
          ]
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {event: 'viewList', item: ['123', '234']});
            done();
          }
        });
      });

      it('should not send viewList event if digitalData.listing obejct is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewList event if noConflict setting is true', (done) => {
        criteo.setOption('noConflict', true);
        window.digitalData.listing = {
          items: [
            {
              id: '123'
            },
          ]
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onViewedProductDetail', () => {
      it('should send viewItem event if user visits product detail page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {event: 'viewItem', item: '123'});
            done();
          }
        });
      });

      it('should not send viewItem event if product ID is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewItem event if noConflict option is true', (done) => {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onViewedCart', () => {
      it('should send viewBasket event if user visits cart page', (done) => {
        window.digitalData.cart = {
          lineItems: [
            {
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 1
            },
            {
              product: {
                id: '234',
                unitPrice: 100,
                unitSalePrice: 50
              },
              quantity: 2
            },
            {
              product: {
                id: '345',
                unitPrice: 30
              }
            },
            {
              product: {
                id: '456',
              }
            },
            {
              product: {}
            }
          ]
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'cart'
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {event: 'viewBasket', item: [
              { id: '123', price: 100, quantity: 1 },
              { id: '234', price: 50, quantity: 2 },
              { id: '345', price: 30, quantity: 1 },
              { id: '456', price: 0, quantity: 1 }
            ]});
            done();
          }
        });
      });

      it('should not send viewBasket event if cart object is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'cart'
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewBasket event if cart is empty', (done) => {
        window.digitalData.cart = {
          lineItems: []
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'cart'
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send viewBasket event if noConflict option is true', (done) => {
        criteo.setOption('noConflict', true);
        window.digitalData.cart = {
          lineItems: [
            {
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 1
            }
          ]
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'cart'
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onCompletedTransaction', () => {
      const lineItems = [
        {
          product: {
            id: '123',
            unitSalePrice: 100
          },
          quantity: 1
        },
        {
          product: {
            id: '234',
            unitPrice: 100,
            unitSalePrice: 50
          },
          quantity: 2
        },
        {
          product: {
            id: '345',
            unitPrice: 30
          }
        },
        {
          product: {
            id: '456',
          }
        },
        {
          product: {}
        }
      ];

      it('should send trackTransaction event if transaction is completed (new_customer = 1)', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            isFirst: true,
            lineItems: lineItems
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 1,
              deduplication: 0,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 },
                { id: '456', price: 0, quantity: 1 }
              ]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (new_customer = 0)', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            isFirst: false,
            lineItems: lineItems
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 0,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 },
                { id: '456', price: 0, quantity: 1 }
              ]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (deduplication = 1)', (done) => {
        criteo.setOption('deduplication', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 1,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 },
                { id: '456', price: 0, quantity: 1 }
              ]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (deduplication = 1)', (done) => {
        window.digitalData.context = {
          campaign: {
            source: 'CriTeO'
          }
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 1,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 },
                { id: '456', price: 0, quantity: 1 }
              ]
            });
            done();
          }
        });
      });

      it('should send trackTransaction event if transaction is completed (deduplication = 0)', (done) => {
        criteo.setOption('deduplication', false);
        window.digitalData.context = {
          campaign: {
            name: 'CriTeO'
          }
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], {
              event: 'trackTransaction',
              id: '123',
              new_customer: 0,
              deduplication: 0,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 },
                { id: '456', price: 0, quantity: 1 }
              ]
            });
            done();
          }
        });
      });

      it('should not send trackTransaction event if transaction object is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send trackTransaction event if transaction object has no LineItems', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            lineItems: []
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });

      it('should not send trackTransaction event if noConflict option is true', (done) => {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: () => {
            assert.ok(!window.criteo_q[2]);
            done();
          }
        });
      });
    });

    describe('#onSubscribed', () => {
      it('should set email if user email was acquired', (done) => {
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], { event: 'setEmail', email: 'test@driveback.ru' });
            done();
          }
        });
      });

      it('should set email if user email was acquired and noConflict option is true', (done) => {
        criteo.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.deepEqual(window.criteo_q[2], { event: 'setEmail', email: 'test@driveback.ru' });
            done();
          }
        });
      });
    });

  });
});
