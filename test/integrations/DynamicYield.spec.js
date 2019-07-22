import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import DynamicYield, {
  HOME_PAGE_TYPE,
  OTHER_PAGE_TYPE,
  PRODUCT_PAGE_TYPE,
  LISTING_PAGE_TYPE,
  CART_PAGE_TYPE
} from '../../src/integrations/DynamicYield'
import ddManager from '../../src/ddManager'

import dynamicYieldStubs from './stubs/DynamicYield'

describe('Integrations: DynamicYield', () => {
  let dynamicYield

  const options = {
    accountId: '8772050',
    feedWithGroupedProducts: false
  }

  beforeEach(() => {
    window.digitalData = {
      page: {},
      user: {},
      events: []
    }
    dynamicYield = new DynamicYield(window.digitalData, options)
    ddManager.addIntegration('DynamicYield', dynamicYield)
  })

  afterEach(() => {
    dynamicYield.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(dynamicYield, 'load').callsFake(() => {
        window.DY = { API: sinon.spy() }
        dynamicYield.onLoad()
      })
    })

    afterEach(() => {
      dynamicYield.reset()
      sinon.reset()
      reset()
    })

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.strict.equal(options.accountId, dynamicYield.getOption('accountId'))
        assert.strict.equal(options.feedWithGroupedProducts, dynamicYield.getOption('feedWithGroupedProducts'))
      })
    })

    describe('#initialize', () => {
      it('should initialize Dynamic Yield', (done) => {
        ddManager.initialize()
        setTimeout(() => {
          assert.ok(window.DY.API)
          ddManager.reset()
          done()
        }, 101)
      })
    })
  })

  describe('after loading', () => {
    const { userStub } = dynamicYieldStubs
    beforeEach(() => {
      sinon.stub(dynamicYield, 'load').callsFake(() => {
        window.DY = window.DY || {}
        window.DY.API = sinon.spy()
        dynamicYield.onLoad()
      })
    })

    afterEach(() => {
      ddManager.reset()
      dynamicYield.load.restore()
    })

    describe('without initial Viewed Page event', () => {
      beforeEach((done) => {
        ddManager.once('ready', done)
        ddManager.initialize({ sendViewedPageEvent: false })
      })

      describe('#onViewedHome', () => {
        it('should send home page recommendation context', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {
              type: 'home'
            },
            callback: () => {
              setTimeout(() => {
                assert.strict.deepEqual(window.DY.recommendationContext, {
                  type: HOME_PAGE_TYPE
                })
                done()
              }, 101)
            }
          })
        })

        it('should not send recommendation context if DY was already loaded synchronously', (done) => {
          window.DY = {
            recommendationContext: {
              type: OTHER_PAGE_TYPE
            }
          }
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {
              type: 'home'
            },
            callback: () => {
              setTimeout(() => {
                assert.strict.deepEqual(window.DY.recommendationContext, {
                  type: OTHER_PAGE_TYPE
                })
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onViewedOtherPage', () => {
        it('should send other recommendation context', (done) => {
          window.digitalData.events.push({
            name: 'Viewed Page',
            page: {
              type: 'content'
            },
            callback: () => {
              setTimeout(() => {
                assert.strict.deepEqual(window.DY.recommendationContext, {
                  type: OTHER_PAGE_TYPE
                })
                done()
              }, 101)
            }
          })
        })
      })
    })

    describe('with initial View Page event', () => {
      beforeEach((done) => {
        ddManager.once('ready', done)
        ddManager.initialize()
      })

      describe('#onViewedProductDetail', () => {
        it('should send product detail recommendation context', (done) => {
          window.digitalData.product = {
            id: '123'
          }
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            callback: () => {
              setTimeout(() => {
                assert.strict.deepEqual(window.DY.recommendationContext, {
                  type: PRODUCT_PAGE_TYPE,
                  data: ['123']
                })
                done()
              }, 101)
            }
          })
        })

        it('should send product detail recommendation context with grouped product feed', (done) => {
          dynamicYield.setOption('feedWithGroupedProducts', true)
          window.digitalData.product = {
            id: '123',
            skuCode: '1234'
          }
          window.digitalData.events.push({
            name: 'Viewed Product Detail',
            callback: () => {
              setTimeout(() => {
                assert.strict.deepEqual(window.DY.recommendationContext, {
                  type: PRODUCT_PAGE_TYPE,
                  data: ['1234']
                })
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onViewedProductListing', () => {
        it('should send product listing recommendation context', (done) => {
          window.digitalData.listing = {
            category: ['Clothing']
          }
          window.digitalData.events.push({
            name: 'Viewed Product Listing',
            callback: () => {
              setTimeout(() => {
                assert.strict.deepEqual(window.DY.recommendationContext, {
                  type: LISTING_PAGE_TYPE,
                  data: ['Clothing']
                })
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onViewedCart', () => {
        const { onViewedCartStub } = dynamicYieldStubs
        it('should send cart recommendation context', (done) => {
          window.digitalData.cart = onViewedCartStub.in
          window.digitalData.events.push({
            name: 'Viewed Cart',
            callback: () => {
              setTimeout(() => {
                assert.strict.deepEqual(window.DY.recommendationContext, {
                  type: CART_PAGE_TYPE,
                  data: onViewedCartStub.out
                })
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onAddedProduct', () => {
        const { onAddedProductStub } = dynamicYieldStubs
        it('should send Add to Cart API call', (done) => {
          window.digitalData.cart = onAddedProductStub.in.cart
          window.digitalData.events.push({
            name: 'Added Product',
            product: onAddedProductStub.in.product,
            quantity: 2,
            callback: () => {
              setTimeout(() => {
                window.DY.API.calledWith('event', onAddedProductStub.out)
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onCompletedTransaction', () => {
        const { onCompletedTransactionStub } = dynamicYieldStubs
        it('should send Purchase API call', (done) => {
          window.digitalData.events.push({
            name: 'Completed Transaction',
            transaction: onCompletedTransactionStub.in,
            callback: () => {
              setTimeout(() => {
                window.DY.API.calledWith('event', onCompletedTransactionStub.out)
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onLoggedIn', () => {
        it('should send Login API call', (done) => {
          window.digitalData.events.push({
            name: 'Logged In',
            user: userStub.in,
            callback: () => {
              setTimeout(() => {
                window.DY.API.calledWith('event', userStub.outRegistered)
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onRegistered', () => {
        it('should send Login API call', (done) => {
          window.digitalData.events.push({
            name: 'Logged In',
            user: userStub.in,
            callback: () => {
              setTimeout(() => {
                window.DY.API.calledWith('event', userStub.outRegistered)
                done()
              }, 101)
            }
          })
        })
      })

      describe('#onSubscribed', () => {
        it('should send Login API call', (done) => {
          window.digitalData.events.push({
            name: 'Subscribed',
            user: userStub.in,
            callback: () => {
              setTimeout(() => {
                window.DY.API.calledWith('event', userStub.outSubscribed)
                done()
              }, 101)
            }
          })
        })
      })
    })
  })
})
