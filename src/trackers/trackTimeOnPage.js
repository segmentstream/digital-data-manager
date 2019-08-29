import { bind, unbind } from '@segmentstream/utils/eventListener'
import listenEvents from './listenEvents'

const timeout = 10 // 10 seconds
let interval = null
let activeTime = 0
let time = 0
let hasActive = false
let events = []
let isFirstCall = true

const addEventsListener = () => {
  listenEvents.forEach((eventName) => {
    bind(window.document, eventName, setActive, false)
  })
}

const removeEventsListener = () => {
  listenEvents.forEach((eventName) => {
    unbind(window.document, eventName, setActive, false)
  })
}

const processEvents = () => {
  if (hasActive) {
    activeTime += timeout
    hasActive = false
  }

  time += timeout

  events = events.map((event) => {
    const timeForEvent = event.isActiveTime ? activeTime : time

    if (!event.isFired && event.seconds <= timeForEvent) {
      event.handler(timeForEvent)
      return { ...event, isFired: true }
    }
    return event
  })
}

const setActive = () => { hasActive = true }

const addEvent = (seconds, handler, isActiveTime) => {
  events.push({ seconds, handler, isActiveTime, isFired: false })
}

const startTracking = () => {
  interval = setInterval(processEvents, timeout * 1000)
  addEventsListener()
}

const stopTracking = () => {
  clearInterval(interval)
  removeEventsListener()
}

startTracking()

export const reset = () => {
  if (!isFirstCall) {
    if (interval) {
      stopTracking()
    }
    activeTime = 0
    time = 0
    hasActive = false
    events = events.map(event => ({ ...event, isFired: false }))
    startTracking()
  }
  isFirstCall = false
}

export default (seconds, handler, isActiveTime = false) => {
  if (!seconds) return

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackTimeOnPage`.')
  }

  addEvent(seconds, handler, isActiveTime)
}
