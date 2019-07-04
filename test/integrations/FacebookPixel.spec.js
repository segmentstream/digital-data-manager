import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import FacebookPixel from '../../src/integrations/FacebookPixel'
import ddManager from '../../src/ddManager'

import facebookPixelStubs from './stubs/FacebookPixel'

describe('Integrations: FacebookPixel', () => {
  let fbPixel
  const pixelId = '946986105422948'
  const options = {
    pixelId,
    customEvents: {
      'Applied For Trial': 'Lead',
      'Downloaded Tutorial': 'TutorialDownload'
    },
    eventParameters: {
      resultsCount: {
        type: 'event',
        value: 'listing.resultsCount'
      },
      trialType: {
        type: 'event',
        value: 'trialType'
      },
      paramExample: {
        type: 'digitalData',
        value: 'paramExample'
      }
    }
  }

  beforeEach(() => {
    fbPixel = new FacebookPixel(window.digitalData, options)
    ddManager.addIntegration('Facebook Pixel', fbPixel)
  })

  afterEach(() => {
    fbPixel.reset()
    ddManager.reset()
    reset()
  })

  describe('#constructor', () => {
    it('should create Facebook Pixel integrations with proper options and tags', () => {
      assert.strict.equal(options.pixelId, fbPixel.getOption('pixelId'))
      assert.strict.equal('script', fbPixel.getTag().type)
    })
  })

  describe('#load', () => {
    it('should load', (done) => {
      assert.ok(!fbPixel.isLoaded())
      sinon.stub(fbPixel, 'load').callsFake(() => {
        window.fbq.callMethod = () => {}
        fbPixel.onLoad()
      })
      fbPixel.once('load', () => {
        assert.ok(fbPixel.isLoaded())
        done()
      })
      ddManager.initialize()
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(fbPixel, 'load').callsFake(() => {
        fbPixel.onLoad()
      })
      fbPixel.once('ready', done)
      ddManager.initialize()
      sinon.spy(window, 'fbq')
      window.digitalData.paramExample = 'example'
    })

    afterEach(() => {
      window.fbq.restore()
    })

    it('should initialize fbq object', () => {
      assert.ok(typeof window.fbq === 'function')
      assert.strict.equal(window.fbq.queue[0][0], 'init')
      assert.strict.equal(window.fbq.queue[0][1], options.pixelId)
    })

    describe('#onViewedPage', () => {
      it('should call fbq track PageView', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'PageView'))
            done()
          }
        })
      })
    })

    describe('#onViewedProductDetail', () => {
      const {
        onViewedProductDetailStub,
        onViewedProductDetailStubLegacy,
        onViewedProductDetailStubLegacySubcategory
      } = facebookPixelStubs
      it('should call fbq track ViewContent (legacy product.category format)', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: onViewedProductDetailStubLegacy.in,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', onViewedProductDetailStubLegacy.out
            ))
            done()
          }
        })
      })

      it('should call fbq track ViewContent (legacy product.category with product.subcategory format)', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: onViewedProductDetailStubLegacySubcategory.in,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', onViewedProductDetailStubLegacySubcategory.out
            ), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called with correct params`)
            done()
          }
        })
      })

      it('should call fbq track ViewContent', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: onViewedProductDetailStub.in,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', onViewedProductDetailStub.out
            ), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called`)
            done()
          }
        })
      })

      it('should call fbq track ViewContent with price as event value', (done) => {
        fbPixel.setOption('usePriceAsEventValue', true)
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: onViewedProductDetailStub.in,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', onViewedProductDetailStub.outWithValue
            ), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called`)
            done()
          }
        })
      })

      it('should call fbq track ViewContent (digitalData)', (done) => {
        window.digitalData.product = onViewedProductDetailStub.in
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', onViewedProductDetailStub.out
            ), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called`)
            done()
          }
        })
      })
    })

    describe('#onSearchedProducts', () => {
      it('should call fbq track Search with event parameter', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            query: 'Test Query',
            resultsCount: 5
          },
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Search', {
              search_string: 'Test Query',
              resultsCount: 5,
              paramExample: 'example'
            }))
            done()
          }
        })
      })
    })

    describe('#onAddedProductToWishlist', () => {
      const { onAddedProductToWishlistStub } = facebookPixelStubs
      it('should call fbq track AddToWishlist', (done) => {
        window.digitalData.events.push({
          name: 'Added Product to Wishlist',
          product: onAddedProductToWishlistStub.in,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToWishlist', onAddedProductToWishlistStub.out
            ), `fbq('trackSingle', ${pixelId}, 'AddToWishlist') was not called`)
            done()
          }
        })
      })
    })

    describe('#onAddedProduct', () => {
      const {
        onAddedProductStub,
        onAddedProductStubLegacy,
        onAddedProductStubLegacySubcategory
      } = facebookPixelStubs
      it('should call fbq track AddToCart (legacy product.category format)', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: onAddedProductStubLegacy.in,
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', onAddedProductStubLegacy.out
            ), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })

      it('should call fbq track AddToCart (legacy product.category format with product.subcategory)', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: onAddedProductStubLegacySubcategory.in,
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', onAddedProductStubLegacySubcategory.out
            ), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })

      it('should call fbq track AddToCart', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: onAddedProductStub.in,
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', onAddedProductStub.out
            ), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })

      it('should call fbq track ViewContent even without quantity param', (done) => {
        window.digitalData.events.push({
          name: 'Added Product',
          category: 'Ecommerce',
          product: onAddedProductStub.in,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', onAddedProductStub.out
            ), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })
    })

    describe('#onStartedOrder', () => {
      const { onStartedOrderStub } = facebookPixelStubs
      const cart = onStartedOrderStub.in

      it('should call fbq track InitiateCheckout', (done) => {
        fbPixel.setOption('usePriceAsEventValue', true)
        window.digitalData.cart = cart
        window.digitalData.events.push({
          name: 'Started Order',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'InitiateCheckout', onStartedOrderStub.out
            ), `fbq('trackSingle', ${pixelId}, 'InitiateCheckout') was not called`)
            done()
          }
        })
      })
    })

    describe('#onCompletedTransaction', () => {
      const { onCompletedTransactionStub } = facebookPixelStubs
      const transaction = onCompletedTransactionStub.in

      it('should call fbq track Purchase', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Purchase', onCompletedTransactionStub.out
            ), `fbq('trackSingle', ${pixelId}, 'Purchase') was not called`)
            done()
          }
        })
      })

      it('should call fbq track Purchase (digitalData)', (done) => {
        window.digitalData.transaction = transaction
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Purchase', onCompletedTransactionStub.out
            ), `fbq('trackSingle', ${pixelId}, 'Purchase') was not called`)
            done()
          }
        })
      })
    })

    describe('#onCustomEvent', () => {
      it('should call fbq track for custom event with custom parameter', (done) => {
        window.digitalData.events.push({
          name: 'Downloaded Tutorial',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingleCustom', pixelId, 'TutorialDownload', { paramExample: 'example' }),
              `fbq('trackSingleCustom', ${pixelId}, 'Downloaded Tutorial') was not called`)
            done()
          }
        })
      })

      it('should call fbq track for standard event with custom parameter', (done) => {
        window.digitalData.events.push({
          name: 'Applied For Trial',
          trialType: '3-month',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Lead', { trialType: '3-month', paramExample: 'example' }),
              `fbq('trackSingle', ${pixelId}, 'Lead') was not called`)
            done()
          }
        })
      })
    })
  })
})
