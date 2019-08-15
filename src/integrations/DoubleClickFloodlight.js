import cleanObject from '@segmentstream/utils/cleanObject'
import {
  getEnrichableVariableMappingProps,
  extractVariableMappingValues
} from '../IntegrationUtils'
import Integration from '../Integration'

class DoubleClickFloodlight extends Integration {
  constructor (digitalData, options) {
    const optionsWithDefaults = Object.assign({
      events: []
    }, options)

    super(digitalData, optionsWithDefaults)
    this.enrichableEventProps = []
    this.SEMANTIC_EVENTS = []

    this.getOption('events').forEach((eventOptions) => {
      const eventName = eventOptions.event
      const customVars = eventOptions.customVars
      if (!eventName) return
      const variableMappingProps = getEnrichableVariableMappingProps(customVars)
        .filter((item, i, ar) => ar.indexOf(item) === i)
      this.enrichableEventProps[eventName] = (this.enrichableEventProps[eventName] || []).concat(variableMappingProps)
      this.SEMANTIC_EVENTS.push(eventName)
    })

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://www.googletagmanager.com/gtag/js'
      }
    })
  }

  initialize () {
    window.dataLayer = window.dataLayer || []
    if (!window.gtag) {
      window.gtag = function () { window.dataLayer.push(arguments) }
      window.gtag('js', new Date())
    }
    this.getOption('events')
      .map((event) => event.floodlightConfigID)
      .filter((item, index, array) => array.indexOf(item) === index) // unique
      .forEach((configId) => {
        window.gtag('config', `DC-${configId}`)
      })
  }

  getSemanticEvents () {
    return this.SEMANTIC_EVENTS
  }

  getEnrichableEventProps (event) {
    return this.enrichableEventProps[event.name] || []
  }

  trackEvent (event) {
    const events = this.getOption('events').filter(eventOptions => (eventOptions.event === event.name))
    events.forEach((eventOptions) => {
      const {
        floodlightConfigID,
        activityGroupTagString,
        activityTagString,
        countingMethod,
        customVars
      } = eventOptions
      const customVariables = extractVariableMappingValues(event, customVars)
      const commonTagParams = {
        allow_custom_scripts: true,
        send_to: `DC-${floodlightConfigID}/${activityGroupTagString}/${activityTagString}+${countingMethod}`
      }

      let tagParams = commonTagParams
      let tagName = 'conversion'
      if (countingMethod === 'transactions') {
        tagParams = Object.assign(commonTagParams, this.getPurchaseTagParams(event.transaction))
        tagName = 'purchase'
      }

      tagParams = Object.assign(tagParams, customVariables)
      window.gtag('event', tagName, tagParams)
    })
  }

  getPurchaseTagParams (transaction) {
    if (transaction) {
      return cleanObject({
        transaction_id: transaction.orderId,
        value: transaction.total || transaction.subtotal
      })
    }
  }
}

export default DoubleClickFloodlight
