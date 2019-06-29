import sinon from 'sinon'
import assert from 'assert'
import noop from '@segmentstream/utils/noop'
import reset from '../reset'
import ddManager from '../../src/ddManager'
import OneSignal from '../../src/integrations/OneSignal'

describe('OneSignal', () => {
  let _oneSignal
  const options = {
    appId: 'b7b8fc3c-4e98-499d-a727-3696caa518fc',
    safariWebId: 'web.onesignal.auto.5694d1e9-fcaa-415d-b1f1-1ef52daca700',
    subdomainName: 'test',
    pushSubscriptionTriggerEvent: 'Viewed Product',
    isSlidePrompt: false, // shown http prompt
    tagVars: {
      tag1: {
        type: 'digitalData',
        value: 'cart.total'
      },
      tag3: {
        type: 'event',
        value: 'page.test'
      }
    }
  }

  beforeEach(() => {
    window.digitalData = {
      events: []
    }
    _oneSignal = new OneSignal(window.digitalData, options)
    ddManager.addIntegration('OneSignal', _oneSignal)
  })

  afterEach(() => {
    _oneSignal.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    beforeEach(() => {
      sinon.stub(_oneSignal, 'load')
    })

    afterEach(() => {
      _oneSignal.load.restore()
    })

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.strict.equal(options.appId, _oneSignal.getOption('appId'))
        assert.strict.equal('script', _oneSignal.getTag().type)
        assert.strict.equal(_oneSignal.getTag().attr.src, 'https://cdn.onesignal.com/sdks/OneSignalSDK.js')
      })
    })

    describe('#initialize', () => {
      it('should initialize OneSignal queue object', () => {
        ddManager.initialize()
        assert.ok(window.OneSignal)
        assert.ok(window.OneSignal.push)
      })

      it('should call tags load after initialization', () => {
        ddManager.initialize()
        assert.ok(_oneSignal.load.calledTwice) // sdk + manifest.json
      })
    })
  })

  describe('loading', () => {
    beforeEach(() => {
      sinon.stub(_oneSignal, 'load').callsFake(() => {
        window.OneSignal = {
          push: () => { }
        }
        _oneSignal.onLoad()
      })
    })

    afterEach(() => {
      _oneSignal.load.restore()
    })

    it('should load', (done) => {
      assert.ok(!_oneSignal.isLoaded())
      _oneSignal.once('load', () => {
        assert.ok(_oneSignal.isLoaded())
        done()
      })
      ddManager.initialize()
    })
  })

  describe('after loading', () => {
    beforeEach(() => {
      window.digitalData.user = {
        test: 'test',
        obj: {
          param1: 'test',
          param2: 'test'
        }
      }
      window.digitalData.cart = {
        total: 1000
      }
      sinon.stub(_oneSignal, 'load').callsFake(() => {
        _oneSignal.onLoad()
      })
      window.OneSignal = window.OneSignal || []

      sinon.stub(window.OneSignal, 'push').callsFake((cmdArr) => {
        if (typeof cmdArr === 'function') {
          cmdArr()
        }
        if (cmdArr[0] === 'getNotificationPermission') {
          cmdArr[1]('granted')
        }
        if (cmdArr[0] === 'getUserId') {
          cmdArr[1]('ba3cb416-e05a-4fc0-8c9b-db3c9b2f7758')
        }
        if (cmdArr[0] === 'getRegistrationId') {
          cmdArr[1]('ba3cb416-e05a-4fc0-8c9b-db3c9b2f7758')
        }
        if (cmdArr[0] === 'getTags') {
          cmdArr[1]({
            tag1: '1000',
            tag2: 'value2'
          })
        }
      })
      window.OneSignal.isPushNotificationsSupported = () => true
      window.OneSignal.on = () => true
      window.OneSignal.sendTags = noop
      window.OneSignal.deleteTags = noop
      sinon.stub(window.OneSignal, 'sendTags')
      sinon.stub(window.OneSignal, 'deleteTags')
      ddManager.initialize()
    })

    afterEach(() => {
      window.OneSignal.push.restore()
    })

    describe('#enrichDigitalData', () => {
      it('should enrich digitalData.user', (done) => {
        _oneSignal.on('enrich', () => {
          assert.ok(window.digitalData.user.pushNotifications)
          assert.strict.equal(window.digitalData.user.pushNotifications.userId, 'ba3cb416-e05a-4fc0-8c9b-db3c9b2f7758')
          assert.strict.equal(window.digitalData.user.pushNotifications.isSupported, true)
          assert.strict.equal(window.digitalData.user.pushNotifications.isSubscribed, true)
          done()
        })
      })

      it('should send new tags and remove old', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {
            test: 'test value'
          },
          callback: () => {
            _oneSignal.onGetTags(() => {
              assert.ok(window.OneSignal.sendTags.calledWith({
                tag3: 'test value'
              }))
              assert.ok(window.OneSignal.deleteTags.calledWith(['tag2']))
              done()
            })
          }
        })
      })
    })

    describe('Prompt UseCases', () => {
      it('expected push after shownPrompt with current pushSubscriptionTriggerEvent', () => {
        _oneSignal.setOption('isSlidePrompt', true)
        window.digitalData.events.push({
          name: 'Viewed Product',
          source: 'DDManager SDK',
          callback: () => {
            _oneSignal.onGetTags(() => {
              assert.ok(window.OneSignal.push.calledWith(['showHttpPrompt']))
            })
          }
        })
      })
    })
  })
})
