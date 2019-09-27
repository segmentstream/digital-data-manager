import { bind, unbind } from '@segmentstream/utils/eventListener'
import listenEvents from './listenEvents'
import Storage from '../Storage'

const timeout = 10 // 10 seconds
let interval = null
let hasActive = false
let events = []
const storagePrefix = 'timeOnSite:'

const storage = new Storage({ prefix: storagePrefix })

// Load from storage
let activeTime = storage.get('activeTime') || 0
let time = storage.get('time') || 0
const firedEventsJSON = storage.get('firedEvents')
let firedEvents = firedEventsJSON ? JSON.parse(firedEventsJSON) : []

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

const incActiveTime = () => {
  activeTime += timeout
  storage.set('activeTime', activeTime)
}

const incTime = () => {
  time += timeout
  storage.set('time', time)
}

const fireEvent = (eventName) => {
  firedEvents.push(eventName)
  storage.set('firedEvents', JSON.stringify(firedEvents))
}

const processEvents = () => {
  if (hasActive) {
    incActiveTime()
    hasActive = false
  }

  incTime()

  events.forEach((event) => {
    const timeForEvent = event.isActiveTime ? activeTime : time

    if (!firedEvents.includes(`${event.name}:${event.seconds}`) && event.seconds <= timeForEvent) {
      event.handler(timeForEvent)
      fireEvent(`${event.name}:${event.seconds}`)
    }
  })
}

const setActive = () => { hasActive = true }

const addEvent = (seconds, handler, eventName, isActiveTime) => {
  events.push({ seconds, handler, isActiveTime, name: eventName })
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
  if (interval) {
    stopTracking()
  }
  activeTime = 0
  time = 0
  hasActive = false
  firedEvents = []
  storage.remove('activeTime')
  storage.remove('time')
  storage.remove('firedEvents')
  startTracking()
}

export default (seconds, handler, eventName, isActiveTime = false) => {
  if (!seconds) return

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackTimeOnSite`.')
  }

  String(seconds)
    .replace(/\s+/mg, '')
    .split(',')
    .forEach((secondsStr) => {
      const second = parseInt(secondsStr)
      if (second > 0) {
        addEvent(second, handler, eventName, isActiveTime)
      }
    })
}
