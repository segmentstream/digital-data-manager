import assert from 'assert'
import sinon from 'sinon'
import reset from './reset'
import ddManager from '../src/ddManager'
import Integration from '../src/Integration'
import fireEvent from './functions/fireEvent'
import {
  COOKIE_CONSENT_NONE,
  COOKIE_CONSENT_INFO,
  COOKIE_CONSENT_OPTIN,
  COOKIE_CONSENT_OPTOUT
} from '../src/ConsentManager'

describe('ConsentManager', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.ddManager = ddManager
  })

  afterEach(() => {
    window.localStorage.clear()
    ddManager.reset()
    reset()
  })

  describe('#cookieConsent', () => {
    const EVENT_NAME = 'Viewed Page'
    const integration1 = new Integration(window.digitalData)
    const integration2 = new Integration(window.digitalData)

    beforeEach(() => {
      [integration1, integration2].forEach((integration) => {
        sinon.stub(integration, 'trackEvent')

        integration.getSemanticEvents = () => [EVENT_NAME]
      })

      ddManager.addIntegration('integration1', integration1)
      ddManager.addIntegration('integration2', integration2)
    })

    afterEach(() => {
      integration1.trackEvent.restore()
      integration2.trackEvent.restore()
    })

    it('should track events for None mode', () => {
      ddManager.initialize({
        cookieConsent: COOKIE_CONSENT_NONE,
        sendViewedPageEvent: false
      })
      window.digitalData.events.push({
        name: EVENT_NAME,
        callback: () => {
          assert.ok(integration1.trackEvent.calledWithMatch({ name: EVENT_NAME }))
          assert.ok(integration2.trackEvent.calledWithMatch({ name: EVENT_NAME }))
        }
      })
    })

    describe('set to Info', () => {
      const cookieConsent = COOKIE_CONSENT_INFO
      it('should not track events, before apply', () => {
        ddManager.initialize({
          cookieConsent,
          sendViewedPageEvent: false
        })

        window.digitalData.events.push({
          name: EVENT_NAME,
          callback: () => {
            assert.ok(!integration1.trackEvent.calledWithMatch({ name: EVENT_NAME }))
            assert.ok(!integration2.trackEvent.calledWithMatch({ name: EVENT_NAME }))
          }
        })
      })

      it('should track events, after apply', () => {
        ddManager.initialize({
          cookieConsent,
          sendViewedPageEvent: false
        })

        fireEvent(window, 'click')

        window.digitalData.events.push({
          name: EVENT_NAME,
          callback: () => {
            assert.ok(integration1.trackEvent.calledWithMatch({ name: EVENT_NAME }))
            assert.ok(integration2.trackEvent.calledWithMatch({ name: EVENT_NAME }))
          }
        })
      })
    })

    describe('set to Opt-in', () => {
      const cookieConsent = COOKIE_CONSENT_OPTIN
      it('should not track events, before apply', () => {
        ddManager.initialize({
          cookieConsent,
          sendViewedPageEvent: false
        })

        window.digitalData.events.push({
          name: EVENT_NAME,
          callback: () => {
            assert.ok(!integration1.trackEvent.calledWithMatch({ name: EVENT_NAME }))
            assert.ok(!integration2.trackEvent.calledWithMatch({ name: EVENT_NAME }))
          }
        })
      })

      it('should track events, after apply', () => {
        ddManager.initialize({
          cookieConsent,
          sendViewedPageEvent: false
        })

        ddManager.setConsent(true)

        window.digitalData.events.push({
          name: EVENT_NAME,
          callback: () => {
            assert.ok(integration1.trackEvent.calledWithMatch({ name: EVENT_NAME }))
            assert.ok(integration2.trackEvent.calledWithMatch({ name: EVENT_NAME }))
          }
        })
      })
    })

    describe('set to Opt-out', () => {
      const cookieConsent = COOKIE_CONSENT_OPTOUT
      it('should track events, before apply', () => {
        ddManager.initialize({
          cookieConsent,
          sendViewedPageEvent: false
        })

        window.digitalData.events.push({
          name: EVENT_NAME,
          callback: () => {
            assert.ok(integration1.trackEvent.calledWithMatch({ name: EVENT_NAME }))
            assert.ok(integration2.trackEvent.calledWithMatch({ name: EVENT_NAME }))
          }
        })
      })

      it('should not track events, after apply', () => {
        ddManager.initialize({
          cookieConsent,
          sendViewedPageEvent: false
        })

        window.ddManager.setConsent(false)

        window.digitalData.events.push({
          name: EVENT_NAME,
          callback: () => {
            assert.ok(!integration1.trackEvent.calledWithMatch({ name: EVENT_NAME }))
            assert.ok(!integration2.trackEvent.calledWithMatch({ name: EVENT_NAME }))
          }
        })
      })
    })
  })
})
