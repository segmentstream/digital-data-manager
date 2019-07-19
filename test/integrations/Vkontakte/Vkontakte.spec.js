import assert from 'assert'
import sinon from 'sinon'
import noop from '@segmentstream/utils/noop'
import reset from '../../reset'
import Vkontakte from '../../../src/integrations/Vkontakte'
import ddManager from '../../../src/ddManager'

import vkStubs from './stubs'

describe('Integrations: Vkontakte', () => {
  let vk
  const pixelsPriceListIds = {
    'VK-RTRG-12345-KV78const': '2',
    'VK-RTRG-12345-KV78old': '1',
    'VK-RTRG-12345-KV78evt': '42',
    'VK-RTRG-12345-KV78DD': '99'
  }
  const options = {
    pixels: [
      {
        pixelId: 'VK-RTRG-12345-KV78const',
        priceListId: {
          type: 'constant',
          value: '2'
        }
      },
      {
        pixelId: 'VK-RTRG-12345-KV78old', // TODO drop support of old style on 1 sep 2019
        priceListId: '1'
      },
      {
        pixelId: 'VK-RTRG-12345-KV78evt',
        priceListId: {
          type: 'event',
          value: 'priceListId'
        }
      },
      {
        pixelId: 'VK-RTRG-12345-KV78DD',
        priceListId: {
          type: 'digitalData',
          value: 'website.regionId'
        }
      }
    ],
    customEvents: {
      'Viewed Product Detail': 'product-detail'
    },
    eventPixels: {
      // eslint-disable-next-line
      'Viewed Product Detail': '//vk.com/rtrg?r=Ug6K6tdSZ*shxgTtjsI9bzDBp1ShCs3q3RdXVNHK1asqy2mLKDvJxuvWw8M7hqktulxtbSlnJsT7*/7Jf5MzEfqO3K5TF9z2zwlFLTuWCy3PiRkO9Ga1I6yOoseM*lfVbhVlQRoHjI5Bt66fOiB1TZLJEZ5nGwFALsuVd5WmSrk-'
    },
    eventEnrichments: [
      {
        scope: 'event',
        prop: 'priceListId',
        handler: (event) => '42'
      }
    ]
  }

  beforeEach(() => {
    window.digitalData = {
      page: {},
      user: {},
      website: {
        regionId: '99'
      },
      events: []
    }
    vk = new Vkontakte(window.digitalData, options)
    ddManager.addIntegration('Vkontakte', vk)

    sinon.stub(vk, 'onLoad').callsFake(() => true)
    window.VK = window.VK || {}
    window.VK.Retargeting = window.VK.Retargeting || {
      Init: noop,
      Event: noop,
      Hit: noop,
      ProductEvent: noop
    }
    sinon.stub(window.VK.Retargeting, 'Init')
    sinon.stub(window.VK.Retargeting, 'Event')
    sinon.stub(window.VK.Retargeting, 'ProductEvent')
    sinon.stub(window.VK.Retargeting, 'Hit')
  })

  afterEach(() => {
    vk.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.strictEqual(options.eventPixels, vk.getOption('eventPixels'))
      })
    })

    describe('#initialize', () => {
      it('should call init after initialization', () => {
        ddManager.initialize()
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.spy(vk, 'addPixel')
      ddManager.once('ready', done)
      ddManager.initialize()
    })

    afterEach(() => {
      vk.addPixel.restore()
    })

    describe('#onViewedPageEvent', () => {
      it('should send a hit for each pixel', () => {
        assert.ok(window.VK.Retargeting.Hit.callCount === 4)
      })

      it('should call retargeting other page event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'content'
          },
          callback: () => {
            setTimeout(() => {
              const myPixels = vk.getOption('pixels')
              myPixels.forEach((pixel) => {
                assert.ok(window.VK.Retargeting.ProductEvent.calledWith(pixelsPriceListIds[pixel.pixelId], 'view_other'))
              })
              done()
            }, 120)
          }
        })
      })
    })

    describe('#onViewedProductListingEvent', () => {
      it('should call retargeting view category event', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing: {
            items: vkStubs.listingItemsStub.in,
            categoryId: '2'
          },
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(pixelsPriceListIds[pixel.pixelId], 'view_category', {
                category_ids: ['2'],
                products_recommended_ids: vkStubs.listingItemsStub.out
              }))
            })
          }
        })
      })
    })

    describe('#onViewedProductEvent', () => {
      it('should call retargeting view product event', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: vkStubs.productStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'view_product',
                vkStubs.productStub.out
              ))
            })
          }
        })
      })
    })

    describe('#onAddedProductEvent', () => {
      it('should call retargeting add to cart event', () => {
        window.digitalData.events.push({
          name: 'Added Product',
          product: vkStubs.productStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'add_to_cart',
                vkStubs.productStub.out
              ))
            })
          }
        })
      })
    })

    describe('#onRemovedProductEvent', () => {
      it('should call retargeting remove from cart event', () => {
        window.digitalData.events.push({
          name: 'Removed Product',
          product: vkStubs.productStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'remove_from_cart',
                vkStubs.productStub.out
              ))
            })
          }
        })
      })
    })

    describe('#onAddedProductToWishlistEvent', () => {
      it('should call retargeting add to wishlist event', () => {
        window.digitalData.events.push({
          name: 'Added Product to Wishlist',
          product: vkStubs.productStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'add_to_wishlist',
                vkStubs.productStub.out
              ))
            })
          }
        })
      })
    })

    describe('#onRemovedProductFromWishlistEvent', () => {
      it('should call retargeting remove from wishlist event', () => {
        window.digitalData.events.push({
          name: 'Removed Product from Wishlist',
          product: vkStubs.productStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'remove_from_wishlist',
                vkStubs.productStub.out
              ))
            })
          }
        })
      })
    })

    describe('#onSearchedProductsEvent', () => {
      it('should call retargeting view search event', () => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            items: vkStubs.listingItemsStub.in,
            query: 'red'
          },
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(pixelsPriceListIds[pixel.pixelId], 'view_search', {
                search_string: 'red',
                products_recommended_ids: vkStubs.listingItemsStub.out
              }))
            })
          }
        })
      })
    })

    describe('#onStartedOrder', () => {
      it('should call retargeting init checkout event', () => {
        window.digitalData.events.push({
          name: 'Started Order',
          cart: vkStubs.cartStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'init_checkout',
                vkStubs.cartStub.out
              ))
            })
          }
        })
      })
    })

    describe('#onAddedPaymentInfo', () => {
      it('should call retargeting add payment info event', () => {
        window.digitalData.events.push({
          name: 'Added Payment Info',
          cart: vkStubs.cartStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'add_payment_info',
                vkStubs.cartStub.out
              ))
            })
          }
        })
      })
    })

    describe('#onCompletedTransaction', () => {
      it('should call retargeting completed transaction event', () => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: vkStubs.cartStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'purchase',
                vkStubs.cartStub.out
              ))
            })
          }
        })
      })

      it('should call retargeting completed transaction event with grouped product feed setting', () => {
        vk.setOption('pixels', [
          {
            pixelId: 'VK-RTRG-12345-KV78const',
            feedWithGroupedProducts: true,
            priceListId: {
              type: 'constant',
              value: '2'
            }
          }
        ])
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: vkStubs.cartStub.in,
          callback: () => {
            vk.getOption('pixels').forEach((pixel) => {
              assert.ok(window.VK.Retargeting.ProductEvent.calledWith(
                pixelsPriceListIds[pixel.pixelId],
                'purchase',
                vkStubs.cartStub.outGrouped
              ))
            })
          }
        })
      })
    })

    describe('#onAnyEvent', () => {
      it('should add pixel to the page', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          page: {},
          callback: () => {
            assert.ok(vk.addPixel.called)
          }
        })
      })

      it('should call custom event in universal pixel', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          page: {},
          callback: () => {
            vk.getOption('pixels').forEach(() => {
              assert.ok(window.VK.Retargeting.Event.calledWith('product-detail'))
            })
          }
        })
      })

      it('should not add pixel to the page', () => {
        window.digitalData.events.push({
          name: 'Viewed Product',
          page: {},
          callback: () => {
            assert.ok(!vk.addPixel.called)
          }
        })
      })
    })
  })
})
