import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import YandexMetrica from './../../src/integrations/YandexMetrica.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Yandex Metrica', () => {

  let ym;
  const options = {
    counterId: '37510050',
    clickmap: true,
    webvisor: true,
    trackLinks: false,
    trackHash: true,
    purchaseGoalId: '20185850',
    goals: {
      'Test Event': 'GOAL1'
    },
    noConflict: false,
  };

  beforeEach(() => {
    window.digitalData = {
      page: {},
      user: {},
      events: []
    };
    ym = new YandexMetrica(window.digitalData, options);
    ddManager.addIntegration('YandexMetrica', ym);
  });

  afterEach(() => {
    ym.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(ym, 'load');
    });

    afterEach(function () {
      ym.load.restore();
    });

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.equal(options.counterId, ym.getOption('counterId'));
        assert.equal(options.clickmap, ym.getOption('clickmap'));
        assert.equal(options.webvisor, ym.getOption('webvisor'));
        assert.equal(options.trackLinks, ym.getOption('trackLinks'));
        assert.equal(options.trackHash, ym.getOption('trackHash'));
        assert.equal(options.purchaseGoalId, ym.getOption('purchaseGoalId'));
        assert.deepEqual(options.goals, ym.getOption('goals'));
        assert.equal('script', ym.getTag().type);
        assert.equal(ym.getTag().attr.src, '//mc.yandex.ru/metrika/watch.js');
      });
    });

    describe('#initialize', () => {
      it('should initialize yandex metrica queue object', () => {
        ddManager.initialize();
        assert.ok(window.yandex_metrika_callbacks);
        assert.ok(window.yandex_metrika_callbacks.push);
        assert.ok(window.yandex_metrika_callbacks.length, 1);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(ym.load.calledOnce);
      });
    });
  });

  describe('loading', function () {
    beforeEach(() => {
      sinon.stub(ym, 'load', () => {
        window.Ya = {};
        window.Ya.Metrika = function(options) {
          assert.equal(options.id, ym.getOption('counterId'));
          assert.equal(options.clickmap, ym.getOption('clickmap'));
          assert.equal(options.webvisor, ym.getOption('webvisor'));
          assert.equal(options.trackLinks, ym.getOption('trackLinks'));
          assert.equal(options.trackHash, ym.getOption('trackHash'));
        };
        window.yandex_metrika_callbacks.pop()();
        ym.onLoad();
      });
    });

    afterEach(() => {
      ym.load.restore();
    });

    it('should load', function (done) {
      assert.ok(!ym.isLoaded());
      ddManager.once('load', () => {
        assert.ok(ym.isLoaded());
        done();
      });
      ddManager.initialize({
        sendViewedPageEvent: false
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(ym, 'load', () => {
        window.Ya = {};
        window.Ya.Metrika = function() {
          this.reachGoal = function() {};
        };
        window.yandex_metrika_callbacks.pop()();
        ym.onLoad();
      });
      ddManager.once('ready', done);
      ddManager.initialize({
        sendViewedPageEvent: false
      });
    });

    afterEach(function () {
      ym.load.restore();
    });

    describe('#onViewedProductDetail', () => {
      it('should push product detail into dataLayer (legacy DDL product.category)', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            name: 'Test Product',
            manufacturer: 'Test Brand',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            voucher: 'VOUCHER1',
            unitSalePrice: 1500,
            variant: 'Variant 1'
          },
          callback: () => {
            assert.deepEqual(window.yandexDL[0], {
              ecommerce: {
                detail: {
                  products: [
                    {
                      id: '123',
                      name: 'Test Product',
                      price: 1500,
                      brand: 'Test Brand',
                      category: 'Category 1/Subcategory 1',
                      coupon: 'VOUCHER1',
                      variant: 'Variant 1'
                    }
                  ]
                }
              }
            });
            done();
          }
        });
      });

      it('should push product detail into dataLayer', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            name: 'Test Product',
            manufacturer: 'Test Brand',
            category: ['Category 1', 'Subcategory 1'],
            voucher: 'VOUCHER1',
            unitSalePrice: 1500,
            variant: 'Variant 1'
          },
          callback: () => {
            assert.deepEqual(window.yandexDL[0], {
              ecommerce: {
                detail: {
                  products: [
                    {
                      id: '123',
                      name: 'Test Product',
                      price: 1500,
                      brand: 'Test Brand',
                      category: 'Category 1/Subcategory 1',
                      coupon: 'VOUCHER1',
                      variant: 'Variant 1'
                    }
                  ]
                }
              }
            });
            done();
          }
        });
      });

      it('should push product detail into dataLayer (digitalData)', (done) => {
        window.digitalData.product = {
          id: '123',
          name: 'Test Product',
          manufacturer: 'Test Brand',
          category: ['Category 1', 'Subcategory 1'],
          voucher: 'VOUCHER1',
          unitSalePrice: 1500,
          variant: 'Variant 1'
        };
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.deepEqual(window.yandexDL[0], {
              ecommerce: {
                detail: {
                  products: [
                    {
                      id: '123',
                      name: 'Test Product',
                      price: 1500,
                      brand: 'Test Brand',
                      category: 'Category 1/Subcategory 1',
                      coupon: 'VOUCHER1',
                      variant: 'Variant 1'
                    }
                  ]
                }
              }
            });
            done();
          }
        });
      });


      it('should not push product detail into dataLayer if product ID or product name is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            price: 1500
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });

      it('should not push product detail into dataLayer event if noConflict option is true', (done) => {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });
    });

    describe('#onAddedProduct', () => {
      it('should push added product into dataLayer', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            name: 'Test Product',
            manufacturer: 'Test Brand',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            voucher: 'VOUCHER1',
            unitSalePrice: 1500,
            variant: 'Variant 1',
          },
          quantity: 3,
          callback: () => {
            assert.deepEqual(window.yandexDL[0], {
              ecommerce: {
                add: {
                  products: [
                    {
                      id: '123',
                      name: 'Test Product',
                      price: 1500,
                      brand: 'Test Brand',
                      category: 'Category 1/Subcategory 1',
                      coupon: 'VOUCHER1',
                      variant: 'Variant 1',
                      quantity: 3
                    }
                  ]
                }
              }
            });
            done();
          }
        });
      });

      it('should not push added product into dataLayer if product ID or product name is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            price: 1500
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });

      it('should not push added product into dataLayer event if noConflict option is true', (done) => {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });
    });

    describe('#onRemovedProduct', () => {
      it('should push removed product into dataLayer', (done) => {
        window.digitalData.events.push({
          name: 'Removed Product',
          product: {
            id: '123',
            name: 'Test Product',
            manufacturer: 'Test Brand',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            voucher: 'VOUCHER1',
            unitSalePrice: 1500,
            variant: 'Variant 1',
          },
          quantity: 3,
          callback: () => {
            assert.deepEqual(window.yandexDL[0], {
              ecommerce: {
                remove: {
                  products: [
                    {
                      id: '123',
                      name: 'Test Product',
                      category: 'Category 1/Subcategory 1',
                      quantity: 3
                    }
                  ]
                }
              }
            });
            done();
          }
        });
      });

      it('should not push removed product into dataLayer if product ID or product name is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Removed Product',
          product: {
            price: 1500
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });

      it('should not push removed product into dataLayer event if noConflict option is true', (done) => {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Removed Product',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
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
            name: 'Test Product',
            unitPrice: 30
          }
        },
        {
          product: {
            unitPrice: 30
          }
        },
        {
          product: {}
        }
      ];

      it('should push purchase information into dataLayer', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            vouchers: ['VOUCHER1'],
            lineItems: lineItems,
            total: 1500
          },
          callback: () => {
            assert.deepEqual(window.yandexDL[0], {
              ecommerce: {
                purchase: {
                  actionField: {
                    id: '123',
                    goal_id: options.purchaseGoalId,
                    coupon: 'VOUCHER1',
                    revenue: 1500
                  },
                  products: [
                    {
                      id: '123',
                      price: 100,
                      quantity: 1
                    },
                    {
                      id: '234',
                      price: 50,
                      quantity: 2
                    },
                    {
                      name: 'Test Product',
                      price: 30,
                      quantity: 1
                    },
                  ]
                }
              }
            });
            done();
          }
        });
      });

      it('should push purchase information into dataLayer (digitalData)', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          vouchers: ['VOUCHER1'],
          lineItems: lineItems,
          total: 1500
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.deepEqual(window.yandexDL[0], {
              ecommerce: {
                purchase: {
                  actionField: {
                    id: '123',
                    goal_id: options.purchaseGoalId,
                    coupon: 'VOUCHER1',
                    revenue: 1500
                  },
                  products: [
                    {
                      id: '123',
                      price: 100,
                      quantity: 1
                    },
                    {
                      id: '234',
                      price: 50,
                      quantity: 2
                    },
                    {
                      name: 'Test Product',
                      price: 30,
                      quantity: 1
                    },
                  ]
                }
              }
            });
            done();
          }
        });
      });

      it('should not purchase information into dataLayer if transaction object is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });

      it('should not purchase information into dataLayer if transaction object is no orderId', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            lineItems: [
              {
                product: {
                  id: '123',
                  unitSalePrice: 100
                },
                quantity: 1
              },
            ]
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });

      it('should not send trackTransaction event if noConflict option is true', (done) => {
        ym.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            lineItems: lineItems
          },
          callback: () => {
            assert.ok(!window.yandexDL[0]);
            done();
          }
        });
      });
    });

    describe('Custom Goal', () => {
      it('should track custom event as a goal', (done) => {
        sinon.stub(ym.yaCounter, 'reachGoal');
        window.digitalData.events.push({
          name: 'Test Event',
          callback: () => {
            assert.ok(ym.yaCounter.reachGoal.calledWith('GOAL1'));
            done();
          }
        });
      });

      it('should not track custom event as a goal', (done) => {
        sinon.stub(ym.yaCounter, 'reachGoal');
        window.digitalData.events.push({
          name: 'Test Event 2',
          callback: () => {
            assert.ok(!ym.yaCounter.reachGoal.called);
            done();
          }
        });
      });
    });
  });

});
