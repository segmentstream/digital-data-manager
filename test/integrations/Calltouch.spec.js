import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import Calltouch from '../../src/integrations/Calltouch'
import ddManager from '../../src/ddManager'

const CALLTOUCH_LOAD_TIME = 200

describe('Integrations: Calltouch', () => {
  let calltouch
  const options = {
    siteId: '123123'
  }

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {
        param: 'value'
      },
      events: []
    }
    calltouch = new Calltouch(window.digitalData, options)
    ddManager.addIntegration('Calltouch', calltouch)
  })

  afterEach(() => {
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.strictEqual(options.siteId, calltouch.getOption('siteId'))
      })
    })
  })

  describe('#Tracker', () => {
    beforeEach(() => {
      sinon.stub(calltouch, 'load').callsFake(() => {
        window.ct_set_attrs = sinon.spy()
        calltouch.onLoad()
      })

      ddManager.initialize({ sendViewedPageEvent: false })
    })

    afterEach(() => {
      calltouch.reset()
      sinon.restore()
    })

    it('should not sent custom parameters', (done) => {
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          setTimeout(() => {
            assert.ok(!window.ct_set_attrs.called)
            done()
          }, CALLTOUCH_LOAD_TIME)
        }
      })
    })

    it('should once sent custom parameters from digitalData', (done) => {
      calltouch.setOption('customParams', {
        test: {
          type: 'digitalData',
          value: 'page.param'
        }
      })

      // First viewed page
      window.digitalData.events.push({
        name: 'Viewed Page',
        callback: () => {
          setTimeout(() => {
            assert.ok(window.ct_set_attrs.calledWith('{"test":"value"}'))

            // Second viewed page
            window.digitalData.events.push({
              name: 'Viewed Page',
              callback: () => {
                setTimeout(() => {
                  assert.ok(window.ct_set_attrs.calledOnce)
                  done()
                }, CALLTOUCH_LOAD_TIME)
              }
            })
          }, CALLTOUCH_LOAD_TIME)
        }
      })
    })

    it('should sent custom parameters from event', (done) => {
      calltouch.setOption('customParams', {
        test1: {
          type: 'event',
          value: 'foo'
        }
      })

      window.digitalData.events.push({
        name: 'Viewed Page',
        foo: 'bar',
        callback: () => {
          setTimeout(() => {
            assert.ok(window.ct_set_attrs.calledWith('{"test1":"bar"}'))
            done()
          }, CALLTOUCH_LOAD_TIME)
        }
      })
    })
  })
})
