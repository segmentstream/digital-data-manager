import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import Flocktory from '../../src/integrations/Flocktory'
import ddManager from '../../src/ddManager'

import flocktoryStubs from './stubs/Flocktory'

describe('Integrations: Flocktory', () => {
  let flocktory
  const options = {
    siteId: '123',
    preCheckout: true,
    postCheckout: true,
    exchange: true,
    exchangeTriggerEvent: 'Completed Transaction'
  }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: flocktoryStubs.userStub.in,
      events: []
    }
    flocktory = new Flocktory(window.digitalData, options)
    ddManager.addIntegration('Flocktory', flocktory)
  })

  afterEach(() => {
    flocktory.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(flocktory, 'load')
    })

    afterEach(() => {
      flocktory.load.restore()
    })

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.strict.equal(options.siteId, flocktory.getOption('siteId'))
        assert.strict.equal('script', flocktory.getTag().type)
        assert.strict.equal(flocktory.getTag().attr.src, `https://api.flocktory.com/v2/loader.js?site_id=${options.siteId}`)
      })
    })

    describe('#initialize', () => {
      it('should call tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(flocktory.load.calledOnce)
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      ddManager.once('ready', done)
      ddManager.initialize()
      window.flocktory = { push: () => {} }
      sinon.stub(window.flocktory, 'push')
    })

    afterEach(() => {
      window.flocktory.push.reset()
      ddManager.reset()
      reset()
    })

    describe('#onViewedProductDetail', () => {
      it('should push flocktory trackItemView event', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['trackItemView', {
              item: {
                id: '123'
              }
            }]))
          }
        })
      })
    })

    describe('#onViewedProductListing', () => {
      it('should push flocktory trackCategoryView event', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          category: 'Ecommerce',
          listing: {
            categoryId: '1'
          },
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['trackCategoryView', {
              category: {
                id: '1'
              }
            }]))
          }
        })
      })
    })

    describe('#onAddedProduct', () => {
      it('should push flocktory addToCart event', () => {
        const { onAddedProductStub } = flocktoryStubs
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: onAddedProductStub.in,
          quantity: 2,
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['addToCart', onAddedProductStub.out]))
          }
        })
      })
    })

    describe('#onRemovedProduct', () => {
      it('should push flocktory removedFromCart event', () => {
        const { onRemovedProductStub } = flocktoryStubs
        window.digitalData.events.push({
          name: 'Removed Product',
          category: 'Ecommerce',
          product: onRemovedProductStub.in,
          quantity: 2,
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['removeFromCart', onRemovedProductStub.out]))
          }
        })
      })
    })

    describe('#onCompletedTransaction', () => {
      it('should push flocktory postcheckout event', () => {
        const { userStub, onCompletedTransactionStub } = flocktoryStubs
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: onCompletedTransactionStub.in,
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['postcheckout', {
              user: userStub.out,
              order: onCompletedTransactionStub.out
            }]))
          }
        })
      })

      it('should push flocktory exchange event', () => {
        const { userStub, onCompletedTransactionStub } = flocktoryStubs
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: onCompletedTransactionStub.in,
          spot: 'example',
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['exchange', {
              user: userStub.out,
              spot: 'example',
              params: {}
            }]))
          }
        })
      })
    })
    describe('#onCustomExchangeEvent', () => {
      beforeEach(() => {
        flocktory.setOption('exchangeTriggerEvent', 'Test')
      })

      it('should push flocktory exchange event', () => {
        const { userStub } = flocktoryStubs
        window.digitalData.events.push({
          name: 'Test',
          spot: 'example',
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['exchange', {
              user: userStub.out,
              spot: 'example',
              params: {}
            }]))
          }
        })
      })

      it('should push flocktory exchange event with user data from event', () => {
        window.digitalData.events.push({
          name: 'Test',
          user: {
            firstName: 'Bob',
            lastName: 'Saget',
            email: 'bobs@test.com'
          },
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['exchange', {
              user: {
                name: 'Bob Saget',
                email: 'bobs@test.com'
              },
              params: {}
            }]))
          }
        })
      })

      it('should not push flocktory exchange event when exchange is disabled', () => {
        flocktory.setOption('exchange', false)
        window.digitalData.events.push({
          name: 'Test',
          spot: 'example',
          callback: () => {
            assert.ok(window.flocktory.push.notCalled)
          }
        })
      })
    })

    describe('#onSemanticExchangeEvent', () => {
      beforeEach(() => {
        flocktory.setOption('exchangeTriggerEvent', 'Added Product')
      })

      it('should push flocktory exchange event', () => {
        const { userStub } = flocktoryStubs
        window.digitalData.events.push({
          name: 'Added Product',
          spot: 'example',
          callback: () => {
            assert.ok(window.flocktory.push.calledWith(['exchange', {
              user: userStub.out,
              spot: 'example',
              params: {}
            }]))
          }
        })
      })
    })
  })

  describe('after loading SPA site', () => {
    beforeEach((done) => {
      ddManager.once('ready', done)
      ddManager.initialize({
        sendViewedPageEvent: false
      })
      window.flocktory = { reInit: () => {} }
      sinon.stub(window.flocktory, 'reInit')
    })

    afterEach(() => {
      window.flocktory.reInit.reset()
      ddManager.reset()
      reset()
    })

    describe('#onViewedPage', () => {
      it('should call reInit', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(!window.flocktory.reInit.called)
            window.digitalData.events.push({
              name: 'Viewed Page',
              callback: () => {
                assert.ok(window.flocktory.reInit.called)
              }
            })
          }
        })
      })
    })
  })
})
