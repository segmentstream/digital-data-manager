import assert from 'assert'
import sinon from 'sinon'
import reset from './../reset.js'
import Criteo from './../../src/integrations/Criteo.js'
import ddManager from './../../src/ddManager.js'

function viewedPage (eventData, callback) {
  window.digitalData.events.push(Object.assign({
    name: 'Viewed Page',
    callback: () => {
      setTimeout(() => {
        callback()
      }, 101)
    }
  }, eventData))
}

describe('Integrations: Criteo', () => {
  let criteo
  const options = {
    account: '123',
    multiCurrency: true
  }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    }
    criteo = new Criteo(window.digitalData, options)
    ddManager.addIntegration('Criteo', criteo)
  })

  afterEach(() => {
    criteo.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(criteo, 'load')
    })

    afterEach(function () {
      criteo.load.restore()
    })

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.strict.equal(options.account, criteo.getOption('account'))
        assert.strict.equal(undefined, criteo.getOption('deduplication'))
        assert.strict.equal('script', criteo.getTag().type)
        assert.strict.equal(criteo.getTag().attr.src, '//static.criteo.net/js/ld/ld.js')
      })
    })

    describe('#initialize', () => {
      it('should initialize criteo queue object', () => {
        ddManager.initialize()
        assert.ok(window.criteo_q)
        assert.ok(window.criteo_q.push)
      })

      it('should call tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(criteo.load.calledOnce)
      })
    })
  })

  describe('loading', function () {
    beforeEach(() => {
      sinon.stub(criteo, 'load').callsFake(() => {
        window.criteo_q = {
          push: function () {}
        }
        criteo.onLoad()
      })
    })

    afterEach(() => {
      criteo.load.restore()
    })

    it('should load', function (done) {
      assert.ok(!criteo.isLoaded())
      criteo.once('load', () => {
        assert.ok(criteo.isLoaded())
        done()
      })
      ddManager.initialize()
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(criteo, 'load').callsFake(() => {
        setTimeout(criteo.onLoad, 0)
      })
      ddManager.once('ready', () => {
        done()
      })
      ddManager.initialize()
    })

    afterEach(function () {
      criteo.load.restore()
    })

    describe('#Viewed Page', () => {
      it('should define account id', (done) => {
        viewedPage({
          page: {
            type: 'other'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][0], { event: 'setAccount', account: options.account })
          done()
        })
      })

      it('should define "d" site type if website.type is not one of: "desktop", "tablet" or "mobile"', (done) => {
        viewedPage({
          page: {
            type: 'other'
          },
          website: {
            type: 'test'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 'd' })
          done()
        })
      })

      it('should define "d" site type if digitalData.website.type is "desktop"', (done) => {
        viewedPage({
          page: {
            type: 'other'
          },
          website: {
            type: 'desktop'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 'd' })
          done()
        })
      })

      it('should define "t" site type if digitalData.website.type is "tablet"', (done) => {
        viewedPage({
          page: {
            type: 'other'
          },
          website: {
            type: 'tablet'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 't' })
          done()
        })
      })

      it('should define "m" site type if digitalData.website.type is "mobile"', (done) => {
        viewedPage({
          page: {
            type: 'other'
          },
          website: {
            type: 'mobile'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 'm' })
          done()
        })
      })

      it('should set email if digitalData.user.email is defined', (done) => {
        viewedPage({
          page: {
            type: 'other'
          },
          user: {
            email: 'test@driveback.ru'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][2], { event: 'setEmail', email: '8cc94f335003012e00e1441e5666756f' })
          done()
        })
      })

      it('should set email and website type from digitalData', (done) => {
        window.digitalData.website = {
          type: 'mobile'
        }
        window.digitalData.user = {
          email: 'test@driveback.ru'
        }
        viewedPage({
          page: {
            type: 'other'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 'm' })
          assert.strict.deepEqual(window.criteo_q[0][2], { event: 'setEmail', email: '8cc94f335003012e00e1441e5666756f' })
          done()
        })
      })
    })

    describe('#Viewed Page version <1.1.0', () => {
      it('should define "d" site type if digitalData.page.siteType is not one of: "desktop", "tablet" or "mobile"', (done) => {
        viewedPage({
          page: {
            type: 'other',
            siteType: 'test'
          },
          version: '1.0.11'
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 'd' })
          done()
        })
      })

      it('should define "d" site type if digitalData.page.siteType is "desktop"', (done) => {
        viewedPage({
          page: {
            type: 'other',
            siteType: 'desktop'
          },
          version: '1.0.11'
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 'd' })
          done()
        })
      })

      it('should define "t" site type if digitalData.page.siteType is "tablet"', (done) => {
        viewedPage({
          page: {
            type: 'other',
            siteType: 'tablet'
          },
          version: '1.0.11'
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 't' })
          done()
        })
      })

      it('should define "m" site type if digitalData.page.siteType is "mobile"', (done) => {
        viewedPage({
          page: {
            type: 'other',
            siteType: 'mobile'
          },
          version: '1.0.11'
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: 'm' })
          done()
        })
      })
    })

    describe('#onViewedHome', () => {
      it('should send viewHome event if digitalData.page.type is "home"', (done) => {
        window.digitalData.page.type = 'home'
        viewedPage({}, () => {
          assert.strict.deepEqual(window.criteo_q[0][3], { event: 'viewHome' })
          done()
        })
      })

      it('should send viewHome event if user visits home page', (done) => {
        viewedPage({
          page: {
            type: 'home'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][3], { event: 'viewHome' })
          done()
        })
      })

      it('should send viewHome event without segment if userSegment option is not defined', (done) => {
        viewedPage({
          page: {
            type: 'home'
          },
          user: {
            criteoSegment: '2'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][3], {
            event: 'viewHome'
          })
          done()
        })
      })

      it('should send viewHome event with segment if user visits home page', (done) => {
        criteo.setOption('userSegmentVar', 'user.criteoSegment')
        window.digitalData.user.criteoSegment = '2'
        viewedPage({
          page: {
            type: 'home'
          }
        }, () => {
          assert.strict.deepEqual(window.criteo_q[0][3], {
            event: 'viewHome',
            user_segment: '2'
          })
          done()
        })
      })

      it('should not send viewHome event if noConflict setting is true', (done) => {
        criteo.setOption('noConflict', true)
        viewedPage({
          page: {
            type: 'home'
          }
        }, () => {
          assert.ok(!window.criteo_q[0])
          done()
        })
      })
    })

    describe('#onViewedProductCategory', () => {
      it('should send viewList event if user visits listing page with more than 3 items (digitalData)', (done) => {
        window.digitalData.listing = {
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
            }
          ]
        }
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['123', '234', '345'] })
            done()
          }
        })
      })

      it('should send viewList event if user visits listing page with more than 3 items', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
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
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['123', '234', '345'] })
            done()
          }
        })
      })

      it('should send viewList event if user visits listing page with more than 3 items (feedWithGroupedProducts)', (done) => {
        criteo.setOption('feedWithGroupedProducts', true)
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          listing: {
            items: [
              {
                id: '123',
                skuCode: 'sku123'
              },
              {
                id: '234',
                skuCode: 'sku234'
              },
              {
                id: '345',
                skuCode: 'sku345'
              },
              {
                id: '456',
                skuCode: 'sku456'
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['sku123', 'sku234', 'sku345'] })
            done()
          }
        })
      })

      it('should send viewList event if user visits listing page with more than 3 items (enrichment)', (done) => {
        window.digitalData.listing = {
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
            }
          ]
        }
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['123', '234', '345'] })
            done()
          }
        })
      })

      it('should send viewList event with user_segment if user visits listing page with more than 3 items', (done) => {
        sinon.spy(criteo, 'pushCriteoQueue')
        criteo.setOption('userSegmentVar', 'user.criteoSegment')
        window.digitalData.user = {
          criteoSegment: '2'
        }
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'category'
          }
        })
        window.digitalData.events.push({
          name: 'Viewed Product Category',
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
              }
            ]
          },
          callback: () => {
            setTimeout(() => {
              assert.strict.deepEqual(window.criteo_q[0][3], {
                event: 'viewList',
                user_segment: '2',
                item: ['123', '234', '345']
              })
              assert.ok(criteo.pushCriteoQueue.calledOnce)
              criteo.pushCriteoQueue.restore()
              done()
            }, 101)
          }
        })
      })

      it('should send viewList event if user visits listing page with less than 3 items', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          listing: {
            items: [
              {
                id: '123'
              },
              {
                id: '234'
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['123', '234'] })
            done()
          }
        })
      })

      it('should not send viewList event if digitalData.listing object is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })

      it('should not send viewList event if noConflict setting is true', (done) => {
        criteo.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          listing: {
            items: [
              {
                id: '123'
              }
            ]
          },
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })
    })

    describe('#onSearchedProducts', () => {
      it('should send viewList event if user visits listing page with more than 3 items (digitalData)', (done) => {
        window.digitalData.listing = {
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
            }
          ]
        }
        window.digitalData.events.push({
          name: 'Searched Products',
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['123', '234', '345'] })
            done()
          }
        })
      })

      it('should send viewList event if user visits listing page with more than 3 items', (done) => {
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
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['123', '234', '345'] })
            done()
          }
        })
      })

      it('should send viewList event if user visits listing page with more than 3 items (feedWithGroupedProducts)', (done) => {
        criteo.setOption('feedWithGroupedProducts', true)
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            items: [
              {
                id: '123',
                skuCode: 'sku123'
              },
              {
                id: '234',
                skuCode: 'sku234'
              },
              {
                id: '345',
                skuCode: 'sku345'
              },
              {
                id: '456',
                skuCode: 'sku456'
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['sku123', 'sku234', 'sku345'] })
            done()
          }
        })
      })

      it('should send viewList event if user visits listing page with less than 3 items', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            items: [
              {
                id: '123'
              },
              {
                id: '234'
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewList', item: ['123', '234'] })
            done()
          }
        })
      })

      it('should not send viewList event if digitalData.listing obejct is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })

      it('should not send viewList event if noConflict setting is true', (done) => {
        criteo.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Searched Products',
          listing: {
            items: [
              {
                id: '123'
              }
            ]
          },
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })
    })

    describe('#onViewedProductDetail', () => {
      it('should send viewItem event if user visits product detail page (digitalData)', (done) => {
        window.digitalData.product = {
          id: '123'
        }
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewItem', item: '123' })
            done()
          }
        })
      })

      it('should send viewItem event if user visits product detail page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewItem', item: '123' })
            done()
          }
        })
      })

      it('should send viewItem event if user visits product detail page (feedWithGroupedProducts)', (done) => {
        criteo.setOption('feedWithGroupedProducts', true)
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            skuCode: 'sku123'
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'viewItem', item: 'sku123' })
            done()
          }
        })
      })

      it('should not send viewItem event if product ID is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })

      it('should not send viewItem event if noConflict option is true', (done) => {
        criteo.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123'
          },
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })
    })

    describe('#onViewedCart', () => {
      it('should send viewBasket event if user visits cart page (digitalData)', (done) => {
        window.digitalData.cart = {
          currency: 'USD',
          lineItems: [
            {
              product: {
                id: '123',
                unitSalePrice: 100
              },
              quantity: 1
            },
            {
              product: {
                id: '234',
                unitPrice: 100,
                unitSalePrice: 50
              },
              quantity: 2
            },
            {
              product: {
                id: '345',
                unitSalePrice: 30
              },
              quantity: 1
            }
          ]
        }
        window.digitalData.events.push({
          name: 'Viewed Cart',
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'viewBasket',
              currency: 'USD',
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 }
              ]
            })
            done()
          }
        })
      })

      it('should send viewBasket event if user visits cart page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {
            currency: 'USD',
            lineItems: [
              {
                product: {
                  id: '123',
                  unitSalePrice: 100
                },
                quantity: 1
              },
              {
                product: {
                  id: '234',
                  unitPrice: 100,
                  unitSalePrice: 50
                },
                quantity: 2
              },
              {
                product: {
                  id: '345',
                  unitSalePrice: 0
                },
                quantity: 1
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'viewBasket',
              currency: 'USD',
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 }
              ]
            })
            done()
          }
        })
      })

      it('should send viewBasket event if user visits cart page (feedWithGroupedProudcts)', (done) => {
        criteo.setOption('feedWithGroupedProducts', true)
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {
            currency: 'USD',
            lineItems: [
              {
                product: {
                  id: '123',
                  skuCode: 'sku123',
                  unitSalePrice: 100
                },
                quantity: 1
              },
              {
                product: {
                  id: '234',
                  skuCode: 'sku234',
                  unitPrice: 100,
                  unitSalePrice: 50
                },
                quantity: 2
              },
              {
                product: {
                  id: '345',
                  skuCode: 'sku345',
                  unitSalePrice: 30
                },
                quantity: 1
              }
            ]
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'viewBasket',
              currency: 'USD',
              item: [
                { id: 'sku123', price: 100, quantity: 1 },
                { id: 'sku234', price: 50, quantity: 2 },
                { id: 'sku345', price: 30, quantity: 1 }
              ]
            })
            done()
          }
        })
      })

      it('should not send viewBasket event if cart object is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })

      it('should not send viewBasket event if cart is empty', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {
            lineItems: []
          },
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })

      it('should not send viewBasket event if noConflict option is true', (done) => {
        criteo.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {
            currency: 'USD',
            lineItems: [
              {
                product: {
                  id: '123',
                  unitSalePrice: 100
                },
                quantity: 1
              }
            ]
          },
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })
    })

    describe('#onCompletedTransaction', () => {
      const lineItems = [
        {
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 100
          },
          quantity: 1
        },
        {
          product: {
            id: '234',
            skuCode: 'sku234',
            unitPrice: 100,
            unitSalePrice: 50
          },
          quantity: 2
        },
        {
          product: {
            id: '345',
            skuCode: 'sku345',
            unitSalePrice: 30
          },
          quantity: 1
        }
      ]

      it('should send trackTransaction event if transaction is completed (digitalData)', (done) => {
        window.digitalData.transaction = {
          orderId: '123',
          currency: 'USD',
          isFirst: true,
          lineItems
        }
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'trackTransaction',
              id: '123',
              currency: 'USD',
              new_customer: 1,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 }
              ]
            })
            done()
          }
        })
      })

      it('should send trackTransaction event if transaction is completed (new_customer = 1)', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            currency: 'USD',
            isFirst: true,
            lineItems
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'trackTransaction',
              id: '123',
              currency: 'USD',
              new_customer: 1,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 }
              ]
            })
            done()
          }
        })
      })

      it('should send trackTransaction event if transaction is completed (new_customer = 1, feedWithGroupedProducts)', (done) => {
        criteo.setOption('feedWithGroupedProducts', true)
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            currency: 'USD',
            isFirst: true,
            lineItems
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'trackTransaction',
              id: '123',
              currency: 'USD',
              new_customer: 1,
              item: [
                { id: 'sku123', price: 100, quantity: 1 },
                { id: 'sku234', price: 50, quantity: 2 },
                { id: 'sku345', price: 30, quantity: 1 }
              ]
            })
            done()
          }
        })
      })

      it('should send trackTransaction event if transaction is completed (new_customer = 0)', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            currency: 'USD',
            isFirst: false,
            lineItems
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'trackTransaction',
              id: '123',
              currency: 'USD',
              new_customer: 0,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 }
              ]
            })
            done()
          }
        })
      })

      it('should send trackTransaction event if transaction is completed (deduplication = 1)', (done) => {
        criteo.setOption('customDeduplication', true)
        window.digitalData.events.push({
          name: 'Completed Transaction',
          context: {
            campaign: {
              source: 'CriTeO'
            }
          },
          transaction: {
            orderId: '123',
            currency: 'USD',
            lineItems
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'trackTransaction',
              id: '123',
              currency: 'USD',
              new_customer: 0,
              deduplication: 1,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 }
              ]
            })
            done()
          }
        })
      })

      it('should send trackTransaction event if transaction is completed (deduplication = 0)', (done) => {
        criteo.setOption('customDeduplication', false)
        window.digitalData.context = {
          campaign: {
            name: 'CriTeO'
          }
        }
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            currency: 'USD',
            lineItems
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], {
              event: 'trackTransaction',
              id: '123',
              currency: 'USD',
              new_customer: 0,
              item: [
                { id: '123', price: 100, quantity: 1 },
                { id: '234', price: 50, quantity: 2 },
                { id: '345', price: 30, quantity: 1 }

              ]
            })
            done()
          }
        })
      })

      it('should not send trackTransaction event if transaction object is not defined', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })

      it('should not send trackTransaction event if transaction object has no LineItems', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            lineItems: []
          },
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })

      it('should not send trackTransaction event if noConflict option is true', (done) => {
        criteo.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            currency: 'USD',
            lineItems
          },
          callback: () => {
            assert.ok(!window.criteo_q[0])
            done()
          }
        })
      })
    })

    describe('#onSubscribed', () => {
      it('should set email if user email was acquired', (done) => {
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'setEmail', email: '8cc94f335003012e00e1441e5666756f' })
            done()
          }
        })
      })

      it('should set email if user email was acquired and noConflict option is true', (done) => {
        criteo.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.strict.deepEqual(window.criteo_q[0], { event: 'setEmail', email: '8cc94f335003012e00e1441e5666756f' })
            done()
          }
        })
      })
    })
  })
})
