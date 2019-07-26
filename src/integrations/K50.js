import deleteProperty from '@segmentstream/utils/deleteProperty'
import getVarValue from '@segmentstream/utils/getVarValue'
import { getProp } from '@segmentstream/utils/dotProp'
import cleanObject from '@segmentstream/utils/cleanObject'
import Integration from '../Integration'
import AsyncQueue from './utils/AsyncQueue'
import { VIEWED_PAGE } from '../events/semanticEvents'

class K50 extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
      labelVar: undefined
    }, options)
    super(digitalData, optionsWithDefaults)

    this.addTag({
      type: 'script',
      attr: {
        src: '//k50-a.akamaihd.net/k50/k50tracker2.js',
        async: true
      }
    })
  }

  initialize () {
    this.asyncQueue = new AsyncQueue(() => this.isLoaded())
  }

  onLoadInitiated () {
    this.asyncQueue.init()
  }

  isLoaded () {
    return !!getProp(window, 'k50Tracker.init')
  }

  reset () {
    deleteProperty(window, 'k50Tracker')
    this.pageTracked = false
  }

  getSemanticEvents () {
    return [VIEWED_PAGE]
  }

  getEnrichableEventProps (event) {
    let enrichableProps = ['page.url']
    const labelVar = this.getOption('labelVar')
    if (labelVar && labelVar.type === 'digitalData') {
      enrichableProps.push(labelVar.value)
    }
    return enrichableProps
  }

  getLabel (event) {
    const labelVar = this.getOption('labelVar')
    return labelVar ? getVarValue(labelVar, event) : undefined
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage'
    }
    const method = methods[event.name]
    if (method) {
      this[method](event)
    }
  }

  onViewedPage (event) {
    this.asyncQueue.push(() => {
      if (this.pageTracked) {
        return window.k50Tracker.change(
          true,
          cleanObject({
            landing: getProp(event, 'page.url'),
            label: this.getLabel(event)
          })
        )
      }
      window.k50Tracker.init(
        cleanObject({
          siteId: this.getOption('siteId'),
          label: this.getLabel(event)
        })
      )
      this.pageTracked = true
    })
  }
}

export default K50
