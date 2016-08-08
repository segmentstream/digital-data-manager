import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import Vkontakte from './../../src/integrations/Vkontakte.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: Vkontakte', () => {

  let vk;
  const options = {
    eventPixels: {
      'Viewed Product Detail': '//vk.com/rtrg?r=Ug6K6tdSZ*shxgTtjsI9bzDBp1ShCs3q3RdXVNHK1asqy2mLKDvJxuvWw8M7hqktulxtbSlnJsT7*/7Jf5MzEfqO3K5TF9z2zwlFLTuWCy3PiRkO9Ga1I6yOoseM*lfVbhVlQRoHjI5Bt66fOiB1TZLJEZ5nGwFALsuVd5WmSrk-'
    },
  };

  beforeEach(() => {
    window.digitalData = {
      page: {},
      user: {},
      events: []
    };
    vk = new Vkontakte(window.digitalData, options);
    ddManager.addIntegration('Vkontakte', vk);
  });

  afterEach(() => {
    vk.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {

    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.equal(options.eventPixels, vk.getOption('eventPixels'));
      });
    });

    describe('#initialize', () => {
      it('should call ready after initialization', () => {
        sinon.stub(vk, 'onLoad');
        ddManager.initialize();
        assert.ok(vk.onLoad.calledOnce);
        vk.onLoad.restore();
      });
    });
  });

  describe('loading', function () {
    it('should load', function (done) {
      assert.ok(!vk.isLoaded());
      ddManager.once('load', () => {
        assert.ok(vk.isLoaded());
        done();
      });
      ddManager.initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.spy(vk, 'addPixel');
      ddManager.once('ready', done);
      ddManager.initialize({
        autoEvents: false
      });
    });

    afterEach(() => {
      vk.addPixel.restore();
    });

    describe('#onAnyEvent', () => {
      it('should add pixel to the page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product Detail',
          category: 'Ecommerce',
          page: {},
          callback: () => {
            assert.ok(vk.addPixel.called);
            done();
          }
        });
      });

      it('should not add pixel to the page', (done) => {
        window.digitalData.events.push({
          name: 'Viewed Product',
          category: 'Ecommerce',
          page: {},
          callback: () => {
            assert.ok(!vk.addPixel.called);
            done();
          }
        });
      });

    });
  });
});
