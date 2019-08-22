import deleteProperty from '@segmentstream/utils/deleteProperty'
import { extractVariableMappingValues, getEnrichableVariableMappingProps } from '../IntegrationUtils'
import { getProp } from '@segmentstream/utils/dotProp'
import size from '@segmentstream/utils/size'
import cleanObject from '@segmentstream/utils/cleanObject'
import Integration from '../Integration'
import AsyncQueue from './utils/AsyncQueue'
import { VIEWED_PAGE } from '../events/semanticEvents'

class Calltouch extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
      customParams: undefined
    }, options)
    super(digitalData, optionsWithDefaults)

    const siteId = this.getOption('siteId')

    this.addTag({
      type: 'script',
      attr: {
        src: `//mod.calltouch.ru/init.js?id=${siteId}`,
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
    return !!getProp(window, 'ct_set_attrs')
  }

  reset () {
    deleteProperty(window, 'ct_set_attrs')
    this.pageTracked = false
  }

  getSemanticEvents () {
    return [VIEWED_PAGE]
  }

  getEnrichableEventProps () {
    return getEnrichableVariableMappingProps(this.getOption('customParams'))
  }

  getCustomParams (event) {
    return extractVariableMappingValues(event, this.getOption('customParams'))
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
      if (!this.pageTracked) {
        const customParams = cleanObject(this.getCustomParams(event))

        if (size(customParams)) {
          window.ct_set_attrs(JSON.stringify(customParams))
        }

        this.pageTracked = true
      }
    })
  }
}

export default Calltouch
