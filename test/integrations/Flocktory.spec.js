import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import Flocktory from '../../src/integrations/Flocktory'
import ddManager from '../../src/ddManager'

describe('Integrations: Flocktory', () => {
  let flocktory
  const options = {
    siteId: '123',
    preCheckout: true
  }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: {},
      events: []
    }
    flocktory = new Flocktory(window.digitalData, options)
    ddManager.addIntegration('Flocktory', flocktory)
  })

  afterEach(() => {
    flocktory.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(flocktory, 'load')
    })

    afterEach(() => {
      flocktory.load.restore()
    })

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.strict.equal(options.siteId, flocktory.getOption('siteId'))
        assert.strict.equal('script', flocktory.getTag().type)
        assert.strict.equal(flocktory.getTag().attr.src, `https://api.flocktory.com/v2/loader.js?site_id=${options.siteId}`)
      })
    })

    describe('#initialize', () => {
      it('should call tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(flocktory.load.calledOnce)
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      ddManager.once('ready', done)
      ddManager.initialize({
        sendViewedPageEvent: false
      })
      window.flocktory = { reInit: () => {} }
      sinon.stub(window.flocktory, 'reInit')
    })

    afterEach(() => {
      window.flocktory.reInit.reset()
      ddManager.reset()
      reset()
    })

    describe('#onViewedPage', () => {
      it('should call reInit for SPA sites', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          callback: () => {
            assert.ok(!window.flocktory.reInit.called)
            window.digitalData.events.push({
              name: 'Viewed Page',
              callback: () => {
                assert.ok(window.flocktory.reInit.called)
                done()
              }
            })
          }
        })
      })
    })
  })
})
