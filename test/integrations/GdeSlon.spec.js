import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import ddManager from '../../src/ddManager'
import GdeSlon from '../../src/integrations/GdeSlon'
import * as affiliate from '../../src/integrations/utils/affiliate'

describe('Integrations: GdeSlon', () => {
  let gdeSlon
  const options = { merchantId: 'testId' }

  beforeEach(() => {
    window.digitalData = {}
    gdeSlon = new GdeSlon(window.digitalData, options)
    ddManager.addIntegration('GdeSlon', gdeSlon)
  })

  afterEach(() => {
    gdeSlon.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add options', () => {
        assert.strict.equal(options.merchantId, gdeSlon.getOption('merchantId'))
      })
    })

    describe('#initialize', () => {
      it('should initialize', () => {
        ddManager.initialize()
        assert.ok(gdeSlon.isLoaded())
      })

      it('should not load any tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(!gdeSlon.load.calledOnce)
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(gdeSlon, 'load').callsFake(() => {
        gdeSlon.onLoad()
      })

      ddManager.once('ready', done)
      ddManager.initialize({
        sendViewedPageEvent: false
      })
    })

    afterEach(() => {
      gdeSlon.load.restore()
    })

    describe('Retargeting use cases', () => {
      const listing = {
        categoryId: 'cat-id',
        items: [
          {
            product: {
              id: '123',
              unitSalePrice: 1234
            }
          }
        ]
      }

      before(() => {
        sinon.stub(affiliate, 'getAffiliateCookie').returns(true)
        sinon.stub(affiliate, 'isDeduplication').returns(false)
      })

      beforeEach(() => {
        window.digitalData.events.push({ name: 'Viewed Page' })
        gdeSlon.setOption('isRetargetingEnabled', true)
      })

      it('should init card script after viewed product detail page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            unitSalePrice: 1234
          },
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('card'))
            done()
          }
        })
      })

      it('should init basket script after viewed cart', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('basket'))
            done()
          }
        })
      })

      it('should init search list script after search', (done) => {
        window.digitalData.events.push({
          name: 'Searched Products',
          listing,
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('search list'))
            done()
          }
        })
      })

      it('should init category script after viewed product list', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Listing',
          listing,
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('category'))
            done()
          }
        })
      })

      it('should init thanks script after completed transaction', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: 'testId',
            total: 1
          },
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('trackingPixel'))
            assert.ok(gdeSlon.load.calledWith('thanks'))
            done()
          }
        })
      })

      it('should init main script after viewed home page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'home'
          },
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('main'))
            done()
          }
        })
      })

      it('should init other script after viewed some stuff page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            type: 'other'
          },
          callback: () => {
            setTimeout(() => {
              assert.ok(gdeSlon.load.calledWith('other'))
              done()
            }, 150)
          }
        })
      })

      it('should execute card script with expected parameters after viewed product detail page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          product: {
            id: '123',
            unitSalePrice: 1234
          },
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('card', {
              productCodes: '123:1234'
            }))
            done()
          }
        })
      })

      it('should execute basket script with expected parameters after viewed cart ', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {
            lineItems: [
              {
                product: {
                  id: '22', unitSalePrice: 100
                },
                quantity: 1
              },
              {
                product: {
                  id: '23', unitSalePrice: 200
                },
                quantity: 1
              }
            ]
          },
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('basket', {
              productCodes: '22:100,23:200'
            }))
            done()
          }
        })
      })

      it('should execute basket script with empty production codes after viewed cart ', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Cart',
          cart: {
            lineItems: [
            ]
          },
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('basket', {
              productCodes: ''
            }))

            done()
          }
        })
      })

      it('should execute thanks script with expected parameters after completed transaction', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: 'id',
            total: 1,
            lineItems: [
              {
                product: {
                  id: '22', unitSalePrice: 100
                },
                quantity: 1
              }
            ]
          },
          integrations: {
            gdeslon: {
              code: '001'
            }
          },
          callback: () => {
            assert.ok(gdeSlon.load.calledWith('thanks', {
              productCodes: '22:100',
              orderId: 'id'
            }))
            assert.ok(gdeSlon.load.calledWith('trackingPixel', {
              productCodes: '22:100,',
              code: '001',
              orderId: 'id',
              total: 1
            }))
            done()
          }
        })
      })
    })
  })
})
