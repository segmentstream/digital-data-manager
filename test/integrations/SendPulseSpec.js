import SendPulse from './../../src/integrations/SendPulse.js';
import ddManager from './../../src/ddManager.js';
import sinon from 'sinon';
import assert from 'assert';
import reset from './../reset.js';
import after from './../../src/functions/after.js';
import deleteProperty from './../../src/functions/deleteProperty.js';

describe('SendPulse', function() {

  let _sp;
  let options = {
    pushScriptUrl: '//cdn.sendpulse.com/js/push/e3f319c5d3eb82e6edce82a263b937d0_0.js'
  };

  beforeEach(() => {
    window.digitalData = {
      events: []
    };
    _sp = new SendPulse(window.digitalData, options);
    ddManager.addIntegration('SendPulse', _sp);
  });

  afterEach(() => {
    _sp.reset();
    ddManager.reset();
    reset();
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

      sinon.stub(_sp, 'load', function(callback) {
        window.oSpP = {
          detectSite: () => {
            return true;
          },
          detectOs: () => {
            return 'Mac OS X';
          },
          detectBrowser:() => {
            return {
              name: 'Firefox',
              version: 44
            }
          },
          getDbValue: (param1, param2, callback) => {
            setTimeout(() => {
              callback({
                target: {
                  result: {
                    type: 'SubscriptionId',
                    value: "v1/gAAAAABW9rF70jehdBnhO...O1DEYc0qZud-g-FdaW73j__"
                  }
                }
              });
            }, 0);
          },
          storeSubscription: () => {},
          push: (key, value) => {},
          showPopUp: () => {},
          startSubscription: () => {},
          isServiceWorkerChromeSupported: () => {},
        };
        sinon.stub(window.oSpP, 'push');
        callback();
      });

      ddManager.once('ready', done);
      ddManager.initialize({
        autoEvents: false
      });
    });

    afterEach(() => {
      _sp.load.restore();
    });

    describe('#enrichDigitalData', () => {

      it('should enrich digitalData.user', () => {
        assert.ok(window.digitalData.user.pushNotifications);
      });

      it('should not support push notifications for IE and Edge', () => {
        window.oSpP.detectBrowser = () => {
          return {
            name: 'Edge',
            version: '25.10'
          }
        };
        assert.ok(!_sp.checkPushNotificationsSupport());
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