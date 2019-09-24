import { bind } from '@segmentstream/utils/eventListener'

let events = []

const getScrollPercent = () => {
  const html = document.documentElement
  const body = document.body
  return parseInt((html.scrollTop || body.scrollTop) / ((html.scrollHeight || body.scrollHeight) - html.clientHeight) * 100, 10)
}

const addEvent = (scrollDepth, handler) => {
  events.push({ scrollDepth, handler, isFired: false })
}

const processEvents = () => {
  const scrolledPercent = getScrollPercent()
  events = events.map((event) => {
    if (!event.isFired && event.scrollDepth <= scrolledPercent) {
      event.handler(scrolledPercent)
      return { ...event, isFired: true }
    }
    return event
  })
}

bind(window, 'scroll', processEvents, false)

export const reset = () => {
  events = events.map(event => ({ ...event, isFired: false }))
}

export default (scrollDepth, handler) => {
  if (!scrollDepth) return

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackScroll`.')
  }

  String(scrollDepth)
    .replace(/\s+/mg, '')
    .split(',')
    .forEach((scrollPersentStr) => {
      const scrollPersent = parseInt(scrollPersentStr)
      if (scrollPersent > 0 && scrollPersent <= 100) {
        addEvent(scrollPersent, handler)
      }
    })
}
