import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import noop from 'driveback-utils/noop';
import YandexMetrica from './../../src/integrations/YandexMetrica.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Yandex Metrica', () => {

  let ym;
  let options;

  beforeEach(() => {
    options = {
      counterId: '37510050',
      sendUserId: false,
      clickmap: true,
      webvisor: true,
      trackLinks: false,
      trackHash: true,
      purchaseGoalId: '20185850',
      goals: {
        'Test Event': 'GOAL1'
      },
      'visitParamsVars': {
        'websiteType': {
          type: 'digitalData',
          value: 'website.type'
        },
        'customParam': {
          type: 'event',
          value: 'testParam'
        }
      },
      'userParamsVars': {
        'userRfm': {
          type: 'digitalData',
          value: 'user.rfmSegment'
        },
        'customParam': {
          type: 'event',
          value: 'testParam'
        }
      },
    };

    window.digitalData = {
      website: {
        type: 'desktop',
        region: 'New York'
      },
      page: {},
      user: {
        rfmSegment: 'rfm1',
        isLoggedIn: true
      },
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
        assert.equal(ym.getTag().attr.src, 'https://mc.yandex.ru/metrika/watch.js');
      });
    });

    describe('#initialize', () => {
      it('should initialize yandex metrica queue object', () => {
        ddManager.initialize();
        assert.ok(window.yandex_metrika_callbacks);
        assert.ok(window.yandex_metrika_callbacks.push);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(ym.load.calledOnce);
      });
    });
  });

  describe('loading', function () {
    beforeEach(() => {
      sinon.stub(ym, 'load').callsFake(() => {
        window.Ya = {};
        window.Ya.Metrika = function(options) {
          assert.equal(options.id, ym.getOption('counterId'));
          assert.equal(options.clickmap, ym.getOption('clickmap'));
          assert.equal(options.webvisor, ym.getOption('webvisor'));
          assert.equal(options.trackLinks, ym.getOption('trackLinks'));
          assert.equal(options.trackHash, ym.getOption('trackHash'));
        };
        window.yandex_metrika_callbacks = undefined;
        ym.onLoad();
      });
    });

    afterEach(() => {
      ym.load.restore();
    });

    it('should load', function (done) {
      assert.ok(!ym.isLoaded());
      ym.once('load', () => {
        assert.ok(ym.isLoaded());
        done();
      });
      ddManager.initialize();
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(ym, 'load').callsFake(() => {
        window.Ya = {};
        window.Ya.Metrika = function() {
          this.reachGoal = noop;
          this.params = noop;
          this.userParams = noop;
          this.hit = noop;
          this.setUserID = noop;
          this.getClientID = () => {
            return '123';
          };
        };
        let callback;
        do {
          callback = window.yandex_metrika_callbacks.pop();
          if (callback) callback();
        } while (callback);
        window.yandex_metrika_callbacks = undefined;
        ym.onLoad();
      });
      ddManager.once('ready', done);
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });

    afterEach(() => {
      ym.load.restore();
      if (ym.yaCounter.params.restore) {
        ym.yaCounter.params.restore();
      }
      if (ym.yaCounter.userParams.restore) {
        ym.yaCounter.userParams.restore();
      }
      if (ym.yaCounterCall.restore) {
        ym.yaCounterCall.restore();
      }
    });

    describe('#onViewedPage', () => {
      it('should track params on first pageview', (done) => {
        ym.once('load', () => {
          sinon.spy(window.Ya, 'Metrika');
        });
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home',
          },
          testParam: 'testValue',
          callback: () => {
            assert.ok(window.Ya.Metrika.calledWithMatch({
              params: {
                'websiteType': 'desktop',
                'customParam': 'testValue'
              }
            }));
            done();
          }
        });
      });

      it('should track userParams on first pageview', (done) => {
        ym.once('load', () => {
          sinon.spy(window.Ya, 'Metrika');
        });
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          testParam: 'testValue',
          callback: () => {
            assert.ok(window.Ya.Metrika.calledWithMatch({
              userParams: {
                'userRfm': 'rfm1',
                'customParam': 'testValue'
              }
            }));
            done();
          }
        });
      });

      it('should send additional hit with params on second pageview (ajax websites)', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          testParam: 'testValue',
        });

        // spy once counter created after 1st pageview
        sinon.spy(ym.yaCounter, 'hit');
        sinon.spy(ym.yaCounter, 'userParams');

        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          testParam: 'testValue',
          callback: () => {
            assert.ok(ym.yaCounter.userParams.calledWith({
              'userRfm': 'rfm1',
              'customParam': 'testValue'
            }));
            done();
          }
        });
      });

      it('should send userParams on second pageview (ajax websites)', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          testParam: 'testValue',
        });

        // spy once counter created after 1st pageview
        sinon.spy(ym.yaCounter, 'hit');

        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          testParam: 'testValue',
          callback: () => {
            assert.ok(ym.yaCounter.hit.calledWith(window.location.href, {
              referer: document.referrer,
              title: '',
              params: {
                'websiteType': 'desktop',
                'customParam': 'testValue'
              }
            }));
            done();
          }
        });
      });

      it('should send User ID if proper option specified', (done) => {
        sinon.spy(ym, 'yaCounterCall');
        ym.setOption('sendUserId', true);
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home',
          },
          user: {
            userId: '123'
          },
          callback: () => {
            assert.ok(ym.yaCounterCall.calledWith('setUserID', ['123']));
            done();
          }
        });
      });
    });

    describe('#onViewedProductDetail', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

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

      it('should push product detail into dataLayer with feedWithGrouped products option (digitalData)', (done) => {
        ym.setOption('feedWithGroupedProducts', true);
        window.digitalData.product = {
          id: '123',
          skuCode: 'sku123',
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
                      id: 'sku123',
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
    });

    describe('#onAddedProduct', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

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

      it('should push added product into dataLayer using product.skuCode', (done) => {
        ym.setOption('feedWithGroupedProducts', true);
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            skuCode: 'sku123',
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
                      id: 'sku123',
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
    });

    describe('#onRemovedProduct', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

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

      it('should push removed product into dataLayer usgin product.skuCode', (done) => {
        window.digitalData.events.push({
          name: 'Removed Product',
          product: {
            id: 'sku123',
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
                      id: 'sku123',
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

    });

    describe('#onCompletedTransaction', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

      const lineItems = [
        {
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 100
          },
          quantity: 1
        },
        {
          product: {
            id: '234',
            skuCode: 'sku234',
            unitPrice: 100,
            unitSalePrice: 50
          },
          quantity: 2
        },
        {
          product: {
            id: '345',
            skuCode: 'sku345',
            name: 'Test Product',
            unitPrice: 30
          }
        }
      ];

      it('should push purchase information into dataLayer', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            vouchers: ['VOUCHER1'],
            lineItems,
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
                      id: '345',
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
                      id: '345',
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

      it('should push purchase information into dataLayer (digitalData) using product.skuCode', (done) => {
        ym.setOption('feedWithGroupedProducts', true);
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
                      id: 'sku123',
                      price: 100,
                      quantity: 1
                    },
                    {
                      id: 'sku234',
                      price: 50,
                      quantity: 2
                    },
                    {
                      id: 'sku345',
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

    });

    describe('#onCustomEvent', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

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

      it('should track params on custom event', (done) => {
        sinon.spy(ym.yaCounter, 'reachGoal');
        window.digitalData.events.push({
          name: 'Test Event',
          testParam: 'testValue',
          callback: () => {
            assert.ok(ym.yaCounter.reachGoal.calledWith('GOAL1', {
              'websiteType': 'desktop',
              'customParam': 'testValue'
            }));
            done();
          }
        });
      });
    });
  });

});
