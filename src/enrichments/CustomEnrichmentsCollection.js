// !!! LEGACY LIBRARY @TODO: remove after full propogation of initialization 1.2.9

import CustomEnrichment from './CustomEnrichment'

class CustomEnrichmentsCollection {
  constructor (event, beforeEvent) {
    this.event = event
    this.beforeEvent = beforeEvent
    this.enrichments = []
    this.enrichmentsIndex = {}
  }

  setDigitalData (digitalData) {
    this.digitalData = digitalData
  }

  getDigitalData () {
    return this.digitalData
  }

  setDDStorage (ddStorage) {
    this.ddStorage = ddStorage
  }

  getDDStorage () {
    return this.ddStorage
  }

  addEnrichment (config) {
    const { prop } = config
    const enrichment = new CustomEnrichment(config, this)
    this.enrichments.push(enrichment)
    this.enrichmentsIndex[prop] = enrichment
  }

  getEnrichment (prop) {
    return this.enrichmentsIndex[prop]
  }

  reset () {
    this.enrichments.forEach((enrichment) => {
      enrichment.reset()
    })
  }

  enrich (target, args) {
    this.reset()
    this.enrichments.forEach((enrichment) => {
      enrichment.enrich(target, args)
    })
  }
}

export default CustomEnrichmentsCollection
