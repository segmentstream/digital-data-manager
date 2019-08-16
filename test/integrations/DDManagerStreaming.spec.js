import assert from 'assert'
import sinon from 'sinon'
import { setIgnoreSameDomainCheck } from '@segmentstream/utils/utmParamsFromReferrer'
import htmlGlobals from '@segmentstream/utils/htmlGlobals'
import reset from '../reset'
import DDManagerStreaming from '../../src/integrations/DDManagerStreaming'
import ddManager from '../../src/ddManager'

describe('Integrations: DDManagerStreaming', () => {
  let ddManagerStreaming

  const _location = {
    protocol: 'https:',
    hostname: 'example.com',
    port: '',
    pathname: '/home',
    href: 'https://example.com/home',
    search: '',
    hash: '#title1'
  }

  before(() => {
    setIgnoreSameDomainCheck(true)
  })

  after(() => {
    setIgnoreSameDomainCheck(false)
  })

  beforeEach(() => {
    window.digitalData = {
      context: {},
      events: []
    }
    ddManagerStreaming = new DDManagerStreaming(window.digitalData)
    ddManager.addIntegration('DDManager Streaming', ddManagerStreaming)
  })

  afterEach(() => {
    ddManagerStreaming.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(ddManagerStreaming, 'load')
    })

    afterEach(() => {
      ddManagerStreaming.load.restore()
    })

    describe('#initialize', () => {
      it('should initialize', () => {
        ddManager.initialize()
        assert.ok(ddManagerStreaming.isLoaded())
      })

      it('should not load any tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(!ddManagerStreaming.load.calledOnce)
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(ddManagerStreaming, 'load')
      sinon.stub(ddManagerStreaming, 'send')
      ddManager.once('ready', () => {
        done()
      })
      ddManager.initialize()
    })

    afterEach(() => {
      htmlGlobals.getLocation.restore()
      htmlGlobals.getDocument.restore()
      ddManagerStreaming.send.restore()
    })

    it('#visit from Search Engine', () => {
      const _document = {
        referrer: 'https://www.google.com/'
      }
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      assert.strict.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'google',
        medium: 'organic'
      })
    })

    it('#visit from other site', () => {
      const _document = {
        referrer: 'http://www.samesite.com'
      }
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      assert.strict.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'samesite.com',
        medium: 'referral'
      })
    })

    it('#visit with ymclid get param', () => {
      const _document = {
        referrer: 'http://www.samesite.com'
      }
      _location.href = 'https://example.com/home?ymclid=1'
      _location.search = '?ymclid=1'
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      assert.strict.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'yandex_market',
        medium: 'cpc'
      })
    })

    it('#visit with yclid get param', () => {
      const _document = {
        referrer: 'http://www.samesite.com'
      }
      _location.href = 'https://example.com/home?yclid=1'
      _location.search = '?yclid=1'
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      assert.strict.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'yandex',
        medium: 'cpc'
      })
    })

    it('#visit with gclid get param', () => {
      const _document = {
        referrer: 'http://www.samesite.com'
      }
      _location.href = 'https://example.com/home?gclid=1'
      _location.search = '?gclid=1'
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      assert.strict.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'google',
        medium: 'cpc'
      })
    })

    it('#do not override utm-params', () => {
      const _document = {
        referrer: 'https://www.google.com/search?ei=5m92XOv5KYyxkwWe66WABQ&q=segmentstream&oq=segmentstream'
      }
      _location.href = 'https://example.com/home?utm_source=test&utm_medium=test'
      _location.search = '?utm_source=test&utm_medium=test'
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      assert.strict.deepEqual(ddManagerStreaming.normalize({}).context.campaign, {
        source: 'test',
        medium: 'test'
      })
    })

    it('#internal visits', () => {
      const _document = {
        referrer: 'https://example.com/home?utm_source=test&utm_medium=test'
      }
      _location.href = 'https://example.com/next'
      _location.search = ''
      setIgnoreSameDomainCheck(false)
      sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
      sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      assert.ok(!ddManagerStreaming.normalize({}).context.campaign)
    })

    describe('tracking events with non default params', () => {
      it('should track event with custom source param', () => {
        const _document = {
          referrer: 'https://example.com/'
        }
        sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
        sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)

        const sendingEvent = {
          name: 'Custom Event',
          nonInteraction: true
        }

        window.digitalData.events.push({
          ...sendingEvent,
          callback: () => {
            const { event } = ddManagerStreaming.send.secondCall.args[0]
            assert.strict.deepEqual(sendingEvent, event)
          }
        })
      })
    })

    describe('tracking Updated Transaction', () => {
      it('should track with status param', () => {
        const _document = {
          referrer: 'https://example.com/'
        }
        sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
        sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)

        const updatedTransactionEvent = {
          name: 'Updated Transaction',
          isFirst: true,
          nonInteraction: true,
          transaction: {
            currency: 'RUB',
            orderId: 'test',
            status: 'updated',
            total: 1,
            subtotal: 1,
            lineItems: [
              {
                product: {
                  id: 'test',
                  skuCode: 'test',
                  unitSalePrice: 1,
                  unitPrice: 1,
                  name: 'test',
                  category: ['test']
                },
                quantity: 1
              }
            ]
          }
        }

        window.digitalData.events.push({
          ...updatedTransactionEvent,
          callback: () => {
            const { event } = ddManagerStreaming.send.secondCall.args[0]
            assert.strict.deepEqual(updatedTransactionEvent, {
              ...event,
              isFirst: true,
              transaction: {
                ...event.transaction,

                lineItems: [{
                  product: {
                    id: 'test',
                    skuCode: 'test',
                    unitSalePrice: 1,
                    unitPrice: 1,
                    name: 'test',
                    category: [
                      'test'
                    ]
                  },
                  quantity: 1
                }]
              }
            })
          }
        })
      })
    })

    describe('tracking wishlist events', () => {
      beforeEach(() => {
        const _document = {
          referrer: 'https://www.google.com/'
        }
        sinon.stub(htmlGlobals, 'getDocument').callsFake(() => _document)
        sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      })

      it('should track product added to wishlist', (done) => {
        window.digitalData.events.push({
          name: 'Added Product to Wishlist',
          category: 'Ecommerce',
          product: {
            id: '124'
          },
          callback: () => {
            const { event } = ddManagerStreaming.send.secondCall.args[0]
            assert.strict.deepEqual({
              category: 'Ecommerce',
              name: 'Added Product to Wishlist',
              nonInteraction: false,
              product: {
                id: '124',
                customDimensions: [],
                customMetrics: []
              }
            }, event)
            done()
          }
        })
      })

      it('should track product removed from wishlist', (done) => {
        window.digitalData.events.push({
          name: 'Removed Product from Wishlist',
          category: 'Ecommerce',
          product: {
            id: '123'
          },
          callback: () => {
            const { event } = ddManagerStreaming.send.secondCall.args[0]
            assert.strict.deepEqual({
              category: 'Ecommerce',
              name: 'Removed Product from Wishlist',
              nonInteraction: false,
              product: {
                id: '123',
                customDimensions: [],
                customMetrics: []
              }
            }, event)
            done()
          }
        })
      })
    })
  })
})
