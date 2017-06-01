import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import RTBHouse from './../../src/integrations/RTBHouse.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: RTBHouse', () => {
  let rtbHouse;
  const options = {
    accountKey: '',
    customDeduplication: false
  };

  beforeEach(() => {
    window.digitalData = {};
    rtbHouse = new RTBHouse(window.digitalData, options);
    ddManager.addIntegration('RTBHouse', rtbHouse);
  });

  afterEach(() => {
    rtbHouse.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.equal(options.accountKey, rtbHouse.getOption('accountKey'));
        assert.equal(options.customDeduplication, rtbHouse.getOption('customDeduplication'));
      });
    });
  });

  describe('before loading', () => {
    describe('#initialize', () => {
      it('should initialize', () => {
        ddManager.initialize();
        assert.ok(rtbHouse.isLoaded());
      });

      it('should not load any tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(!rtbHouse.load.calledOnce);
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(rtbHouse, 'load');
      ddManager.once('ready', done);
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });

    afterEach(() => {
      rtbHouse.load.restore();
    });

    describe('#onViewedPage', () => {
      it('should track home page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('home'));
            done();
          }
        })
      });

      it('should track other page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'content'
          },
          callback: () => {
            setTimeout(() => {
              assert.ok(rtbHouse.load.calledOnce);
              done();
            }, 200)
          }
        })
      });
    });

    describe('#onViewedCart', () => {
      it('should track cart info', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {
            lineItems: [
              {
                product: {
                  id: '123'
                }
              },
              {
                product: {
                  id: '234'
                }
              }
            ]
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('basketstatus', {
              productIds: '123,234'
            }));
            done();
          }
        })
      });
    });

    describe('#onViewedProductDetail', () => {
      it('should track product detail page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('offer', {
              productId: '123'
            }));
            done();
          }
        })
      });
    });

    describe('#onViewedProductListing', () => {
      it('should track product category listing page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            categoryId: '123'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('category2', {
              categoryId: '123'
            }));
            done();
          }
        })
      });
    });

    describe('#onSearchedProducts', () => {
      it('should track search results page', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
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
              },
              {
                id: '567'
              },
              {
                id: '678'
              },
            ]
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('listing', {
              productIds: '123,234,345,456,567'
            }));
            done();
          }
        })
      });
    });

    /*
    describe('#onAddedProduct', () => {
      it('should track added product event', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: {
            id: '123'
          },
          quantity: 2,
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('basketadd', {
              productId: '123'
            }));
            done();
          }
        })
      });
    });
    */

    describe('#onViewedCheckoutStep', () => {
      it('should track first checkout step', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Checkout Step',
          step: 1,
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('startorder'));
            done();
          }
        })
      });

      it('should not track second+ checkout step', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Checkout Step',
          step: 2,
          callback: () => {
            assert.ok(!rtbHouse.load.calledWith('startorder'));
            done();
          }
        })
      });
    });

    describe('#onCompletedTransaction', () => {
      const transaction = {
        orderId: '123',
        lineItems: [
          {
            product: {
              id: '123'
            }
          },
          {
            product: {
              id: '234'
            }
          }
        ],
        total: 1500
      };

      it('should track completed transaction with default deduplication', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('orderstatus2', {
              orderId: '123',
              total: 1500,
              productIds: '123,234',
              deduplication: 'default'
            }));
            done();
          }
        });
      });

      it('should track completed transaction with deduplication = true', (done) => {
        rtbHouse.setOption('customDeduplication', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('orderstatus2', {
              orderId: '123',
              total: 1500,
              productIds: '123,234',
              deduplication: true
            }));
            done();
          }
        });
      });

      it('should track completed transaction with deduplication = true', (done) => {
        rtbHouse.setOption('customDeduplication', true);
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          context: {
            campaign: {
              source: 'rtbhouse'
            }
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('orderstatus2', {
              orderId: '123',
              total: 1500,
              productIds: '123,234',
              deduplication: false
            }));
            done();
          }
        });
      });

    });

  });
});
