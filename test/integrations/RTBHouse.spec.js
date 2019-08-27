import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import RTBHouse from '../../src/integrations/RTBHouse'
import ddManager from '../../src/ddManager'

describe('Integrations: RTBHouse', () => {
  let rtbHouse
  const options = {
    accountKey: 'xxx',
    customDeduplication: false
  }

  beforeEach(() => {
    window.digitalData = {
      user: {
        email: 'a@a.ru'
      }
    }
    rtbHouse = new RTBHouse(window.digitalData, options)
    ddManager.addIntegration('RTBHouse', rtbHouse)
  })

  afterEach(() => {
    rtbHouse.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.strict.equal(options.accountKey, rtbHouse.getOption('accountKey'))
        assert.strict.equal(options.customDeduplication, rtbHouse.getOption('customDeduplication'))
      })
    })
  })

  describe('before loading', () => {
    describe('#initialize', () => {
      it('should initialize', () => {
        ddManager.initialize()
        assert.ok(rtbHouse.isLoaded())
      })

      it('should not load any tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(!rtbHouse.load.calledOnce)
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(rtbHouse, 'load')
      ddManager.once('ready', done)
      ddManager.initialize({
        sendViewedPageEvent: false
      })
    })

    afterEach(() => {
      rtbHouse.load.restore()
    })

    describe('#onViewedPage', () => {
      it('should track home page', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('home', {
              userSegmentParams: '',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })

      it('should track home page with user segment', () => {
        rtbHouse.setOption('userSegmentVar', 'user.rtbHouseSegment')
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
              userSegmentParams: '&id=pr_xxx_custom_user_0',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })

      it('should track other page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'content'
          },
          callback: () => {
            setTimeout(() => {
              assert.ok(rtbHouse.load.calledWith({
                userSegmentParams: '',
                uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
              }))
              done()
            }, 200)
          }
        })
      })

      it('should track other page with custom user segment', (done) => {
        rtbHouse.setOption('userSegmentVar', 'user.rtbHouseSegment')
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
                userSegmentParams: '&id=pr_xxx_custom_user_vip',
                uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
              }))
              done()
            }, 200)
          }
        })
      })
    })

    describe('#onViewedPage with crossDeviceTracking', () => {
      it('should track home page and sent uid', () => {
        rtbHouse.setOption('crossDeviceTracking', true)

        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('home', {
              userSegmentParams: '',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })

    describe('#onViewedCart', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' })
      })

      it('should track cart info', () => {
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
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })

    describe('#onUpdatedCart', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' })
      })

      it('should track updated cart info', () => {
        window.digitalData.events.push({
          name: 'Updated Cart',
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
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })

    describe('#onViewedProductDetail', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' })
      })

      it('should track product detail page', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('offer', {
              productId: '123',
              userSegmentParams: '',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })

    describe('#onViewedProductListing', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' })
      })

      it('should track product category listing page', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            categoryId: '123'
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('category2', {
              categoryId: '123',
              userSegmentParams: '',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })

    describe('#onSearchedProducts', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' })
      })

      it('should track search results page', () => {
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
              }
            ]
          },
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('listing', {
              productIds: '123,234,345,456,567',
              userSegmentParams: '',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })

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
        window.digitalData.events.push({ name: 'Viewed Page' })
      })

      it('should track first checkout step', () => {
        window.digitalData.events.push({
          name: 'Started Order',
          callback: () => {
            assert.ok(rtbHouse.load.calledWith('startorder', {
              userSegmentParams: '',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })

      it('should not track second+ checkout step', () => {
        window.digitalData.events.push({
          name: 'Viewed Checkout Step',
          step: 2,
          callback: () => {
            assert.ok(!rtbHouse.load.calledWith('startorder', {
              userSegmentParams: '',
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })

    describe('#onCompletedTransaction', () => {
      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' })
      })

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
      }

      it('should track completed transaction with default deduplication', () => {
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
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })

      it('should track completed transaction with deduplication = true', () => {
        rtbHouse.setOption('customDeduplication', true)
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
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })

      it('should track completed transaction with deduplication = true', () => {
        rtbHouse.setOption('customDeduplication', true)
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
              uidParams: '&id=pr_xxx_uid_4745a667f680c6dc4e74568dd828d6e8d9dfc2fdb142d8f90ef6aeac191be17e'
            }))
          }
        })
      })
    })
  })
})
