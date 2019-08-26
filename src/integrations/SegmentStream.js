import deleteProperty from '@segmentstream/utils/deleteProperty'
import each from '@segmentstream/utils/each'
import { getProp } from '@segmentstream/utils/dotProp'
import Integration from '../Integration'

import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT
} from '../events/semanticEvents'

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  ADDED_PRODUCT
]

class SegmentStream extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      sessionLength: 1800, // 30 min
      storagePrefix: 'ss:'
    }, options)

    super(digitalData, optionsWithDefaults)

    this.addTag({
      type: 'script',
      attr: {
        id: 'segmentstream-sdk',
        src: '//cdn.driveback.ru/js/segmentstream.js'
      }
    })
  }

  getSemanticEvents () {
    return SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    let enrichableProps = []
    switch (event.name) {
      case 'Viewed Product Detail':
        enrichableProps = [
          'product'
        ]
        break
      default:
      // do nothing
    }
    return enrichableProps
  }

  initialize () {
    const ssApi = window.ssApi = window.ssApi || []

    if (ssApi.initialize) return

    if (ssApi.invoked) {
      throw new Error('SegmentStream snippet included twice.')
    }

    ssApi.invoked = true

    ssApi.methods = [
      'initialize',
      'track',
      'getData',
      'getAnonymousId',
      'pushOnReady'
    ]

    ssApi.factory = method => function stub (...args) {
      args.unshift(method)
      ssApi.push(args)
      return ssApi
    }

    for (let i = 0; i < ssApi.methods.length; i += 1) {
      const key = ssApi.methods[i]
      ssApi[key] = ssApi.factory(key)
    }

    ssApi.initialize(this._options)
    this.enrichDigitalData()
  }

  isLoaded () {
    return !!(window.ssApi && !Array.isArray(window.ssApi))
  }

  reset () {
    deleteProperty(window, 'ssApi')
    window.localStorage.clear()
  }

  enrichDigitalData () {
    function lowercaseFirstLetter (string) {
      return string.charAt(0).toLowerCase() + string.slice(1)
    }

    window.ssApi.pushOnReady(() => {
      const { attributes } = window.ssApi.getData()
      const ssAttributes = {}
      each(attributes, (name, value) => {
        const key = lowercaseFirstLetter(name)
        ssAttributes[key] = value
      })

      this.digitalData.user.anonymousId = getProp(this.digitalData, 'user.anonymousId') || window.ssApi.getAnonymousId()
      this.digitalData.user.ssAttributes = ssAttributes
      this.onEnrich()
    })
  }

  trackEvent (event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [ADDED_PRODUCT]: 'onAddedProduct'
    }

    const method = methods[event.name]
    if (method) {
      this[method](event)
    }
  }

  onViewedPage () {
    window.ssApi.pushOnReady(() => {
      window.ssApi.track('Viewed Page')
      this.enrichDigitalData()
    })
  }

  onViewedProductDetail (event) {
    window.ssApi.pushOnReady(() => {
      window.ssApi.track('Viewed Product Detail', {
        price: event.product.unitSalePrice || event.product.unitPrice || 0
      })
      this.enrichDigitalData()
    })
  }

  onAddedProduct (event) {
    window.ssApi.pushOnReady(() => {
      window.ssApi.track('Added Product', {
        price: event.product.unitSalePrice || event.product.unitPrice || 0
      })
      this.enrichDigitalData()
    })
  }
}

export default SegmentStream
