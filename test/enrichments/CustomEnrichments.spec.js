import assert from 'assert'
import CustomEnrichments from './../../src/enrichments/CustomEnrichments.js'
import EventManager from './../../src/EventManager'
import Storage from './../../src/Storage.js'
import DDStorage from './../../src/DDStorage.js'

describe('CustomEnrichmentsSpec', () => {
  const digitalData = {
    test: 1,
    changes: []
  }
  window.test = {
    test2: 'test3'
  }
  let ddListener = []
  let ddStorage = new DDStorage(digitalData, new Storage())
  let customEnricher = new CustomEnrichments(digitalData, ddStorage)
  let eventManager

  beforeEach(() => {
    ddStorage = new DDStorage(digitalData, new Storage())
    eventManager = new EventManager(digitalData, ddListener)
    eventManager.initialize()
  })

  afterEach(() => {
    ddStorage.clear()
    eventManager.reset()
    customEnricher.reset()
    digitalData.user = {}
  })

  it('should enrich digitalData with depenencies (single scope)', () => {
    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite',
      event: 'Viewed Page',
      beforeEvent: true,
      handler: function () {
        return this.digitalData('user.visitedWebsite1') && this.digitalData('user.visitedWebsite2')
      },
      dependencies: ['user.visitedWebsite1', 'user.visitedWebsite2']
    })

    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite1',
      event: 'Viewed Page',
      beforeEvent: true,
      handler: function () {
        return true
      }
    })

    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite2',
      event: 'Viewed Page',
      beforeEvent: true,
      handler: function () {
        return true
      }
    })

    customEnricher.enrichDigitalData(digitalData, { name: 'Viewed Page' }, true)
    assert.strict.equal(digitalData.user.visitedWebsite1, true)
    assert.strict.equal(digitalData.user.visitedWebsite2, true)
    assert.strict.equal(digitalData.user.visitedWebsite, true)
  })

  it('should enrich digitalData with depenencies (different scopes)', () => {
    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite',
      event: 'Viewed Page',
      beforeEvent: true,
      handler: function () {
        return this.digitalData('user.visitedWebsite1') && this.digitalData('user.visitedWebsite2')
      },
      dependencies: ['user.visitedWebsite1', 'user.visitedWebsite2']
    })

    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite1',
      event: 'Viewed Page',
      beforeEvent: true,
      handler: function () {
        return true
      }
    })

    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite2',
      event: 'Viewed Page',
      beforeEvent: false,
      handler: function () {
        return true
      }
    })

    customEnricher.enrichDigitalData(digitalData, { name: 'Viewed Page' }, true)
    assert.strict.equal(digitalData.user.visitedWebsite1, true)
    assert.strict.equal(digitalData.user.visitedWebsite2, undefined)
    assert.strict.equal(digitalData.user.visitedWebsite, undefined) // will be enirhmed after event

    customEnricher.enrichDigitalData(digitalData, { name: 'Viewed Page' }, false)
    assert.strict.equal(digitalData.user.visitedWebsite2, true)
  })

  it('should enrich digitalData with recursion protection', () => {
    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite1',
      event: 'Viewed Page',
      beforeEvent: true,
      handler: function () {
        return this.digitalData('user.visitedWebsite2')
      },
      dependencies: ['user.visitedWebsite2']
    })

    customEnricher.addEnrichment({
      prop: 'user.visitedWebsite2',
      event: 'Viewed Page',
      beforeEvent: true,
      handler: function () {
        return this.digitalData('user.visitedWebsite1')
      },
      dependencies: ['user.visitedWebsite1']
    })

    customEnricher.enrichDigitalData(digitalData, { name: 'Viewed Page' })
    assert.strict.equal(digitalData.changes.length, 0)
  })

  it('should enrich digitalData on event', () => {
    customEnricher.addEnrichment({
      prop: 'user.hasTransacted',
      event: 'Completed Transaction',
      beforeEvent: false,
      handler: function () {
        this.queryParam('test')
        this.get(digitalData, 'user.test')
        this.digitalData('user.test')
        this.cookie('test')
        this.global('test.test2')
        this.dataLayer('test.test')
        this.domQuery('.class')
        return true
      },
      persist: true,
      persistTtl: 3600
    })

    customEnricher.enrichDigitalData(digitalData, { name: 'Completed Transaction' })
    assert.strict.deepEqual(digitalData.changes[0], ['user.hasTransacted', true, 'DDManager Custom Enrichment'])
  })

  it('should support window.fetch()', () => {
    assert.ok(window.fetch)
  })
})
