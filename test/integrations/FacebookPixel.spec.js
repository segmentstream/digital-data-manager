import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import FacebookPixel from '../../src/integrations/FacebookPixel'
import ddManager from '../../src/ddManager'

describe('Integrations: FacebookPixel', () => {
  let fbPixel
  const pixelId = '946986105422948'
  const options = {
    pixelId,
    customEvents: {
      'Downloaded Tutorial': 'TutorialDownload',
      'Applied For Trial': 'Lead'
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
    })

    afterEach(() => {
      window.fbq.restore()
    })

    it('should initialize fbq object', () => {
      assert.ok(window.fbq)
      assert.ok(typeof fbq === 'function')
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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1'
            }), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called`)
            done()
          }
        })
      })

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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1'
            }), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called with correct params`)
            done()
          }
        })
      })

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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1'
            }), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called`)
            done()
          }
        })
      })

      it('should call fbq track ViewContent with price as event value', (done) => {
        fbPixel.setOption('usePriceAsEventValue', true)
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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1',
              value: 10000,
              currency: 'USD'
            }), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called`)
            done()
          }
        })
      })

      it('should call fbq track ViewContent (digitalData)', (done) => {
        window.digitalData.product = {
          id: '123',
          name: 'Test Product',
          category: ['Category 1', 'Subcategory 1'],
          currency: 'USD',
          unitSalePrice: 10000
        }
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'ViewContent', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1'
            }), `fbq('trackSingle', ${pixelId}, 'ViewContent') was not called`)
            done()
          }
        })
      })
    })

    describe('#onSearchedProducts', () => {
      it('should call fbq track Search', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            query: 'Test Query'
          },
          quantity: 2,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Search', {
              search_string: 'Test Query'
            }), `fbq('trackSingle', ${pixelId}, 'Search') was not called`)
            done()
          }
        })
      })
    })

    describe('#onAddedProductToWishlist', () => {
      it('should call fbq track AddToWishlist', (done) => {
        window.digitalData.events.push({
          name: 'Added Product to Wishlist',
          product: {
            id: '123',
            name: 'Test Product',
            category: ['Category 1', 'Subcategory 1']
          },
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToWishlist', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1'
            }), `fbq('trackSingle', ${pixelId}, 'AddToWishlist') was not called`)
            done()
          }
        })
      })
    })

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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1'
            }), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })

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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1'
            }), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })

      it('should call fbq track AddToCart', (done) => {
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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1/Subcategory 1'
            }), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })

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
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'AddToCart', {
              content_ids: ['123'],
              content_type: 'product',
              content_name: 'Test Product',
              content_category: 'Category 1'
            }), `fbq('trackSingle', ${pixelId}, 'AddToCart') was not called`)
            done()
          }
        })
      })
    })

    describe('#onStartedOrder', () => {
      const cart = {
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
      }

      it('should call fbq track InitiateCheckout', (done) => {
        fbPixel.setOption('usePriceAsEventValue', true)
        window.digitalData.cart = cart
        window.digitalData.events.push({
          name: 'Started Order',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'InitiateCheckout', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), `fbq('trackSingle', ${pixelId}, 'InitiateCheckout') was not called`)
            done()
          }
        })
      })
    })

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
      }

      it('should call fbq track Purchase', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction,
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), `fbq('trackSingle', ${pixelId}, 'Purchase') was not called`)
            done()
          }
        })
      })

      it('should call fbq track Purchase (digitalData)', (done) => {
        window.digitalData.transaction = transaction
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Purchase', {
              content_ids: ['123', '234'],
              content_type: 'product',
              currency: 'USD',
              value: 20000
            }), `fbq('trackSingle', ${pixelId}, 'Purchase') was not called`)
            done()
          }
        })
      })
    })

    describe('#onCustomEvent', () => {
      it('should call fbq track for custom event', (done) => {
        window.digitalData.events.push({
          name: 'Downloaded Tutorial',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingleCustom', pixelId, 'TutorialDownload'),
              `fbq('trackSingleCustom', ${pixelId}, "'Downloaded' Tutorial") was not called`)
            done()
          }
        })
      })

      it('should call fbq track for standard event', (done) => {
        window.digitalData.events.push({
          name: 'Applied For Trial',
          callback: () => {
            assert.ok(window.fbq.calledWith('trackSingle', pixelId, 'Lead'),
              `fbq('trackSingle', ${pixelId}, 'Lead') was not called`)
            done()
          }
        })
      })
    })
  })
})
