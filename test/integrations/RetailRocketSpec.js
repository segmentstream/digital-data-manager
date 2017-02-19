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
    userIdProperty: 'user.email',
    overrideFunctions: {
      product: (product) => {
        if (product && product.id) {
          product.id = product.id.replace(/_/g, '');
        }
      },
    },
  };

  beforeEach(() => {
    window.digitalData = {
      user: {},
      events: [],
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
    window.rrApi.pageViewCompleted = () => {};
    window.rrApi.setEmailCompleted = () => {};
  });


  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(retailRocket, 'load');
    });

    afterEach(() => {
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
        window.rrApi._initialize = () => {};
        retailRocket.onLoad();
      });

      ddManager.once('ready', done);
      ddManager.initialize();
      prepareStubs();
    });

    afterEach(() => {
      restoreStubs();
    });


    describe('#onViewedProductCategory', () => {
      it('should track "Viewed Product Category" with categoryId param (digitalData)', (done) => {
        window.digitalData.listing = {
          categoryId: '28',
        };
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          callback: () => {
            assert.ok(window.rrApi.categoryView.calledOnce);
            done();
          },
        });
      });

      it('should track "Viewed Product Category" with categoryId param', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          listing: {
            categoryId: '28',
          },
          callback: () => {
            assert.ok(window.rrApi.categoryView.calledOnce);
            done();
          },
        });
      });

      it('should not track "Viewed Product Category" event without categoryId', (done) => {
        window.digitalData.page = {};
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          callback: () => {
            assert.ok(!window.rrApi.categoryView.called);
            done();
          },
        });
      });

      it('should not track "Viewed Product Category" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          listing: {
            categoryId: '28',
          },
          callback: () => {
            assert.ok(!window.rrApi.categoryView.called);
            done();
          },
        });
      });
    });


    describe('#onViewedProductDetail', () => {
      it('should track "Viewed Product Detail" with product.id param (digitalData)', (done) => {
        window.digitalData.product = {
          id: '327',
        };
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.ok(window.rrApi.view.calledOnce);
            done();
          },
        });
      });

      it('should track "Viewed Product Detail" with product.id param', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '327',
          },
          callback: () => {
            assert.ok(window.rrApi.view.calledOnce);
            done();
          },
        });
      });

      it('should track "Viewed Product Detail" event with product param', (done) => {
        window.digitalData.page = {
          type: 'product',
        };
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: '327',
          callback: () => {
            assert.ok(window.rrApi.view.calledOnce);
            done();
          },
        });
      });

      it('should not track "Viewed Product Detail" event without product', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.ok(!window.rrApi.view.called);
            done();
          },
        });
      });

      it('should not track "Viewed Product Detail" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '327',
          },
          callback: () => {
            assert.ok(!window.rrApi.view.called);
            done();
          },
        });
      });

      it('should override product id for "Viewed Product Detail" event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123_23',
          },
          callback: () => {
            assert.ok(window.rrApi.view.calledWith('12323'));
            done();
          },
        });
      });

      it('should override product for "Viewed Product Detail" event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: '123_23',
          callback: () => {
            assert.ok(window.rrApi.view.calledWith('12323'));
            done();
          },
        });
      });
    });


    describe('#onAddedProduct', () => {
      it('should track "Added Product" with product.id param', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '327',
          },
          quantity: 1,
          callback: () => {
            assert.ok(window.rrApi.addToBasket.calledOnce);
            done();
          },
        });
      });

      it('should track "Added Product" event by product id', (done) => {
        window.digitalData.page = {
          type: 'product',
        };
        window.digitalData.events.push({
          name: 'Added Product',
          product: '327',
          quantity: 1,
          callback: () => {
            assert.ok(window.rrApi.addToBasket.calledOnce);
            done();
          },
        });
      });

      it('should not track "Added Product" event without product id', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {
          id: '327',
        };
        window.digitalData.events.push({
          name: 'Added Product',
          callback: () => {
            assert.ok(!window.rrApi.addToBasket.called);
            done();
          },
        });
      });

      it('should not track "Added Product" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '327',
          },
          quantity: 1,
          callback: () => {
            assert.ok(!window.rrApi.addToBasket.called);
            done();
          },
        });
      });

      it('should override product id for "Added Product" event', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123_23',
          },
          callback: () => {
            assert.ok(window.rrApi.addToBasket.calledWith('12323'));
            done();
          },
        });
      });

      it('should override product for "Added Product" event', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: '123_23',
          callback: () => {
            assert.ok(window.rrApi.addToBasket.calledWith('12323'));
            done();
          },
        });
      });
    });


    describe('#onClickedProduct', () => {
      it('should track "Clicked Product" with product.id param', (done) => {
        retailRocket.setOption('listMethods', {
          recom1: 'Related',
        });
        window.digitalData.events.push({
          name: 'Clicked Product',
          listItem: {
            product: {
              id: '327',
            },
            listId: 'recom1',
          },
          callback: () => {
            assert.ok(window.rrApi.recomMouseDown.calledWith('327', 'Related'));
            done();
          },
        });
      });

      it('should override product id "Clicked Product" with product.id param', (done) => {
        retailRocket.setOption('listMethods', {
          recom1: 'Related',
        });
        window.digitalData.events.push({
          name: 'Clicked Product',
          listItem: {
            product: {
              id: '327_234',
            },
            listId: 'recom1',
          },
          callback: () => {
            assert.ok(window.rrApi.recomMouseDown.calledWith('327234', 'Related'));
            done();
          },
        });
      });

      it('should track "Clicked Product" event by product id', (done) => {
        retailRocket.setOption('listMethods', {
          recom1: 'Related',
        });
        window.digitalData.page = {
          type: 'product',
        };
        window.digitalData.recommendation = [
          {
            listId: 'recom1',
            items: [
              {
                id: '327',
              },
            ],
          },
        ];
        window.digitalData.events.push({
          name: 'Clicked Product',
          listItem: {
            product: '327',
          },
          callback: () => {
            assert.ok(window.rrApi.recomMouseDown.calledWith('327', 'Related'));
            done();
          },
        });
      });

      it('should not track "Clicked Product" event without product id ', (done) => {
        retailRocket.setOption('listMethods', {
          recom1: 'Related',
        });
        window.digitalData.events.push({
          name: 'Clicked Product',
          listItem: {
            product: {},
            listId: 'recom1',
          },
          callback: () => {
            assert.ok(!window.rrApi.recomMouseDown.called);
            done();
          },
        });
      });

      it('should not track "Clicked Product" event if listId is not defined for product', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          listItem: {
            product: {
              id: '327',
            },
          },
          callback: () => {
            assert.ok(!window.rrApi.recomMouseDown.called);
            done();
          },
        });
      });

      it('should not track "Clicked Product" event if list recommendation method is not defined for product', (done) => {
        window.digitalData.page = {};
        window.digitalData.product = {};
        window.digitalData.events.push({
          name: 'Clicked Product',
          listItem: {
            product: {
              id: '327',
            },
            listId: 'recom1',
          },
          callback: () => {
            assert.ok(!window.rrApi.recomMouseDown.called);
            done();
          },
        });
      });

      it('should not track "Clicked Product" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        retailRocket.setOption('listMethods', {
          recom1: 'Related',
        });
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '327',
            listId: 'recom1',
          },
          quantity: 1,
          callback: () => {
            assert.ok(!window.rrApi.recomMouseDown.called);
            done();
          },
        });
      });
    });


    describe('#onCompletedTransaction', () => {
      it('should track "Completed Transaction" with transaction param (digitalData)', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [
            {
              product: {
                id: '327',
                unitSalePrice: 245,
              },
              quantity: 1,
            },
            {
              product: {
                id: '328',
                unitSalePrice: 245,
              },
              quantity: 2,
            },
          ],
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(window.rrApi.order.calledOnce);
            done();
          },
        });
      });

      it('should track "Completed Transaction" with transaction param', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '327',
                  unitSalePrice: 245,
                },
                quantity: 1,
              },
              {
                product: {
                  id: '328',
                  unitSalePrice: 245,
                },
                quantity: 2,
              },
            ],
          },
          callback: () => {
            assert.ok(window.rrApi.order.calledOnce);
            done();
          },
        });
      });

      it('should track "Completed Transaction" with transaction param and product.unitPrice instead of product.unitSalePrice', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '327',
                  unitPrice: 245,
                },
                quantity: 1,
              },
              {
                product: {
                  id: '328',
                  unitPrice: 245,
                },
                quantity: 2,
              },
            ],
          },
          callback: () => {
            assert.ok(window.rrApi.order.calledOnce);
            done();
          },
        });
      });

      it('should override product id for "Completed Transaction" event', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '327_1',
                  unitSalePrice: 245,
                },
                quantity: 1,
              },
              {
                product: {
                  id: '328_2',
                  unitSalePrice: 245,
                },
                quantity: 2,
              },
            ],
          },
          callback: () => {
            assert.ok(window.rrApi.order.calledWith(
              {
                transaction: '123',
                items: [
                  {
                    id: '3271',
                    qnt: 1,
                    price: 245,
                  },
                  {
                    id: '3282',
                    qnt: 2,
                    price: 245,
                  },
                ],
              }
            ));
            done();
          },
        });
      });

      it('should not track "Completed Transaction" event when missing transaction param', (done) => {
        deleteProperty(window.digitalData, 'transaction');
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(!window.rrApi.order.called);
            done();
          },
        });
      });

      it('should not track "Completed Transaction" event when missing lineItems params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(!window.rrApi.order.called);
            done();
          },
        });
      });

      it('should not track "Completed Transaction" event when missing product.id params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [
            {
              product: {},
            },
            {
              product: {},
            },
          ],
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(!window.rrApi.order.called);
            done();
          },
        });
      });

      it('should not track "Completed Transaction" event when missing lineItem quantity params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [
            {
              product: {
                id: '327',
                unitSalePrice: 245,
              },
            },
            {
              product: {
                id: '328',
                unitSalePrice: 245,
              },
            },
          ],
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(!window.rrApi.order.called);
            done();
          },
        });
      });

      it('should not track "Completed Transaction" event when missing product.unitSalePrice params', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          lineItems: [
            {
              product: {
                id: '327',
              },
              quantity: 1,
            },
            {
              product: {
                id: '328',
              },
              quantity: 2,
            },
          ],
        };
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(!window.rrApi.order.called);
            done();
          },
        });
      });

      it('should not track "Completed Transaction" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '327',
                  unitSalePrice: 245,
                },
                quantity: 1,
              },
              {
                product: {
                  id: '328',
                  unitSalePrice: 245,
                },
                quantity: 2,
              },
            ],
          },
          callback: () => {
            assert.ok(!window.rrApi.order.called);
            done();
          },
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
            email: 'test@driveback.ru',
          },
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledOnce);
            done();
          },
        });
      });

      it('should track "Subscribed" with user.email param and other custom params (legacy version)', (done) => {
        retailRocket.setOption('customVariables', {
          param1: 'eventParam1',
          param2: 'eventParam2',
          param3: 'user.firstName',
        });
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John Dow',
          },
          eventParam1: 'test1',
          eventParam2: true,
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledWith('test@driveback.ru', {
              param1: 'test1',
              param2: 'true',
              param3: 'John Dow',
            }));
            done();
          },
        });
      });

      it('should track "Subscribed" with user.email param and other custom params', (done) => {
        retailRocket.setOption('customVariables', {
          param1: {
            type: 'event',
            value: 'eventParam1',
          },
          param2: {
            type: 'event',
            value: 'eventParam2',
          },
          param3: {
            type: 'digitalData',
            value: 'website.language',
          },
          param4: {
            type: 'event',
            value: 'user.firstName',
          },
        });
        window.digitalData.website.language = 'en';
        window.digitalData.user.firstName = 'John Dow';
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru',
          },
          eventParam1: 'test1',
          eventParam2: true,
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledWith('test@driveback.ru', {
              param1: 'test1',
              param2: 'true',
              param3: 'en',
            }));
            done();
          },
        });
      });

      it('should track "Subscribed" event with user.email param  if noConflict is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru',
          },
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledOnce);
            done();
          },
        });
      });

      it('should track "Subscribed" event with user.email param and other customs if noConflict is true', (done) => {
        retailRocket.setOption('noConflict', true);
        retailRocket.setOption('customVariables', {
          param1: 'eventParam1',
          param2: 'eventParam2',
          param3: 'user.firstName',
        });
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          user: {
            email: 'test@driveback.ru',
            firstName: 'John Dow',
          },
          eventParam1: 'test1',
          eventParam2: true,
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledWith('test@driveback.ru', {
              param1: 'test1',
              param2: 'true',
              param3: 'John Dow',
            }));
            done();
          },
        });
      });

      it('should not track "Subscribed" event', (done) => {
        window.digitalData.user = {
          email: 'test@driveback.ru',
        };
        window.digitalData.events.push({
          name: 'Subscribed',
          category: 'Email',
          callback: () => {
            assert.ok(!window.rrApi.setEmail.called);
            done();
          },
        });
      });

      it('should track email if user.email is set and user.isSubscribed is TRUE', (done) => {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: true,
        };
        retailRocket.setOption('trackAllEmails', false);
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledOnce);
            done();
          },
        });
      });

      it('should NOT track email if user.email is set and user.isSubscribed is FALSE', (done) => {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: false,
        };
        retailRocket.setOption('trackAllEmails', false);
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(!window.rrApi.setEmail.called);
            done();
          },
        });
      });

      it('should track email if user.email is set and user.isSubscribed is FALSE if trackAllEmail option is TRUE', (done) => {
        window.digitalData.user = {
          email: 'test@driveback.ru',
          isSubscribed: false,
        };
        retailRocket.setOption('trackAllEmails', true);
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(window.rrApi.setEmail.calledOnce);
            done();
          },
        });
      });

      it('should NOT track email anytime user.email updated if trackAllEmails is FALSE', (done) => {
        retailRocket.setOption('trackAllEmails', false);
        window.digitalData.user = {
          email: 'test@driveback.ru',
        };

        setTimeout(() => {
          assert.ok(!window.rrApi.setEmail.called);
          done();
        }, 101);
      });
    });


    describe('#onSearchedProducts', () => {
      it('should track "Searched" with query param', (done) => {
        window.digitalData.listing = {
          query: 'Test query',
        };
        window.digitalData.events.push({
          name: 'Searched Products',
          callback: () => {
            assert.ok(window.rrApi.search.calledWith('Test query'));
            done();
          },
        });
      });

      it('should track "Searched" with query param', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            query: 'Test query',
          },
          callback: () => {
            assert.ok(window.rrApi.search.calledWith('Test query'));
            done();
          },
        });
      });

      it('should not track "Searched" event without query param', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {},
          callback: () => {
            assert.ok(!window.rrApi.search.called);
            done();
          },
        });
      });

      it('should not track "Searched" if noConflict option is true', (done) => {
        retailRocket.setOption('noConflict', true);
        window.digitalData.events.push({
          name: 'Searched',
          listing: {
            query: 'Test query',
          },
          callback: () => {
            assert.ok(!window.rrApi.search.called);
            done();
          },
        });
      });
    });
  });
});
