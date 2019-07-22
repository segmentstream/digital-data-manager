import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import MyTarget from '../../src/integrations/MyTarget'
import ddManager from '../../src/ddManager'
import { CONSTANT_VAR, DIGITALDATA_VAR, EVENT_VAR } from '../../src/variableTypes'

describe('Integrations: MyTarget', () => {
  let myTarget

  const countersListVarValues = {
    '1000': '1', // default constant value
    '1001': '2', // custom constant value
    '1002': '42', // digitalData value
    '1003': '1337' // eventEnrichment value
  }

  const options = {
    counters: [
      {
        counterId: '1000'
      },
      {
        counterId: '1001',
        listVar: {
          type: CONSTANT_VAR,
          value: countersListVarValues['1001']
        },
        feedWithGroupedProducts: true
      },
      {
        counterId: '1002',
        listVar: {
          type: DIGITALDATA_VAR,
          value: 'website.myTargetList'
        },
        feedWithGroupedProducts: false
      },
      {
        counterId: '1003',
        listVar: {
          type: EVENT_VAR,
          value: 'integrations.mytarget.list'
        },
        feedWithGroupedProducts: false
      }
    ],
    eventEnrichments: [
      {
        scope: 'event',
        prop: 'integrations.mytarget.list',
        handler: () => countersListVarValues['1003']
      }
    ]
  }

  beforeEach(() => {
    window.digitalData = {
      website: {
        myTargetList: countersListVarValues['1002']
      },
      page: {},
      user: {},
      events: []
    }
    myTarget = new MyTarget(window.digitalData, options)
    ddManager.addIntegration('MyTarget', myTarget)
  })

  afterEach(() => {
    myTarget.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(myTarget, 'load')
    })

    afterEach(() => {
      myTarget.load.restore()
    })

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.strict.equal(options.counters, myTarget.getOption('counters'))
        assert.strict.equal('script', myTarget.getTag().type)
        assert.strict.equal(myTarget.getTag().attr.src, '//top-fwz1.mail.ru/js/code.js')
      })

      it('should correctly set missing properties with defaults', () => {
        const counters = myTarget.getOption('counters')
        assert.strict.equal(myTarget.getOption('noConflict'), false)
        assert.strict.deepEqual(myTarget.getOption('goals'), {})
        assert.strict.deepEqual(counters[0], {
          counterId: counters[0].counterId,
          listVar: {
            type: 'constant',
            value: '1'
          },
          feedWithGroupedProducts: false
        })
      })
    })

    describe('#initialize', () => {
      it('should initialize mytarget queue object', () => {
        ddManager.initialize()
        assert.ok(window._tmr)
        assert.ok(window._tmr.push)
      })

      it('should call tags load after initialization', () => {
        assert.ok(myTarget.load.notCalled)
        ddManager.initialize()
        assert.ok(myTarget.load.calledOnce)
      })
    })
  })

  describe('loading', () => {
    beforeEach(() => {
      sinon.stub(myTarget, 'load').callsFake(() => {
        window._tmr = {
          push () {
          },
          unload () {
          }
        }
        myTarget.onLoad()
      })
    })

    afterEach(() => {
      myTarget.load.restore()
    })

    it('should load', (done) => {
      assert.ok(!myTarget.isLoaded())
      myTarget.once('load', () => {
        assert.ok(myTarget.isLoaded())
        done()
      })
      ddManager.initialize()
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(myTarget, 'load').callsFake(() => {
        myTarget.onLoad()
      })
      ddManager.once('ready', done)
      ddManager.initialize()
    })

    afterEach(() => {
      myTarget.load.restore()
    })

    describe('#onViewedPage', () => {
      it('should not send pageView for "Viewed Page" event if not valid', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {},
          callback: () => {
            assert.strict.equal(window._tmr.length, 0)
          }
        })
      })

      it('should send pageView for every "Viewed Page" event', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'other'
          },
          callback: () => {
            setTimeout(() => {
              myTarget.getOption('counters').forEach((counter, index) => {
                assert.strict.equal(window._tmr[index].id, counter.counterId)
                assert.strict.equal(window._tmr[index].type, 'pageView')
              })
              done()
            }, 101)
          }
        })
      })

      it('should not send pageView event if noConflict setting is true', () => {
        myTarget.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.strict.equal(window._tmr.length, 0)
          }
        })
      })
    })

    describe('#onViewedHome', () => {
      it('should send viewHome event if user visits home page', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index + 4], {
                id: counter.counterId,
                type: 'itemView',
                productid: '',
                pagetype: 'home',
                totalvalue: '',
                list: countersListVarValues[counter.counterId]
              })
            })
            assert.strict.equal(window._tmr.length, 8)
          }
        })
      })

      it('should send viewHome event if user visits home page (digitalData)', () => {
        window.digitalData.page = {
          type: 'home'
        }
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index + 4], {
                id: counter.counterId,
                type: 'itemView',
                productid: '',
                pagetype: 'home',
                totalvalue: '',
                list: countersListVarValues[counter.counterId]
              })
            })
            assert.strict.equal(window._tmr.length, 8)
          }
        })
      })

      it('should send viewHome event with specific list value for each counter', () => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.equal(window._tmr[index + 4].list, countersListVarValues[counter.counterId])
            })
            assert.strict.equal(window._tmr.length, 8)
          }
        })
      })
    })

    describe('#onViewedProductCategory', () => {
      it('should send itemView event for every "Viewed Product Category" event', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'itemView',
                productid: '',
                pagetype: 'category',
                totalvalue: '',
                list: countersListVarValues[counter.counterId]
              })
            })
          }
        })
      })

      it('should not send itemView event if noConflict setting is true', () => {
        myTarget.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Viewed Product Category',
          category: 'Content',
          callback: () => {
            assert.strict.equal(window._tmr.length, 0)
          }
        })
      })
    })

    describe('#onViewedProductDetail', () => {
      it('should send itemView event with product SKU for every "Viewed Product Detail" event', () => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123',
            skuCode: 'sku123',
            unitSalePrice: 150
          },
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'itemView',
                productid: index === 1 ? 'sku123' : '123', // counter with index 1 use feedWithGroupedProducts
                pagetype: 'product',
                totalvalue: 150,
                list: countersListVarValues[counter.counterId]
              })
            })
          }
        })
      })

      it('should send itemView event for every "Viewed Product Detail" event (digitalData)', () => {
        window.digitalData.product = {
          id: '123',
          skuCode: 'sku123',
          unitSalePrice: 150
        }
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'itemView',
                productid: index === 1 ? 'sku123' : '123', // counter with index 1 use feedWithGroupedProducts
                pagetype: 'product',
                totalvalue: 150,
                list: countersListVarValues[counter.counterId]
              })
            })
          }
        })
      })

      it('should not send itemView event if noConflict option is true', () => {
        myTarget.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: () => {
            assert.strict.equal(window._tmr.length, 0)
          }
        })
      })
    })

    describe('#onViewedCart', () => {
      const cart = {
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
              unitPrice: 30
            }
          },
          {
            product: {
              id: '456',
              skuCode: 'sku456'
            }
          }
        ],
        total: 230
      }

      it('should send itemView event if user visits cart page (digitalData)', () => {
        window.digitalData.cart = cart
        window.digitalData.events.push({
          name: 'Viewed Cart',
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'itemView',
                // counter with index 1 use feedWithGroupedProducts
                productid: index === 1 ? ['sku123', 'sku234', 'sku345', 'sku456'] : ['123', '234', '345', '456'],
                pagetype: 'cart',
                totalvalue: 230,
                list: countersListVarValues[counter.counterId]
              })
            })
          }
        })
      })

      it('should not send itemView event if noConflict option is true', () => {
        myTarget.setOption('noConflict', true)
        window.digitalData.cart = cart
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'cart'
          },
          callback: () => {
            assert.strict.equal(window._tmr.length, 0)
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
            unitPrice: 30
          }
        },
        {
          product: {
            id: '456',
            skuCode: 'sku456'
          }
        }
      ]

      it('should send itemView event if transaction is completed', () => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123',
            isFirst: true,
            lineItems,
            total: 230
          },
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'itemView',
                // counter with index 1 use feedWithGroupedProducts
                productid: index === 1 ? ['sku123', 'sku234', 'sku345', 'sku456'] : ['123', '234', '345', '456'],
                pagetype: 'purchase',
                totalvalue: 230,
                list: countersListVarValues[counter.counterId]
              })
            })
          }
        })
      })

      it('should send itemView event if transaction is completed (digitalData)', () => {
        window.digitalData.transaction = {
          orderId: '123',
          isFirst: true,
          lineItems,
          total: 230
        }
        window.digitalData.events.push({
          name: 'Completed Transaction',
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'itemView',
                // counter with index 1 use feedWithGroupedProducts
                productid: index === 1 ? ['sku123', 'sku234', 'sku345', 'sku456'] : ['123', '234', '345', '456'],
                pagetype: 'purchase',
                totalvalue: 230,
                list: countersListVarValues[counter.counterId]
              })
            })
          }
        })
      })

      it('should not send trackTransaction event if noConflict option is true', () => {
        myTarget.setOption('noConflict', true)
        window.digitalData.events.push({
          name: 'Completed Transaction',
          category: 'Ecommerce',
          transaction: {
            orderId: '123',
            lineItems
          },
          callback: () => {
            assert.strict.equal(window._tmr.length, 0)
          }
        })
      })
    })

    describe('#onCustomEvent', () => {
      it('should send reachGoal event for any other DDL event', () => {
        myTarget.setOption('goals', {
          Subscribed: 'userSubscription'
        })
        myTarget.addGoalsToSemanticEvents()
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'reachGoal',
                goal: 'userSubscription'
              })
            })
          }
        })
      })

      it('should send reachGoal event for semantic events if goal defined in settings', () => {
        myTarget.setOption('goals', {
          'Completed Transaction': 'orderCompleted'
        })
        myTarget.addGoalsToSemanticEvents()
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: '123123',
            lineItems: [{
              product: {
                id: '123'
              }
            }],
            total: 1000
          },
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index + 4], {
                id: counter.counterId,
                type: 'reachGoal',
                goal: 'orderCompleted'
              })
            })
          }
        })
      })

      it('should not send reachGoal event if goal is not defined in settings', () => {
        myTarget.setOption('goals', {})
        myTarget.addGoalsToSemanticEvents()
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            assert.strict.equal(window._tmr.length, 0)
          }
        })
      })

      it('should send reachGoal event for any other DDL event event if noConflict option is true', () => {
        myTarget.setOption('noConflict', true)
        myTarget.setOption('goals', {
          Subscribed: 'userSubscription'
        })
        myTarget.addGoalsToSemanticEvents()
        window.digitalData.events.push({
          name: 'Subscribed',
          user: {
            email: 'test@driveback.ru'
          },
          callback: () => {
            myTarget.getOption('counters').forEach((counter, index) => {
              assert.strict.deepEqual(window._tmr[index], {
                id: counter.counterId,
                type: 'reachGoal',
                goal: 'userSubscription'
              })
            })
          }
        })
      })
    })
  })
})
