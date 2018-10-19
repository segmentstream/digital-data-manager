import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import RTBHouse from './../../src/integrations/RTBHouse.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: RTBHouse', () => {
  let rtbHouse;
  const options = {
    accountKey: 'xxx',
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
            assert.ok(rtbHouse.load.calledWith('home', {
              userSegmentParams: '',
            }));
            done();
          }
        })
      });

      it('should track home page with user segment', (done) => {
        rtbHouse.setOption('userSegmentVar', 'user.rtbHouseSegment');
        window.digitalData.events.push({
          name: 'Viewed Page',
          user: {
            rtbHouseSegment: 0
          },
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('home', {
              userSegmentParams: '&id1=pr_xxx_custom_user_0'
            }));
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
              assert.ok(rtbHouse.load.calledWith({
                userSegmentParams: ''
              }));
              done();
            }, 200)
          }
        })
      });

      it('should track other page with custom user segment', (done) => {
        rtbHouse.setOption('userSegmentVar', 'user.rtbHouseSegment');
        window.digitalData.events.push({
          name: 'Viewed Page',
          user: {
            rtbHouseSegment: 'vip'
          },
          page: {
            type: 'content'
          },
          callback: () => {
            setTimeout(() => {
              assert.ok(rtbHouse.load.calledWith({
                userSegmentParams: '&id1=pr_xxx_custom_user_vip'
              }));
              done();
            }, 200)
          }
        })
      });
    });

    describe('#onViewedCart', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

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
              productIds: '123,234',
              userSegmentParams: '',
            }));
            done();
          }
        })
      });
    });

    describe('#onViewedProductDetail', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

      it('should track product detail page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('offer', {
              productId: '123',
              userSegmentParams: '',
            }));
            done();
          }
        })
      });
    });

    describe('#onViewedProductListing', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

      it('should track product category listing page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            categoryId: '123'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('category2', {
              categoryId: '123',
              userSegmentParams: '',
            }));
            done();
          }
        })
      });
    });

    describe('#onSearchedProducts', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

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
              productIds: '123,234,345,456,567',
              userSegmentParams: '',
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
              productId: '123',
              userSegmentParams: '',
            }));
            done();
          }
        })
      });
    });
    */

    describe('#onStartedOrder', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

      it('should track first checkout step', (done) => {
        window.digitalData.events.push({
          name: 'Started Order',
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('startorder', {
              userSegmentParams: '',
            }));
            done();
          },
        });
      });

      it('should not track second+ checkout step', (done) => {

        window.digitalData.events.push({
          name: 'Viewed Checkout Step',
          step: 2,
          callback: () => {
            assert.ok(!rtbHouse.load.calledWith('startorder', {
              userSegmentParams: '',
            }));
            done();
          }
        })
      });
    });

    describe('#onCompletedTransaction', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' });
      });

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
              deduplication: 'default',
              userSegmentParams: '',
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
              deduplication: true,
              userSegmentParams: '',
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
              deduplication: false,
              userSegmentParams: '',
            }));
            done();
          }
        });
      });

    });

  });
});
