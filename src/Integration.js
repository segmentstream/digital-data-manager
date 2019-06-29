import loadScript from '@segmentstream/utils/loadScript'
import loadLink from '@segmentstream/utils/loadLink'
import loadIframe from '@segmentstream/utils/loadIframe'
import loadPixel from '@segmentstream/utils/loadPixel'
import format from '@segmentstream/utils/format'
import clone from '@segmentstream/utils/clone'
import noop from '@segmentstream/utils/noop'
import log from '@segmentstream/utils/log'
import deleteProperty from '@segmentstream/utils/deleteProperty'
import { warn, error as errorLog } from '@segmentstream/utils/safeConsole'
import each from '@segmentstream/utils/each'
import nextTick from 'async/nextTick'
import EventEmitter from 'component-emitter'

export default class Integration extends EventEmitter {
  constructor (digitalData, options, tags) {
    super()
    this.options = options || {}
    this.overrideFunctions = {}
    if (options && options.overrideFunctions) {
      this.defineOverrideFunctions(options.overrideFunctions)
    }
    this.digitalData = digitalData
    this.tags = tags || {}
    this.onLoad = this.onLoad.bind(this)
    this._isEnriched = false
    this._isInitialized = false
    this._productOverrideErrorFired = false

    this.overrideOptions()
  }

  defineOverrideFunctions (overrideFunctions) {
    // TODO: refactoring
    if (overrideFunctions.event) {
      this.overrideFunctions.event = (event) => {
        try {
          overrideFunctions.event.bind(this)(event)
        } catch (e) {
          log(`function override error for event ${event.name} in integration ${this.getName()}: ${e}`, log.ERROR)
        }
      }
    }
    if (overrideFunctions.product) {
      this.overrideFunctions.product = (product) => {
        try {
          overrideFunctions.product.bind(this)(product)
        } catch (e) {
          if (!this._productOverrideErrorFired) {
            log(`function override error for product in integration ${this.getName()}: ${e}`, log.ERROR)
            this._productOverrideErrorFired = true
          }
        }
      }
    }
    if (overrideFunctions.options) {
      this.overrideFunctions.options = (options) => {
        try {
          overrideFunctions.options.bind(this)(options)
        } catch (e) {
          log(`function override error for options of integration ${this.getName()}: ${e}`, log.ERROR)
        }
      }
    }
  }

  getProductOverrideFunction () {
    return this.overrideFunctions.product
  }

  getEventOverrideFunction () {
    return this.overrideFunctions.event
  }

  getOptionsOverrideFunction () {
    return this.overrideFunctions.options
  }

  overrideOptions () {
    const optionsOverrideFunction = this.getOptionsOverrideFunction()
    if (optionsOverrideFunction) {
      optionsOverrideFunction(this.options)
    }
  }

  getEventEnrichments () {
    return this.getOption('eventEnrichments') || []
  }

  setName (name) {
    this.name = name
  }

  getName () {
    return this.name
  }

  initialize () {
    const { onLoad } = this
    this._isLoaded = true
    nextTick(onLoad)
  }

  load (tagName, params, callback) {
    let callbackCalled = false
    const safeCallback = () => {
      if (!callbackCalled) {
        callback()
        callbackCalled = true
      }
    }

    // sometimes loadScript callback doesn't fire
    // for https scripts in IE8, IE9 and opera
    // in this case we check is script was loaded every 500ms
    const intervalId = setInterval(() => {
      if (this.isLoaded()) {
        safeCallback()
        clearInterval(intervalId)
      }
    }, 500)

    // Argument shuffling
    if (typeof tagName === 'function') {
      callback = tagName
      params = null
      tagName = null
    }
    if (tagName && typeof tagName === 'object') {
      callback = params
      params = tagName
      tagName = null
    }
    if (typeof params === 'function') {
      callback = params
      params = null
    }

    // Default arguments
    tagName = tagName || 'library'

    const tag = this.tags[tagName]
    if (!tag) throw new Error(format('tag "%s" not defined.', tagName))
    callback = callback || noop

    let el
    const attr = clone(tag.attr) // should be cloned as modified later

    this.replaceAttrTemplate(params, attr)

    switch (tag.type) {
      case 'img':
        attr.width = 1
        attr.height = 1
        el = loadPixel(attr, safeCallback)
        break
      case 'script':
        el = loadScript(attr, (err) => {
          if (!err) {
            safeCallback()
          } else {
            errorLog(`error loading "${tagName}" error="${err}"`)
          }
        })
        // TODO: hack until refactoring load-script
        deleteProperty(attr, 'src')
        each(attr, (key, value) => {
          el.setAttribute(key, value)
        })
        break
      case 'link':
        el = loadLink(attr, (err) => {
          if (!err) {
            safeCallback()
          } else if (params && typeof params.onError === 'function') {
            warn(`error loading "${tagName}" error="${err}"`)
            params.onError()
          } else {
            errorLog(`error loading "${tagName}" error="${err}"`)
          }
        })
        break
      case 'iframe':
        el = loadIframe(attr, safeCallback)
        break
      default:
      // No default case
    }
  }

  // TODO to pure function
  replaceAttrTemplate (params, attr) {
    if (!params) return attr

    each(attr, (attrKey, attrVal) => {
      if (attrKey === 'onError') return
      if (attrVal) {
        attr[attrKey] = attrVal
          .replace(/\{\{ *(\w+) *\}\}/g, (_, $1) => ((params[$1] !== undefined) ? params[$1] : ''))
      }
      if (attrKey === 'src' || attrKey === 'href') {
        attr[attrKey] = attr[attrKey].replace(/[^?=&]+=(&|$)/g, '').replace(/&$/, '')
      }
    })
    return attr
  }

  isLoaded () {
    return !!this._isLoaded
  }

  onLoadInitiated () {
    // abstract
  }

  onLoad () {
    this.emit('load')
  }

  addTag (name, tag) {
    if (!tag) {
      tag = name
      name = 'library'
    }

    this.tags[name] = tag
    return this
  }

  getTag (name) {
    if (!name) {
      name = 'library'
    }
    return this.tags[name]
  }

  setOption (name, value) {
    this.options[name] = value
    return this
  }

  getOption (name) {
    return this.options[name]
  }

  reset () {
    this._isLoaded = false
    this._isInitialized = false
  }

  onEnrich () {
    this._isEnriched = true
    this.emit('enrich')
  }

  enrichDigitalData () {
    // abstract
  }

  getEnrichableEventProps () {
    return []
  }

  getEventValidationConfig () {

  }

  getSemanticEvents () {
    return []
  }

  getIgnoredEvents () {
    return []
  }

  allowCustomEvents () {
    return false
  }

  allowNoConflictInitialization () {
    return false
  }

  isEnriched () {
    return this._isEnriched
  }

  isInitialized () {
    return this._isInitialized
  }

  setInitialized (initialized) {
    this._isInitialized = initialized
    if (this._isInitialized) {
      this.emit('ready')
    }
  }

  setDDManager (ddManager) {
    this.ddManager = ddManager
  }

  trackEvent () {
    // abstract
  }

  pushEventQueue (event) {
    if (this.eventQueueFlushed) {
      this.trackEvent(event)
    } else {
      this.eventQueue = this.eventQueue || []
      this.eventQueue.push(event)
    }
  }

  flushEventQueue () {
    this.eventQueue = this.eventQueue || []

    let event = this.eventQueue.shift()
    while (event) {
      this.trackEvent(event)
      event = this.eventQueue.shift()
    }

    this.eventQueueFlushed = true
  }

  on (event, handler) {
    this.addEventListener(event, handler)
  }

  addEventListener (event, handler) {
    if (event === 'enrich') {
      if (this._isEnriched) {
        handler()
        return
      }
    } else if (event === 'load') {
      if (this.isLoaded()) {
        handler()
        return
      }
    }

    super.addEventListener(event, handler)
  }
}
