import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import Target2Sell, {
  HOME_PAGE_ID,
  OTHER_PAGE_ID,
  PRODUCT_PAGE_ID,
  LISTING_PAGE_ID,
  CART_PAGE_ID,
  SEARCH_PAGE_ID,
  EMPTY_SEARCH_PAGE_ID,
  CONFIRMATION_PAGE_ID
} from '../../src/integrations/Target2Sell'
import ddManager from '../../src/ddManager'

import target2SellStubs from './stubs/Target2Sell'

describe('Integrations: Target2Sell', () => {
  let target2Sell
  const options = {
    clientId: '123',
    feedWithGroupedProducts: false,
    hasRankOption: false
  }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      events: []
    }
    target2Sell = new Target2Sell(window.digitalData, options)
    ddManager.addIntegration('Target2Sell', target2Sell)

    sinon.stub(target2Sell, 'load').callsFake(() => {
      window.T2S = { _sendTracking: sinon.spy() }
      target2Sell.onLoad()
    })
  })

  afterEach(() => {
    ddManager.reset()
    reset()
    target2Sell.reset()
    sinon.restore()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.strictEqual(options.clientId, target2Sell.getOption('clientId'))
        assert.strictEqual(options.feedWithGroupedProducts, target2Sell.getOption('feedWithGroupedProducts'))
        assert.strictEqual(options.hasRankOption, target2Sell.getOption('hasRankOption'))
      })
    })
    describe('#initialize', () => {
      it('should initialize', () => {
        ddManager.initialize()

        assert.ok(target2Sell.isLoaded())
      })

      it('should not load any tags after initialization', () => {
        ddManager.initialize()
        setTimeout(() => {
          assert.ok(target2Sell.load.notCalled)
        }, 110)
      })
    })
  })

  describe('#Async initialization', () => {
    beforeEach(() => {
      ddManager.initialize()
    })

    it('should load script after first event and then call _sendTracking on next events', (done) => {
      assert.ok(!target2Sell.trackingScriptLoaded)
      assert.ok(target2Sell.load.notCalled)

      window.digitalData.events.push({
        name: 'Viewed Cart',
        cart: {
          lineItems: []
        },
        callback: () => {
          assert.ok(target2Sell.load.calledOnce)
          assert.ok(target2Sell.trackingScriptLoaded)
          assert.ok(window.T2S._sendTracking.notCalled)
        }
      })

      window.digitalData.events.push({
        name: 'Viewed Cart',
        cart: {
          lineItems: []
        },
        callback: () => {
          assert.ok(window.T2S._sendTracking.calledOnce)
          done()
        }
      })
    })
  })

  describe('#Api call on home page with user data', () => {
    beforeEach(() => {
      window.digitalData.page.type = 'home'
      window.digitalData.user = {
        userId: '999',
        email: 'test@mail.com'
      }
      ddManager.initialize()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: HOME_PAGE_ID,
              uEM: 'test@mail.com',
              uID: '999',
              hasRankOption: target2Sell.getOption('hasRankOption')
            })
            done()
          }, 110)
        }
      })
    })
  })

  describe('#Api call on content page', () => {
    beforeEach(() => {
      window.digitalData.page.type = 'content'
      ddManager.initialize()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: OTHER_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption')
            })
            done()
          }, 110)
        }
      })
    })
  })

  describe('#Api call on product detail page', () => {
    const { productStub } = target2SellStubs
    beforeEach(() => {
      window.digitalData.page.type = 'product'
      window.digitalData.product = productStub.in
      ddManager.initialize()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Viewed Product Detail',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: PRODUCT_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: productStub.out
            })
            done()
          }, 110)
        }
      })
    })

    it('should init on viewed page with group feed option', (done) => {
      target2Sell.setOption('feedWithGroupedProducts', true)
      window.digitalData.events.push({
        name: 'Viewed Product Detail',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: PRODUCT_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: productStub.outGroupedFeed
            })
            done()
          }, 110)
        }
      })
    })
  })

  describe('#Api call on product listing page', () => {
    const { listingItemsStub } = target2SellStubs
    beforeEach(() => {
      window.digitalData.page.type = 'listing'
      window.digitalData.listing = {
        items: listingItemsStub.in
      }
      ddManager.initialize()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Viewed Product Listing',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: LISTING_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: listingItemsStub.out
            })
            done()
          }, 110)
        }
      })
    })

    it('should init on viewed page with group feed option', (done) => {
      target2Sell.setOption('feedWithGroupedProducts', true)
      window.digitalData.events.push({
        name: 'Viewed Product Listing',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: LISTING_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: listingItemsStub.outGroupedFeed
            })
            done()
          }, 110)
        }
      })
    })
  })

  describe('#Api call on cart page', () => {
    const { lineItemsStub } = target2SellStubs
    beforeEach(() => {
      window.digitalData.page.type = 'cart'
      window.digitalData.cart = {
        lineItems: lineItemsStub.in
      }
      ddManager.initialize()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Viewed Cart',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: CART_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: lineItemsStub.out,
              qTE: lineItemsStub.outQuantities
            })
            done()
          }, 110)
        }
      })
    })

    it('should init on viewed page with group feed option', (done) => {
      target2Sell.setOption('feedWithGroupedProducts', true)
      window.digitalData.events.push({
        name: 'Viewed Cart',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: CART_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: lineItemsStub.outGroupedFeed,
              qTE: lineItemsStub.outQuantities
            })
            done()
          }, 110)
        }
      })
    })
  })

  describe('#Api call on search page', () => {
    const { listingItemsStub } = target2SellStubs
    beforeEach(() => {
      window.digitalData.page = {
        type: 'search',
        queryString: '?q=red'
      }
      window.digitalData.listing = {
        items: listingItemsStub.in
      }
      ddManager.initialize()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Searched Products',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: SEARCH_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: listingItemsStub.out,
              kw: 'red'
            })
            done()
          }, 110)
        }
      })
    })

    it('should init on viewed page with no results', (done) => {
      window.digitalData.events.push({
        name: 'Searched Products',
        listing: {
          items: []
        },
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: EMPTY_SEARCH_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              kw: 'red'
            })
            done()
          }, 110)
        }
      })
    })
  })

  describe('#Api call on confirmation page', () => {
    const { lineItemsStub } = target2SellStubs
    beforeEach(() => {
      window.digitalData.page.type = 'confirmation'
      window.digitalData.transaction = {
        orderId: '555',
        lineItems: lineItemsStub.in,
        total: 100
      }
      ddManager.initialize()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Completed Transaction',
        callback: () => {
          setTimeout(() => {
            assert.strict.deepEqual(window._t2sparams, {
              eN: 'view',
              cID: target2Sell.getOption('clientId'),
              pID: CONFIRMATION_PAGE_ID,
              uEM: undefined,
              uID: undefined,
              hasRankOption: target2Sell.getOption('hasRankOption'),
              iID: lineItemsStub.out,
              qTE: lineItemsStub.outQuantities,
              bS: '100',
              oID: '555',
              priceL: lineItemsStub.outSubtotals
            })
            done()
          }, 110)
        }
      })
    })
  })
})
