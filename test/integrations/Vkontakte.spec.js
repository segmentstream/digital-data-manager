import assert from 'assert'
import sinon from 'sinon'
import noop from '@segmentstream/utils/noop'
import reset from '../reset'
import Vkontakte from '../../src/integrations/Vkontakte'
import ddManager from '../../src/ddManager'

describe('Integrations: Vkontakte', () => {
  let vk
  const options = {
    pixels: [{
      pixelId: 'VK-RTRG-96471-KZ24cpR',
      priceListId: 2
    }],
    customEvents: {
      'Viewed Product Detail': 'product-detail'
    },
    eventPixels: {
      // eslint-disable-next-line
      'Viewed Product Detail': '//vk.com/rtrg?r=Ug6K6tdSZ*shxgTtjsI9bzDBp1ShCs3q3RdXVNHK1asqy2mLKDvJxuvWw8M7hqktulxtbSlnJsT7*/7Jf5MzEfqO3K5TF9z2zwlFLTuWCy3PiRkO9Ga1I6yOoseM*lfVbhVlQRoHjI5Bt66fOiB1TZLJEZ5nGwFALsuVd5WmSrk-',
    }
  }

  beforeEach(() => {
    window.digitalData = {
      page: {},
      user: {},
      events: []
    }
    vk = new Vkontakte(window.digitalData, options)
    ddManager.addIntegration('Vkontakte', vk)

    sinon.stub(vk, 'onLoad').callsFake(() => true)
    window.VK = window.VK || {}
    window.VK.Retargeting = window.VK.Retargeting || {
      Init: noop,
      Event: noop,
      Hit: noop,
      ProductEvent: noop
    }
    sinon.stub(window.VK.Retargeting, 'Init')
    sinon.stub(window.VK.Retargeting, 'Event')
    sinon.stub(window.VK.Retargeting, 'ProductEvent')
    sinon.stub(window.VK.Retargeting, 'Hit')
  })

  afterEach(() => {
    vk.reset()
    ddManager.reset()
    reset()
  })

  describe('before loading', () => {
    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.strict.equal(options.eventPixels, vk.getOption('eventPixels'))
      })
    })

    describe('#initialize', () => {
      it('should call init after initialization', () => {
        ddManager.initialize()
        vk.getOption('pixels').forEach((pixelSetting) => {
          assert.ok(window.VK.Retargeting.Init.calledWith(pixelSetting.pixelId))
        })
      })
    })
  })

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.spy(vk, 'addPixel')
      ddManager.once('ready', done)
      ddManager.initialize()
    })

    afterEach(() => {
      vk.addPixel.restore()
    })

    describe('#onViewedPageEvent', () => {
      it('shoud send hit', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Page',
          page: {},
          callback: () => {
            assert.ok(window.VK.Retargeting.Hit.calledTwice)
            done()
          }
        })
      })
    })

    describe('#onAnyEvent', () => {
      it('should add pixel to the page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          page: {},
          callback: () => {
            assert.ok(vk.addPixel.called)
            done()
          }
        })
      })

      it('should call custom event in universal pixel', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          page: {},
          callback: () => {
            assert.ok(window.VK.Retargeting.Event.calledWith('product-detail'))
            done()
          }
        })
      })

      it('should not add pixel to the page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product',
          page: {},
          callback: () => {
            assert.ok(!vk.addPixel.called)
            done()
          }
        })
      })
    })
  })
})
