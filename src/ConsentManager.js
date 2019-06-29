import { bind, unbind } from '@segmentstream/utils/eventListener'

import { SDK_CHANGE_SOURCE } from './constants'

export const COOKIE_CONSENT_NONE = 'none'
export const COOKIE_CONSENT_INFO = 'info'
export const COOKIE_CONSENT_OPTIN = 'optin'
export const COOKIE_CONSENT_OPTOUT = 'optout'
export const CONSENT_NAME = 'cookieConsent'

const ACCEPT_CONSENT_EVENTS = ['mousemove', 'click', 'keydown', 'scroll', 'wheel', 'touchstart']

let _digitalData
let _ddStorage
let _cookieConsent

const getConsent = () => _ddStorage.get(CONSENT_NAME)

const setConsent = (consent) => {
  _digitalData.changes.push([CONSENT_NAME, consent, SDK_CHANGE_SOURCE])
  _ddStorage.persist(CONSENT_NAME)
}

export default {
  initialize: (cookieConsent, digitalData, ddStorage) => {
    _cookieConsent = cookieConsent
    _digitalData = digitalData
    _ddStorage = ddStorage

    if (getConsent()) return

    const changeConsentListener = () => {
      setConsent(true)

      // unbind user action events
      ACCEPT_CONSENT_EVENTS.forEach((evt) => {
        unbind(window, evt, changeConsentListener)
      })
    }

    if (cookieConsent === COOKIE_CONSENT_INFO) {
      // bind user action events
      ACCEPT_CONSENT_EVENTS.forEach((evt) => {
        bind(window, evt, changeConsentListener)
      })
    }
  },

  setConsent,

  getConsent,

  isConsentObtained: () => {
    if (_cookieConsent === COOKIE_CONSENT_NONE) return true

    const consentValue = getConsent()

    if (_cookieConsent === COOKIE_CONSENT_OPTOUT) {
      // user must explicitly deny consent in opt-out
      return consentValue !== false
    }

    return !!consentValue
  }
}
