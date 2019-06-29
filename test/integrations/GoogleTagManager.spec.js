import assert from 'assert'
import sinon from 'sinon'
import reset from '../reset'
import GoogleTagManager from '../../src/integrations/GoogleTagManager'
import ddManager from '../../src/ddManager'

describe('Integrations: GoogleTagManager', () => {
  describe('using containerID', () => {
    let gtm
    const options = {
      containerId: 'GTM-M9CMLZ'
    }

    beforeEach(() => {
      gtm = new GoogleTagManager(window.digitalData, options)
      ddManager.addIntegration('Google Tag Manager', gtm)
    })

    afterEach(() => {
      gtm.reset()
      ddManager.reset()
      reset()
    })

    describe('#constructor', () => {
      it('should create GTM integrations with proper options and tags', () => {
        assert.strict.equal(options.containerId, gtm.getOption('containerId'))
        assert.strict.equal('script', gtm.getTag().type)
        assert.ok(gtm.getTag().attr.src.indexOf(options.containerId) > 0)
      })
    })

    describe('#isLoaded', () => {
      it('should return false if current gtm is not loaded ', () => {
        const anotherGTM = 'GTM-1351ME'
        assert.ok(!gtm.isLoaded())

        // emulate loading of another GTM from site code
        window.google_tag_manager = { [anotherGTM]: { dataLayer: { push: () => {} } } }
        window.dataLayer = { push: () => {} }

        assert.ok(!gtm.isLoaded())
      })

      it('should return true if current gtm is loaded ', () => {
        assert.ok(!gtm.isLoaded())

        // emulate loading same GTM from site code
        window.google_tag_manager = { [options.containerId]: { dataLayer: { push: () => {} } } }
        window.dataLayer = { push: () => {} }

        assert.ok(gtm.isLoaded())
      })
    })

    describe('#load', () => {
      it('should load', (done) => {
        assert.ok(!gtm.isLoaded())
        gtm.once('load', () => {
          assert.ok(gtm.isLoaded())
          done()
        })
        ddManager.initialize()
      })
    })

    describe('after loading', () => {
      beforeEach((done) => {
        gtm.once('load', done)
        ddManager.initialize()
      })

      it('should update dataLayer', (done) => {
        const dl = window.dataLayer
        assert.ok(dl)
        setTimeout(() => {
          assert.ok(dl.find(dlItem => dlItem.event === 'gtm.js'))
          assert.ok(dl.find(dlItem => dlItem.event === 'DDManager Ready'))
          // assert.ok(dl.find((dlItem) => {
          //   return dlItem.event === 'DDManager Loaded';
          // }));
          assert.ok(dl.find(dlItem => dlItem.event === 'gtm.dom'))
          assert.ok(dl.find(dlItem => dlItem.event === 'gtm.load'))
          done()
        }, 10)
      })

      describe('#trackEvent', () => {
        beforeEach(() => {
          window.dataLayer = []
          sinon.stub(window.dataLayer, 'push')
        })

        afterEach(() => {
          window.dataLayer.push.restore()
        })

        it('should send event', (done) => {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            callback: () => {
              assert.ok(window.dataLayer.push.calledWithMatch({
                event: 'some-event',
                eventCategory: 'some-category'
              }))
              done()
            }
          })
        })

        it('should send event with additional parameters', (done) => {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            additionalParam: true,
            callback: () => {
              assert.ok(window.dataLayer.push.calledWithMatch({
                event: 'some-event',
                additionalParam: true
              }))
              done()
            }
          })
        })
      })
    })
  })

  describe('using existing GTM', () => {
    let gtm

    beforeEach(() => {
      window.dataLayer = []
      // window.dataLayer.push = function() {
      //   window.dataLayer.prototype.apply(this,arguments);
      // };
      gtm = new GoogleTagManager(window.digitalData, {
        noConflict: true
      })
      ddManager.addIntegration('Google Tag Manager', gtm)
    })

    afterEach(() => {
      gtm.reset()
      ddManager.reset()
      reset()
    })

    describe('after loading', () => {
      beforeEach((done) => {
        ddManager.once('ready', done)
        ddManager.initialize()
        sinon.stub(window.dataLayer, 'push')
      })

      afterEach(() => {
        window.dataLayer.push.restore()
      })

      describe('#trackEvent', () => {
        it('should send event with additional parameters to existing GTM', (done) => {
          window.digitalData.events.push({
            name: 'some-event',
            category: 'some-category',
            additionalParam: true,
            callback: () => {
              assert.ok(window.dataLayer.push.calledWithMatch({
                event: 'some-event',
                additionalParam: true
              }))
              done()
            }
          })
        })
      })
    })
  })
})
