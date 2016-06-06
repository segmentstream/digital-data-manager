import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import deleteProperty from './../../src/functions/deleteProperty.js';
import RetailRocket from './../../src/integrations/RetailRocket.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: RetailRocket', () => {
  // this var will be reused in all Retail Rocket tests
  // as Retail Rocket throws error when loaded few times
  let retailRocket;
  let stubsPrepared = false;

  const options = {
    partnerId: '567c343e6c7d3d14101afee5',
    userIdProperty: 'user.email'
  };

  beforeEach(() => {
    window.digitalData = {
      user: {},
      events: []
    };
    retailRocket = new RetailRocket(window.digitalData, options);
    ddManager.addIntegration('Retail Rocket', retailRocket);
  });

  afterEach(() => {
    retailRocket.reset();
    ddManager.reset();
    reset();

    // stubs for callbacks (hack)
    window.rrApi = {};
    window.rrApi.pageViewCompleted = function() {};
    window.rrApi.setEmailCompleted = function() {};
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(retailRocket, 'load');
    });

    afterEach(function () {
      retailRocket.load.restore();
    });

    describe('#constructor', () => {

      it('should create Retail Rocket integrations with proper options and tags', () => {
        assert.equal(options.partnerId, retailRocket.getOption('partnerId'));
        assert.equal('script', retailRocket.getTag().type);
        assert.ok(retailRocket.getTag().attr.src.indexOf('retailrocket.ru') > 0);
      });

    });

    describe('#initialize', () => {
      it('should initialize all methods', () => {
        ddManager.initialize();
        assert.ok(window.rrPartnerId, 'window.rrPartnerId is not defined');
        assert.ok(window.rrApi, 'window.rrApi is not defined');
        assert.ok(window.rrApiOnReady, 'window.rrApiOnReady is not defined');
        assert.ok(typeof window.rrApi.addToBasket === 'function', 'window.rrApi.addToBasket is not a function');
        assert.ok(typeof window.rrApi.order === 'function', 'window.rrApi.order is not a function');
        assert.ok(typeof window.rrApi.categoryView === 'function', 'window.rrApi.categoryView is not a function');
        assert.ok(typeof window.rrApi.view === 'function', 'window.rrApi.view is not a function');
        assert.ok(typeof window.rrApi.recomMouseDown === 'function', 'window.rrApi.recomMouseDown is not a function');
        assert.ok(typeof window.rrApi.recomAddToCart === 'function', 'window.rrApi.recomAddToCart is not a function');
      });

      it('should set window.rrPartnerUserId if possible', () => {
        window.digitalData.user.email = 'test@test.com';
        ddManager.initialize();
        assert.equal(window.rrPartnerUserId, 'test@test.com');
      });
    });
  });

  describe('after loading', () => {

    const prepareStubs = () => {
      window.rrApiOnReady.push = (fn) => {
        fn();
      };
      sinon.stub(window.rrApi, 'addToBasket');
      sinon.stub(window.rrApi, 'view');
      sinon.stub(window.rrApi, 'categoryView');
      sinon.stub(window.rrApi, 'order');
      sinon.stub(window.rrApi, 'pageView');
      sinon.stub(window.rrApi, 'search');
      sinon.stub(window.rrApi, 'recomMouseDown');
      window.rrApi.setEmail = () => {};
      stubsPrepared = true;
    };

    const restoreStubs = () => {
      window.rrApi.addToBasket.restore();
      window.rrApi.view.restore();
      window.rrApi.categoryView.restore();
      window.rrApi.order.restore();
      window.rrApi.pageView.restore();
      window.rrApi.search.restore();
      window.rrApi.recomMouseDown.restore();
    };

    beforeEach((done) => {
      sinon.stub(retailRocket, 'load', () => {
        rrApi._initialize = () => {};
        retailRocket.ready();
      });

      ddManager.once('ready', done);
      ddManager.initialize();
      prepareStubs();
    });

    afterEach(() => {
      restoreStubs();
    });

    describe('#onViewedProductCategory', () => {

      it('should track "Viewed Product Category" with categoryId param', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          page: {
            categoryId: '28'
          },
          callback: () => {
            assert.ok(window.rrApi.categoryView.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Viewed Product Category" event', (done) => {
        window.digitalData.page = {};
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Viewed Product Category" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          page: {
            categoryId: '28'
          },
          callback: () => {
            assert.ok(!window.rrApi.categoryView.called);
            done();
          }
        });
      });

    });

    describe('#onViewedProductDetail', () => {

      it('should track "Viewed Product Detail" with product.id param', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          callback: () => {
            assert.ok(window.rrApi.view.calledOnce);
            done();
          }
        });
      });

      it('should track "Viewed Product Detail" event with product param', (done) => {
        window.digitalData.page = {
          type: 'product'
        };
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: '327',
          callback: () => {
            assert.ok(window.rrApi.view.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Viewed Product Detail" event', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Viewed Product Detail" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          callback: () => {
            assert.ok(!window.rrApi.view.called);
            done();
          }
        });
      });

    });

    describe('#onAddedProduct', () => {

      it('should track "Added Product" with product.id param', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          quantity: 1,
          callback: () => {
            assert.ok(window.rrApi.addToBasket.calledOnce);
            done();
          }
        });
      });

      it('should track "Added Product" event by product id', (done) => {
        window.digitalData.page = {
          type: 'product'
        };
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: '327',
          quantity: 1,
          callback: () => {
            assert.ok(window.rrApi.addToBasket.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Added Product" event', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Added Product" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          quantity: 1,
          callback: () => {
            assert.ok(!window.rrApi.addToBasket.called);
            done();
          }
        });
      });

    });


    describe('#onClickedProduct', () => {

      it('should track "Clicked Product" with product.id param', (done) => {
        retailRocket.setOption('listMethods', {
          recom1: 'Related'
        });
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          product: {
            id: '327',
            listName: 'recom1'
          },
          quantity: 1,
          callback: () => {
            assert.ok(window.rrApi.recomMouseDown.calledWith('327', 'Related'));
            done();
          }
        });
      });

      it('should track "Clicked Product" event by product id', (done) => {
        retailRocket.setOption('listMethods', {
          recom1: 'Related'
        });
        window.digitalData.page = {
          type: 'product'
        };
        window.digitalData.recommendation = [
          {
            listName: 'recom1',
            items: [
              {
                id: '327'
              }
            ]
          }
        ];
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          product: '327',
          quantity: 1,
          callback: () => {
            assert.ok(window.rrApi.recomMouseDown.calledWith('327', 'Related'));
            done();
          }
        });
      });

      it('should throw validation error for "Clicked Product" event', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Clicked Product" event if listName is not defined for product', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          product: {
            id: '327'
          },
          callback: (results, errors) => {
            assert.ok(!window.rrApi.recomMouseDown.called);
            done();
          }
        });
      });

      it('should not track "Clicked Product" event if list recommendation method is not defined for product', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          category: 'Ecommerce',
          product: {
            id: '327',
            listName: 'recom1'
          },
          callback: (results, errors) => {
            assert.ok(!window.rrApi.recomMouseDown.called);
            done();
          }
        });
      });

      it('should not track "Clicked Product" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        retailRocket.setOption('listMethods', {
          recom1: 'Related'
        });
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '327',
            listName: 'recom1'
          },
          quantity: 1,
          callback: () => {
            assert.ok(!window.rrApi.recomMouseDown.called);
            done();
          }
        });
      });

    });


    describe('#onCompletedTransaction', () => {

      it('should track "Completed Transaction" with transaction param', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '327',
                  unitSalePrice: 245
                },
                quantity: 1
              },
              {
                product: {
                  id: '328',
                  unitSalePrice: 245
                },
                quantity: 2
              }
            ]
          },
          callback: () => {
            assert.ok(window.rrApi.order.calledOnce);
            done();
          }
        });
      });

      it('should track "Completed Transaction" with transaction param and product.unitPrice instead of product.unitSalePrice', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '327',
                  unitPrice: 245
                },
                quantity: 1
              },
              {
                product: {
                  id: '328',
                  unitPrice: 245
                },
                quantity: 2
              }
            ]
          },
          callback: () => {
            assert.ok(window.rrApi.order.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing transaction param', (done) => {
        deleteProperty(window.digitalData, 'transaction');
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing lineItems params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing product.id params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [
            {
              product: {}
            },
            {
              product: {}
            }
          ]
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0, 'There was no errors');
            assert.ok(errors[0].code === 'validation_error', 'Error code is not correct');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing lineItem quantity params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [
            {
              product: {
                id: '327',
                unitSalePrice: 245
              }
            },
            {
              product: {
                id: '328',
                unitSalePrice: 245
              }
            }
          ]
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0, 'There was no errors');
            assert.ok(errors[0].code === 'validation_error', 'Error code is not correct');
            done();
          }
        });
      });

      it('should throw validation error for "Completed Transaction" event when missing product.unitSalePrice params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [
            {
              product: {
                id: '327',
              },
              quantity: 1
            },
            {
              product: {
                id: '328',
              },
              quantity: 2
            }
          ]
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Completed Transaction" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '327',
                  unitSalePrice: 245
                },
                quantity: 1
              },
              {
                product: {
                  id: '328',
                  unitSalePrice: 245
                },
                quantity: 2
              }
            ]
          },
          callback: () => {
            assert.ok(!window.rrApi.order.called);
            done();
          }
        });
      });

    });

    describe('#onSubscribed', () => {

      beforeEach(() => {
        sinon.stub(window.rrApi, 'setEmail');
      });

      afterEach(() => {
        window.rrApi.setEmail.restore();
      });

      it('should track "Subscribed" with user.email param', (done) => {
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledOnce);
            done();
          }
        });
      });

      it('should track "Subscribed" with user.email param event if noConflict is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledOnce);
            done();
          }
        });
      });

      it('should throw validation error for "Subscribed" event', (done) => {
        window.digitalData.user = {};
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            assert.ok(!window.rrApi.setEmail.called);
            done();
          }
        });
      });

      it('should track email if user.email is set and user.isSubscribed is TRUE', () => {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: true
        };
        retailRocket.setOption('trackAllEmails', false);
        retailRocket.trackEmail();
        assert.ok(window.rrApi.setEmail.calledOnce);
      });

      it('should NOT track email if user.email is set and user.isSubscribed is FALSE', () => {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: false
        };
        retailRocket.setOption('trackAllEmails', false);
        retailRocket.trackEmail();
        assert.ok(!window.rrApi.setEmail.called);
      });

      it('should track email if user.email is set and user.isSubscribed is FALSE if trackAllEmail option is TRUE', () => {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: false
        };
        retailRocket.setOption('trackAllEmails', true);
        retailRocket.trackEmail();
        assert.ok(window.rrApi.setEmail.calledOnce);
      });

      it('should update user.email if rr_setemail is set', () => {
        window.digitalData.user = {};

        sinon.stub(retailRocket, 'getQueryString', function() {
          return '?rr_setemail=test@driveback.ru';
        });

        retailRocket.setOption('trackAllEmails', false);
        retailRocket.trackEmail();

        assert.ok(window.digitalData.user.email === 'test@driveback.ru');
        retailRocket.getQueryString.restore();
      });

      it('should track email anytime user.email updated if trackAllEmails is TRUE', (done) => {
        retailRocket.setOption('trackAllEmails', true);
        window.digitalData.user = {
          email: 'test@driveback.ru'
        };

        // wait 101 while DDL changes listener will update to new state
        setTimeout(() => {
          assert.ok(window.rrApi.setEmail.calledOnce);
          done();
        }, 101);
      });

      it('should NOT track email anytime user.email updated if trackAllEmails is FALSE', (done) => {
        retailRocket.setOption('trackAllEmails', false);
        window.digitalData.user = {
          email: 'test@driveback.ru'
        };

        setTimeout(() => {
          assert.ok(!window.rrApi.setEmail.called);
          done();
        }, 101);
      });

    });

    describe('#onSearched', () => {

      it('should track "Searched" with query param', (done) => {
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Content',
          query: 'Test query',
          callback: () => {
            assert.ok(window.rrApi.search.calledWith('Test query'));
            done();
          }
        });
      });

      it('should throw validation error for "Searched" event', (done) => {
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Content',
          callback: (results, errors) => {
            assert.ok(errors.length > 0);
            assert.ok(errors[0].code === 'validation_error');
            done();
          }
        });
      });

      it('should not track "Searched" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Searched',
          category: 'Content',
          query: 'Test query',
          callback: () => {
            assert.ok(!window.rrApi.search.called);
            done();
          }
        });
      });

    });

  });

});