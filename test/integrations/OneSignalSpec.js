import OneSignal from './../../src/integrations/OneSignal.js';
import ddManager from './../../src/ddManager.js';
import sinon from 'sinon';
import assert from 'assert';
import reset from './../reset.js';
import after from './../../src/functions/after.js';
import deleteProperty from './../../src/functions/deleteProperty.js';
import platform from 'platform';

describe('OneSignal', function() {

  let _oneSignal;
  let options = {
    appId: 'b8c0d1f6-a49a-4f6e-abeb-8a742ee01dd0'
  };

  beforeEach(() => {
    window.digitalData = {
      events: []
    };
    _oneSignal = new OneSignal(window.digitalData, options);
    ddManager.addIntegration('OneSignal', _oneSignal);
  });

  afterEach(() => {
    _oneSignal.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(_oneSignal, 'load');
    });

    afterEach(function () {
      _oneSignal.load.restore();
    });

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.equal(options.appId, _oneSignal.getOption('appId'));
        assert.equal('script', _oneSignal.getTag().type);
        assert.equal(_oneSignal.getTag().attr.src, 'https://cdn.onesignal.com/sdks/OneSignalSDK.js');
      });
    });

    describe('#initialize', () => {
      it('should initialize OneSignal queue object', () => {
        ddManager.initialize();
        assert.ok(window.OneSignal);
        assert.ok(window.OneSignal.push);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(_oneSignal.load.calledOnce);
      });
    });
  });

  describe('loading', function () {
    beforeEach(() => {
      sinon.stub(_oneSignal, 'load', () => {
        window.OneSignal = {
          push: () => {}
        };
        _oneSignal.ready();
      });
    });

    afterEach(() => {
      _oneSignal.load.restore();
    });

    it('should load', function (done) {
      assert.ok(!_oneSignal.isLoaded());
      ddManager.once('ready', () => {
        assert.ok(_oneSignal.isLoaded());
        done();
      });
      ddManager.initialize({
        autoEvents: false
      });
    });
  });

  describe('after loading', function () {

    beforeEach((done) => {
      window.digitalData.user = {
        test: 'test',
        obj: {
          param1: 'test',
          param2: 'test'
        }
      };

      _oneSignal.once('ready', () => {
        sinon.spy(window.OneSignal, 'push');
        done();
      });
      ddManager.initialize({
        autoEvents: false
      });
    });

    afterEach(() => {
      window.OneSignal.push.restore();
    });

    describe('#enrichDigitalData', () => {

      it.only('should enrich digitalData.user', () => {
        assert.ok(window.digitalData.user.pushNotifications);
      });

      it('should not support push notifications only in certain browsers', () => {
        const isSupported = window.digitalData.user.pushNotifications.isSupported;
        console.log(platform.name, platform.version, platform.os.family, isSupported);
        if (['IE', 'Edge'].indexOf(platform.name) >= 0) {
          assert.ok(!isSupported);
        } else if (['Safari', 'Chrome', 'Firefox'].indexOf(platform.name) >= 0) {
          if (platform.name === 'Safari') {
            if (platform.is === 'iOS' || parseInt(platform.version) < 9) {
              assert.ok(!isSupported);
            } else {
              assert.ok(isSupported);
            }
          }
          if (['Safari', 'Chrome'].indexOf(platform.name) >= 0) {
            if (platform.os === 'iOS') {
              assert.ok(!isSupported);
            } else {
              assert.ok(isSupported);
            }
          } else if (platform.name === 'Chrome') {
            assert.ok(isSupported);
          }
        } else {
          assert.ok(!isSupported);
        }
      });
    });

    describe('digitalData changes', () => {

      afterEach(() => {
        window.oSpP.push.restore();
      });

      it('should add additional params to SendPulse once integration is initialized', (done) => {
        setTimeout(() => {
          assert.ok(window.oSpP.push.calledWith('test', 'test'));
          done();
        }, 101);
      });

      it('should add additional params to SendPulse if user is subscribed', (done) => {
        window.digitalData.user.city = 'New York';
        window.digitalData.user.isBoolean = true;
        window.digitalData.user.test = 'test';
        window.oSpP.push.restore();
        sinon.spy(window.oSpP, 'push');
        setTimeout(() => {
          assert.ok(window.oSpP.push.calledWith('city', 'New York'));
          assert.ok(window.oSpP.push.calledWith('isBoolean', 'true'));
          assert.ok(!window.oSpP.push.calledWith('test', 'test'));
          done();
        }, 101);
      });

      it('should not add additional params to SendPulse if user is not subscribed', (done) => {
        window.digitalData.user.pushNotifications.isSubscribed = false;
        window.oSpP.push.restore();
        sinon.spy(window.oSpP, 'push');
        window.digitalData.user.city = 'New York';
        setTimeout(() => {
          assert.ok(!window.oSpP.push.called);
          done();
        }, 100);
      });

    });

    describe('oSpP.storeSubscription', () => {

      it('should send user attributes if any', () => {
        window.digitalData.user.test = 'test';
        //sinon.spy(window.oSpP, 'push');
        window.oSpP.storeSubscription('DUMMY');
        assert.ok(window.oSpP.push.calledWith('test', 'test'));
      });

    });

    describe('#trackEvent', () => {

      it('should call oSpP.showPopUp', (done) => {
        sinon.spy(window.oSpP, 'showPopUp');
        window.digitalData.events.push({
          name: 'Agreed to Receive Push Notifications',
          callback: () => {
            assert.ok(window.oSpP.showPopUp.calledOnce);
            window.oSpP.showPopUp.restore();
            done();
          }
        });
      });

      it('should call oSpP.startSubscription', (done) => {
        window.oSpP.detectBrowser = () => {
          return {
            name: 'Safari',
            version: '9.0.3'
          }
        };
        window.oSpP.isSafariNotificationSupported = () => {
          return true;
        };
        sinon.spy(window.oSpP, 'startSubscription');
        window.digitalData.events.push({
          name: 'Agreed to Receive Push Notifications',
          callback: () => {
            assert.ok(window.oSpP.startSubscription.calledOnce);
            window.oSpP.startSubscription.restore();
            done();
          }
        });
      });

      it('should call oSpP.startSubscription for https website', (done) => {
        sinon.stub(_sp, 'isHttps', () => {
          return true;
        });
        window.oSpP.isServiceWorkerChromeSupported = () => {
          return true;
        };
        sinon.spy(window.oSpP, 'startSubscription');
        window.digitalData.events.push({
          name: 'Agreed to Receive Push Notifications',
          callback: () => {
            assert.ok(window.oSpP.startSubscription.calledOnce);
            window.oSpP.startSubscription.restore();
            done();
          }
        });
        _sp.isHttps.restore();
      });

    });
  });
});
