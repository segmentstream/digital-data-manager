import { error as errorLog } from '@segmentstream/utils/safeConsole'
import isPromise from '@segmentstream/utils/isPromise'
import Handler from '../Handler'
import { CUSTOM_CHANGE_SOURCE } from '../constants'

class CustomEnrichment {
  constructor (config, collection) {
    this.config = config
    this.collection = collection
    this.digitalData = collection.getDigitalData()
    this.ddStorage = collection.getDDStorage()

    this.done = false
    this.recursionFreeze = false
  }

  hasDependencies () {
    return this.config.dependencies && this.config.dependencies.length
  }

  getDependencies () {
    return this.config.dependencies || []
  }

  enrich (target, args) {
    const onValueReceived = (value) => {
      if (value !== undefined) {
        target.changes.push([this.config.prop, value, CUSTOM_CHANGE_SOURCE])
        if (this.config.persist) {
          this.ddStorage.persist(this.config.prop, this.config.persistTtl)
        }
      }
      this.done = true
    }

    if (this.recursionFreeze) return
    this.recursionFreeze = true

    if (this.isDone()) return

    if (this.hasDependencies()) {
      const dependencies = this.getDependencies()
      dependencies.forEach((dependencyProp) => {
        const enrichment = this.collection.getEnrichment(dependencyProp)
        if (enrichment) {
          enrichment.enrich(target, args)
        }
      })
    }

    const handler = new Handler(this.config.handler, this.digitalData, args)
    let result
    try {
      result = handler.run()
      if (isPromise(result)) {
        result.then((value) => {
          onValueReceived(value)
        })
      } else {
        onValueReceived(result)
      }
    } catch (e) {
      e.message = `DDManager Custom Enrichment "${this.config.prop}" Error\n\n ${e.message}`
      errorLog(e)
    }
  }

  isDone () {
    return this.done
  }

  reset () {
    this.done = false
    this.recursionFreeze = false
  }
}

export default CustomEnrichment
