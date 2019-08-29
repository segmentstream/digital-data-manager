import { error as errorLog } from '@segmentstream/utils/safeConsole'
import isPromise from '@segmentstream/utils/isPromise'
import trackImpression from '../trackers/trackImpression'
import trackLink from '../trackers/trackLink'
import trackScroll from '../trackers/trackScroll'
import trackTimeOnPage from '../trackers/trackTimeOnPage'
import trackTimeOnSite from '../trackers/trackTimeOnSite'
import Handler from '../Handler'
import { CUSTOM_EVENT_SOURCE } from '../constants'

const TRIGGER_EVENT = 'event'
const TRIGGER_IMPRESSION = 'impression'
const TRIGGER_CLICK = 'click'
const TRIGGER_SCROLL = 'scroll'
const TRIGGER_ACTIVE_TIME_ON_SITE = 'activeTimeOnSite'
const TRIGGER_ACTIVE_TIME_ON_PAGE = 'activeTimeOnPage'
const TRIGGER_TIME_ON_SITE = 'timeOnSite'
const TRIGGER_TIME_ON_PAGE = 'timeOnPage'

class CustomEvent {
  constructor (name, trigger, settings, handler, digitalData, eventManager) {
    this.name = name
    this.trigger = trigger
    this.settings = settings || {}
    this.handler = handler
    this.digitalData = digitalData
    this.eventManager = eventManager
  }

  getTracker () {
    const map = {
      [TRIGGER_EVENT]: this.trackEvent.bind(this),
      [TRIGGER_CLICK]: this.trackClick.bind(this),
      [TRIGGER_IMPRESSION]: this.trackImpression.bind(this),
      [TRIGGER_SCROLL]: this.trackScroll.bind(this),
      [TRIGGER_ACTIVE_TIME_ON_SITE]: this.trackActiveTimeOnSite.bind(this),
      [TRIGGER_ACTIVE_TIME_ON_PAGE]: this.trackActiveTimeOnPage.bind(this),
      [TRIGGER_TIME_ON_SITE]: this.trackTimeOnSite.bind(this),
      [TRIGGER_TIME_ON_PAGE]: this.trackTimeOnPage.bind(this)
    }
    return map[this.trigger]
  }

  track () {
    const tracker = this.getTracker()
    if (!tracker) {
      errorLog(`Tracker for trigger "${this.trigger}" is not defined`)
      return
    }
    tracker()
  }

  newHandler (args) {
    return new Handler(this.handler, this.digitalData, args)
  }

  resolveHandlerAndFireEvent (args) {
    const handler = this.newHandler(args)
    try {
      const result = handler.run()
      if (result) {
        if (isPromise(result)) {
          result.then((event) => {
            this.fireEvent(event)
          })
        } else {
          this.fireEvent(result)
        }
      }
    } catch (e) {
      e.message = `DDManager Custom Event "${this.name}" Error\n\n ${e.message}`
      errorLog(e)
    }
  }

  trackEvent () {
    if (!this.settings.event) return
    this.eventManager.addCallback(['on', 'event', (event) => {
      if (event.name === this.settings.event && !event.stopPropagation) {
        this.resolveHandlerAndFireEvent([event])
      }
    }])
  }

  trackImpression () {
    if (!this.settings.selector) return
    trackImpression(this.settings.selector, (elements) => {
      this.resolveHandlerAndFireEvent([elements])
    })
  }

  trackClick () {
    if (!this.settings.selector) return
    trackLink(this.settings.selector, (element) => {
      this.resolveHandlerAndFireEvent([element])
    }, this.settings.followLink)
  }

  trackScroll () {
    if (!this.settings.scrollDepth) return
    trackScroll(this.settings.scrollDepth, (payload) => {
      this.resolveHandlerAndFireEvent([payload])
    })
  }

  trackActiveTimeOnSite () {
    if (!this.settings.seconds) return
    trackTimeOnSite(this.settings.seconds, (payload) => {
      this.resolveHandlerAndFireEvent([payload])
    }, this.name, true)
  }

  trackActiveTimeOnPage () {
    if (!this.settings.seconds) return
    trackTimeOnPage(this.settings.seconds, (payload) => {
      this.resolveHandlerAndFireEvent([payload])
    }, true)
  }

  trackTimeOnSite () {
    if (!this.settings.seconds) return
    trackTimeOnSite(this.settings.seconds, (payload) => {
      this.resolveHandlerAndFireEvent([payload])
    }, this.name)
  }

  trackTimeOnPage () {
    if (!this.settings.seconds) return
    trackTimeOnPage(this.settings.seconds, (payload) => {
      this.resolveHandlerAndFireEvent([payload])
    })
  }

  fireEvent (event) {
    if (!event) return
    if (typeof event !== 'object') {
      errorLog(`Custom Event "${this.name}" was disabled: returned event should be object`)
      return
    }
    if (!event.name) {
      errorLog(`Custom Event "${this.name}" was disabled: returned event name is undefined`)
      return
    }
    if (this.trigger === TRIGGER_EVENT) {
      if (event.name === this.settings.event && !event.stopPropagation) {
        errorLog(`Custom Event "${this.name}" was disabled: recursion error`)
        return
      }
    }

    if (!event.source) {
      event.source = CUSTOM_EVENT_SOURCE
    }
    this.digitalData.events.push(event)
  }
}

export default CustomEvent
