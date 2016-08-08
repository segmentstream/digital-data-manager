import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import FacebookPixel from './../../src/integrations/FacebookPixel.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: FacebookPixel', () => {
  let fbPixel;
  const options = {
    pixelId: '946986105422948'
  };

  before(() => {
    fbPixel = new FacebookPixel(window.digitalData, options);
    ddManager.addIntegration('Facebook Pixel', fbPixel);
  });

  after(() => {
    fbPixel.reset();
    ddManager.reset();
    reset();
  });

  describe('#constructor', () => {

    it('should create Facebook Pixel integrations with proper options and tags', () => {
      assert.equal(options.pixelId, fbPixel.getOption('pixelId'));
      assert.equal('script', fbPixel.getTag().type);
    });

  });

  describe('#load', () => {

    it('should load', (done) => {
      assert.ok(!fbPixel.isLoaded());
      ddManager.once('load', () => {
        assert.ok(fbPixel.isLoaded());
        done();
      });
      ddManager.initialize();
    });

  });

  describe('after loading', () => {

    before((done) => {
      if (!ddManager.isReady()) {
        ddManager.once('ready', done);
        ddManager.initialize();
      } else {
        done();
      }
    });

    beforeEach(() => {
      sinon.spy(window, 'fbq');
    });

    afterEach(() => {
      window.fbq.restore();
    });

    it('should initialize fbq object', () => {
      let fbq = window.fbq;

      assert.ok(fbq);
      assert.ok(typeof fbq === 'function');
    });

    describe('#onViewedPage', () => {

      it('should call fbq track PageView', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          category: 'Content',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'PageView'));
            done();
          }
        });
      });

    });


    describe('#onViewedProductCategory', () => {

      beforeEach(() => {
        sinon.spy(fbPixel, 'onViewedProductCategory');
      });

      afterEach(() => {
        fbPixel.onViewedProductCategory.restore();
      });

      it('should call fbq track ViewContent', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Ecommerce',
          listing: {
            categoryId: '123',
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product_group'
            }), 'fbq("track", "ViewContent") was not called');
            const pageArg = fbPixel.onViewedProductCategory.getCall(0).args[0];
            assert.ok(pageArg.categoryId, 'page.categoryId is not defined');
            done();
          }
        });
      });

    });


    describe('#onViewedProductDetail', () => {

      beforeEach(() => {
        sinon.spy(fbPixel, 'onViewedProductDetail');
      });

      afterEach(() => {
        fbPixel.onViewedProductDetail.restore();
      });

      it('should call fbq track ViewContent', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            name: 'Test Product',
            category: 'Category 1',
            currency: 'USD',
            unitSalePrice: 10000
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1',
              currency: 'USD',
              value: 10000
            }), 'fbq("track", "ViewContent") was not called');
            const productArg = fbPixel.onViewedProductDetail.getCall(0).args[0];
            assert.ok(productArg.id, 'product.id is not defined');
            assert.ok(productArg.name, 'product.name is not defined');
            assert.ok(productArg.category, 'product.category is not defined');
            assert.ok(productArg.unitSalePrice, 'product.unitSalePrice is not defined');
            done();
          }
        });

      });
    });


    describe('#onAddedProduct', () => {

      beforeEach(() => {
        sinon.spy(fbPixel, 'onAddedProduct');
      });

      afterEach(() => {
        fbPixel.onAddedProduct.restore();
      });

      it('should call fbq track AddToCart', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: {
            id: '123',
            name: 'Test Product',
            category: 'Category 1',
            currency: 'USD',
            unitSalePrice: 10000
          },
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "AddToCart") was not called');
            const productArg = fbPixel.onAddedProduct.getCall(0).args[0];
            const quantityArg = fbPixel.onAddedProduct.getCall(0).args[1];
            assert.ok(productArg.id, 'product.id is not defined');
            assert.ok(productArg.name, 'product.name is not defined');
            assert.ok(productArg.category, 'product.category is not defined');
            assert.ok(productArg.currency, 'product.currency is not defined');
            assert.ok(productArg.unitSalePrice, 'product.unitSalePrice is not defined');
            assert.ok(quantityArg === 2);
            done();
          }
        });

        it('should call fbq track ViewContent even without quantity param', (done) => {
          window.digitalData.events.push({
            name: 'Added Product',
            category: 'Ecommerce',
            product: {
              id: '123',
              name: 'Test Product',
              category: 'Category 1',
              currency: 'USD',
              unitSalePrice: 10000
            },
            callback: () => {
              assert.ok(window.fbq.calledWith('track', 'AddToCart', {
                content_ids: ['123'],
                content_type: 'product',
                content_name: 'Test Product',
                content_category: 'Category 1',
                currency: 'USD',
                value: 10000
              }), 'fbq("track", "AddToCart") was not called');
              const productArg = fbPixel.onAddedProduct.getCall(0).args[0];
              const quantityArg = fbPixel.onAddedProduct.getCall(0).args[1];
              assert.ok(productArg.id, 'product.id is not defined');
              assert.ok(productArg.name, 'product.name is not defined');
              assert.ok(productArg.category, 'product.category is not defined');
              assert.ok(productArg.currency, 'product.currency is not defined');
              assert.ok(productArg.unitSalePrice, 'product.unitSalePrice is not defined');
              assert.ok(!quantityArg);
              done();
            }
          });
        });

      });
    });

    describe('#onCompletedTransaction', () => {

      beforeEach(() => {
        sinon.spy(fbPixel, 'onCompletedTransaction');
      });

      afterEach(() => {
        fbPixel.onCompletedTransaction.restore();
      });

      it('should call fbq track Purchase', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            total: 20000,
            currency: 'USD',
            lineItems: [
              {
                product: {
                  id: '123',
                  name: 'Test Product',
                  category: 'Category 1',
                  currency: 'USD',
                  unitSalePrice: 10000
                },
                quantity: 1,
                subtotal: 10000
              },
              {
                product: {
                  id: '234',
                  name: 'Test Product 2',
                  category: 'Category 1',
                  currency: 'USD',
                  unitSalePrice: 5000
                },
                quantity: 2,
                subtotal: 10000
              }
            ]
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            const transactionArg = fbPixel.onCompletedTransaction.getCall(0).args[0];
            assert.ok(transactionArg.orderId, 'transaction.orderId is not defined');
            done();
          }
        });
      });

      it('should call fbq track Purchase even if transaction.total and transaction.currency is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems: [
              {
                product: {
                  id: '123',
                  name: 'Test Product',
                  category: 'Category 1',
                  currency: 'USD',
                  unitSalePrice: 10000
                },
                quantity: 1,
                subtotal: 10000,
                currency: 'USD'
              },
              {
                product: {
                  id: '234',
                  name: 'Test Product 2',
                  category: 'Category 1',
                  currency: 'USD',
                  unitSalePrice: 5000
                },
                quantity: 2,
                subtotal: 10000,
                currency: 'USD'
              }
            ]
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            const transactionArg = fbPixel.onCompletedTransaction.getCall(0).args[0];
            assert.ok(transactionArg.orderId, 'transaction.orderId is not defined');
            done();
          }
        });
      });

      it('should call fbq track Purchase even if lineItem.subtotal and lineItem.currency is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            currency: 'USD',
            lineItems: [
              {
                product: {
                  id: '123',
                  name: 'Test Product',
                  category: 'Category 1',
                  currency: 'USD',
                  unitSalePrice: 10000
                },
                quantity: 1
              },
              {
                product: {
                  id: '234',
                  name: 'Test Product 2',
                  category: 'Category 1',
                  currency: 'USD',
                  unitSalePrice: 5000
                },
                quantity: 2
              }
            ]
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            const transactionArg = fbPixel.onCompletedTransaction.getCall(0).args[0];
            assert.ok(transactionArg.orderId, 'transaction.orderId is not defined');
            done();
          }
        });
      });

    });


    describe('#onCustomEvent', () => {
      it('should call fbq track for custom event', (done) => {
        window.digitalData.events.push({
          name: 'Downloaded Tutorial',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackCustom', 'Downloaded Tutorial'), 'fbq("track", "Downloaded Tutorial") was not called');
            done();
          }
        });
      });
    });

  });

});
