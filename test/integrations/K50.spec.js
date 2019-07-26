import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import K50 from '../../src/integrations/K50'
import htmlGlobals from '@segmentstream/utils/htmlGlobals'
import ddManager from '../../src/ddManager'

const K50LoadTime = 200

describe('Integrations: K50', () => {
  let k50
  const options = {
    siteId: '1169056832'
  }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      events: []
    }
    k50 = new K50(window.digitalData, options)
    ddManager.addIntegration('K50', k50)
  })

  afterEach(() => {
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.strictEqual(options.siteId, k50.getOption('siteId'))
      })
    })
  })

  describe('#Tracker', () => {
    beforeEach(() => {
      sinon.stub(k50, 'load').callsFake(() => {
        window.k50Tracker = { init: sinon.spy(), change: sinon.spy() }
        k50.onLoad()
      })
      ddManager.initialize({ sendViewedPageEvent: false })
    })

    afterEach(() => {
      k50.reset()
      sinon.restore()
    })

    it('should init on viewed page', (done) => {
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          setTimeout(() => {
            assert.ok(window.k50Tracker.init.calledWith(
              { siteId: k50.getOption('siteId') }
            ))
            done()
          }, K50LoadTime)
        }
      })
    })

    it('should init on viewed page with constant user label', (done) => {
      k50.setOption('labelVar', {
        type: 'digitalData',
        value: 'example'
      })
      window.digitalData.example = 'test'
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          setTimeout(() => {
            assert.ok(window.k50Tracker.init.calledWith(
              { siteId: k50.getOption('siteId'), label: 'test' }
            ))
            done()
          }, K50LoadTime)
        }
      })
    })

    it('should init on viewed page with digitalData user label', (done) => {
      k50.setOption('labelVar', {
        type: 'constant',
        value: 'test'
      })
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          setTimeout(() => {
            assert.ok(window.k50Tracker.init.calledWith(
              { siteId: k50.getOption('siteId'), label: 'test' }
            ))
            done()
          }, K50LoadTime)
        }
      })
    })

    describe('SPA site', () => {
      const _location = {
        href: 'https://example.com/items/some-item?color=red'
      }

      const getCurrentLocation = () => {
        return htmlGlobals.getLocation().href
      }

      before(() => {
        sinon.stub(htmlGlobals, 'getLocation').callsFake(() => _location)
      })

      after(() => {
        sinon.restore()
      })

      it('should send change event on viewed page with digitalData user label', (done) => {
        k50.setOption('labelVar', {
          type: 'constant',
          value: 'test'
        })
        window.digitalData.events.push({ name: 'Viewed Page' })
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            setTimeout(() => {
              assert.ok(window.k50Tracker.change.calledWith(
                true,
                { landing: getCurrentLocation(), label: 'test' }
              ))
              done()
            }, K50LoadTime)
          }
        })
      })
    })
  })
})
