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

    describe('#onViewedProductDetail', () => {

      it('should call fbq track ViewContent (legacy product.category format)', (done) => {
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
            }), 'fbq("track", "ViewContent") was not called');
            done();
          }
        });
      });

      it('should call fbq track ViewContent (legacy product.category with product.subcategory format)', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            name: 'Test Product',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            currency: 'USD',
            unitSalePrice: 10000
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1',
            }), 'fbq("track", "ViewContent") was not called with correct params');
            done();
          }
        });
      });

      it('should call fbq track ViewContent', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            name: 'Test Product',
            category: ['Category 1', 'Subcategory 1'],
            currency: 'USD',
            unitSalePrice: 10000
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1',
            }), 'fbq("track", "ViewContent") was not called');
            done();
          }
        });
      });

      it('should call fbq track ViewContent (digitalData)', (done) => {
        window.digitalData.product = {
          id: '123',
          name: 'Test Product',
          category: ['Category 1', 'Subcategory 1'],
          currency: 'USD',
          unitSalePrice: 10000
        };
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1',
            }), 'fbq("track", "ViewContent") was not called');
            done();
          }
        });
      });
    });


    describe('#onAddedProduct', () => {

      it('should call fbq track AddToCart (legacy product.category format)', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
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
            }), 'fbq("track", "AddToCart") was not called');
            done();
          }
        });
      });

      it('should call fbq track AddToCart (legacy product.category format with product.subcategory)', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            name: 'Test Product',
            category: 'Category 1',
            subcategory: 'Subcategory 1',
            currency: 'USD',
            unitSalePrice: 10000
          },
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1',
            }), 'fbq("track", "AddToCart") was not called');
            done();
          }
        });
      });

      it('should call fbq track AddToCart' , (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123',
            name: 'Test Product',
            category: ['Category 1', 'Subcategory 1'],
            currency: 'USD',
            unitSalePrice: 10000
          },
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1',
            }), 'fbq("track", "AddToCart") was not called');
            done();
          }
        });
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
            }), 'fbq("track", "AddToCart") was not called');
            done();
          }
        });
      });
    });

    describe('#onCompletedTransaction', () => {

      const transaction = {
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
      };

      it('should call fbq track Purchase', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: transaction,
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            done();
          }
        });
      });

      it('should call fbq track Purchase (digitalData)', (done) => {
        window.digitalData.transaction = transaction;
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(window.fbq.calledWith('track', 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), 'fbq("track", "Purchase") was not called');
            done();
          }
        });
      });

      it('should call fbq track Purchase even if transaction.total and transaction.currency is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
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
            done();
          }
        });
      });

      it('should call fbq track Purchase even if lineItem.subtotal and lineItem.currency is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
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
