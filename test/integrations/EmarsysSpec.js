import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import MyTarget from './../../src/integrations/MyTarget.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Emarsys', () => {

  let myTarget;
  const options = {
    counterId: '123',
  };

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    };
    myTarget = new MyTarget(window.digitalData, options);
    ddManager.addIntegration('MyTarget', myTarget);
  });

  afterEach(() => {
    myTarget.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(myTarget, 'load');
    });

    afterEach(function () {
      myTarget.load.restore();
    });

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.equal(options.counterId, myTarget.getOption('counterId'));
        assert.equal(options.listProperty, myTarget.getOption('listProperty'));
        assert.deepEqual(options.listPropertyMapping, myTarget.getOption('listPropertyMapping'));
        assert.equal('script', myTarget.getTag().type);
        assert.equal(myTarget.getTag().attr.src, '//top-fwz1.mail.ru/js/code.js');
      });
    });

    describe('#getList', () => {
      it('should return default list', () => {
        assert.equal(myTarget.getList(), '1');
      });

      it('should return defined list', () => {
        myTarget.setOption('list', '5');
        assert.equal(myTarget.getList(), '5');
      });

      it('should return list defined in DDL', () => {
        window.digitalData.page.list = '5';
        myTarget.setOption('listProperty', 'page.list');
        assert.equal(myTarget.getList(), '5');
      });

      it('should return list defined in DDL using mapping', () => {
        window.digitalData.website.region = 'New York';
        myTarget.setOption('listProperty', 'website.region');
        myTarget.setOption('listPropertyMapping', {
          'New York': '5'
        });
        assert.equal(myTarget.getList(), '5');
      });
    });

    describe('#initialize', () => {
      it('should initialize mytarget queue object', () => {
        ddManager.initialize();
        assert.ok(window._tmr);
        assert.ok(window._tmr.push);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(myTarget.load.calledOnce);
      });
    });
  });

  describe('loading', function () {
    beforeEach(() => {
      sinon.stub(myTarget, 'load', () => {
        window._tmr = {
          push: function() {},
          unload: function() {}
        };
        myTarget.ready();
      });
    });

    afterEach(() => {
      myTarget.load.restore();
    });

    it('should load', function (done) {
      assert.ok(!myTarget.isLoaded());
      ddManager.once('ready', () => {
        assert.ok(myTarget.isLoaded());
        done();
      });
      ddManager.initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(myTarget, 'load', () => {
        myTarget.ready();
      });
      ddManager.once('ready', done);
      ddManager.initialize({
        autoEvents: false
      });
    });

    afterEach(function () {
      myTarget.load.restore();
    });

    describe('#onViewedPage', () => {
      it('should send pageView for every "Viewed Page" event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {},
          callback: () => {
            assert.equal(window._tmr[0].id, myTarget.getOption('counterId'));
            assert.equal(window._tmr[0].type, 'pageView');
            done();
          }
        });
      });

      it('should not send pageView event if noConflict setting is true', (done) => {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.equal(window._tmr.length, 0);
            done();
          }
        });
      });
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
            assert.equal(window._tmr.length, 2);
            assert.deepEqual(window._tmr[1], {
              type: 'itemView',
              productid: '',
              pagetype: 'home',
              totalvalue: '',
              list: myTarget.getList(),
            });
            done();
          }
        });
      });
    });

    describe('#onViewedProductCategory', () => {
      it('should send itemView event for every "Viewed Product Category" event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Content',
          callback: () => {
            assert.deepEqual(window._tmr[0], {
              type: 'itemView',
              productid: '',
              pagetype: 'category',
              totalvalue: '',
              list: myTarget.getList(),
            });
            done();
          }
        });
      });

      it('should not send itemView event if noConflict setting is true', (done) => {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Content',
          callback: () => {
            assert.equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onViewedProductDetail', () => {
      it('should send itemView event for every "Viewed Product Detail" event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            unitSalePrice: 150
          },
          callback: () => {
            assert.deepEqual(window._tmr[0], {
              type: 'itemView',
              productid: '123',
              pagetype: 'product',
              totalvalue: 150,
              list: myTarget.getList(),
            });
            done();
          }
        });
      });


      it('should not send itemView event if noConflict option is true', (done) => {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: () => {
            assert.equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onViewedCart', () => {
      it('should send itemView event if user visits cart page', (done) => {
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
          ],
          total: 230
        };
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'cart'
          },
          callback: () => {
            assert.deepEqual(window._tmr[1], {
              type: 'itemView',
              productid: ['123', '234', '345', '456'],
              pagetype: 'cart',
              totalvalue: 230,
              list: myTarget.getList(),
            });
            done();
          }
        });
      });

      it('should not send itemView event if noConflict option is true', (done) => {
        myTarget.setOption('noConflict', true);
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
            assert.equal(window._tmr.length, 0);
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

      it('should send itemView event if transaction is completed', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            isFirst: true,
            lineItems: lineItems,
            total: 230,
          },
          callback: () => {
            assert.deepEqual(window._tmr[0], {
              type: 'itemView',
              productid: ['123', '234', '345', '456'],
              pagetype: 'purchase',
              totalvalue: 230,
              list: myTarget.getList(),
            });
            done();
          }
        });
      });

      it('should not send trackTransaction event if noConflict option is true', (done) => {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: () => {
            assert.equal(window._tmr.length, 0);
            done();
          }
        });
      });
    });

    describe('#onCustomEvent', () => {
      it('should send reachGoal event for any other DDL event', (done) => {
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.deepEqual(window._tmr[0], {
              id: myTarget.getOption('counterId'),
              type: 'reachGoal',
              goal: 'Subscribed'
            });
            done();
          }
        });
      });

      it('should send reachGoal event for any other DDL event event if noConflict option is true', (done) => {
        myTarget.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.deepEqual(window._tmr[0], {
              id: myTarget.getOption('counterId'),
              type: 'reachGoal',
              goal: 'Subscribed'
            });
            done();
          }
        });
      });
    });

  });
});
