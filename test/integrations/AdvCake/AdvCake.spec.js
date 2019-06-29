import assert from 'assert'
import sinon from 'sinon'
import reset from '../../reset'
import AdvCake from '../../../src/integrations/AdvCake'
import ddManager from '../../../src/ddManager'

import advCakeStubs from './stubs'

describe('Integrations: AdvCake', () => {
  let advCake
  const options = {
    cookieTracking: true,
    trackIdCookieName: 'advcake_trackid',
    urlCookieName: 'advcake_url',
    cookieTtl: 90,
    deduplication: false,
    utmSource: 'advcake'
  }
  const { cartStub } = advCakeStubs

  beforeEach(() => {
    window.digitalData = {}
    advCake = new AdvCake(window.digitalData, options)
    ddManager.addIntegration('AdvCake', advCake)
  })

  afterEach(() => {
    advCake.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.strict.deepEqual(options, {
          cookieTracking: advCake.getOption('cookieTracking'),
          trackIdCookieName: advCake.getOption('trackIdCookieName'),
          urlCookieName: advCake.getOption('urlCookieName'),
          cookieTtl: advCake.getOption('cookieTtl'),
          deduplication: advCake.getOption('deduplication'),
          utmSource: advCake.getOption('utmSource')
        })
      })
    })
    describe('#initialize', () => {
      it('should initialize advcake push data', () => {
        ddManager.initialize()
        assert.ok(window.advcake_push_data)
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(advCake, 'load')
      ddManager.once('ready', done)
      ddManager.initialize({
        sendViewedPageEvent: false
      })
    })

    afterEach(() => {
      advCake.load.restore()
    })

    describe('#onViewedPage', () => {
      it('should track home page, cart and authorized user', () => {
        const { onViewedHomePageAuthorizedStub } = advCakeStubs
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          user: {
            email: 'test@test.com'
          },
          cart: cartStub,
          callback: () => {
            assert.strict.deepEqual(window.advcake_data, onViewedHomePageAuthorizedStub)
          }
        })
      })

      it('should track home page, cart and unauthorized user', () => {
        const { onViewedHomePageUnauthorizedStub } = advCakeStubs
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          cart: cartStub,
          callback: () => {
            assert.strict.deepEqual(window.advcake_data, onViewedHomePageUnauthorizedStub)
          }
        })
      })
    })

    describe('#onViewedProductPage', () => {
      const { onViewedProductPageStub } = advCakeStubs
      it('should track product page', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'product'
          },
          user: {
            email: 'test@test.com'
          },
          cart: cartStub
        })
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: onViewedProductPageStub.in,
          callback: () => {
            assert.strict.deepEqual(window.advcake_data, onViewedProductPageStub.out)
          }
        })
      })
    })

    describe('#onViewedProductListing', () => {
      const { onViewedListingPageStub } = advCakeStubs
      it('should track product listing page', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'listing'
          }
        })
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: onViewedListingPageStub.in,
          callback: () => {
            assert.strict.deepEqual(window.advcake_data, onViewedListingPageStub.out)
          }
        })
      })
    })

    describe('#onViewedCart', () => {
      const { onViewedCartPageStub } = advCakeStubs
      it('should track cart page', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'cart'
          },
          cart: cartStub
        })
        window.digitalData.events.push({
          name: 'Viewed Cart',
          callback: () => {
            assert.strict.deepEqual(window.advcake_data, onViewedCartPageStub)
          }
        })
      })
    })

    describe('#onCompletedTransaction', () => {
      const { onCompletedTransactionStub } = advCakeStubs
      it('should track completed transaction with default deduplication', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'confirmation'
          }
        })
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: onCompletedTransactionStub.in,
          callback: () => {
            assert.strict.deepEqual(window.advcake_data, onCompletedTransactionStub.out)
            done()
          }
        })
        assert.ok(window.advcake_order.load.calledWith('123', 200))
      })

      it('should track completed transaction with deduplication = true', (done) => {
        advCake.setOption('deduplication', true)
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'confirmation'
          }
        })
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: onCompletedTransactionStub.in,
          context: {
            campaign: {
              source: 'advCake'
            }
          },
          callback: () => {
            assert.strict.deepEqual(window.advcake_data, onCompletedTransactionStub.out)
            done()
          }
        })
        assert.ok(window.advcake_order.load.calledWith('123', 200))
      })
    })
  })
})
