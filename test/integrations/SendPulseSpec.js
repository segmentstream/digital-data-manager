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
    ddManager.addIntegration(_sp);
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

      sinon.stub(_sp, 'load', function() {
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
          push: (key, value) => {},
          showPopUp: () => {},
          startSubscription: () => {},
        };
        _sp.ready();
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

    });

    describe('digitalData changes', () => {

      afterEach(() => {
        window.oSpP.push.restore();
      });

      it('should add additional params to SendPulse if user is subscribed', (done) => {
        const doneAfter = after(1, done);
        sinon.stub(window.oSpP, 'push', (key) => {
          assert.ok(['city', 'test'].indexOf(key));
          doneAfter();
        });
        window.digitalData.user.city = 'New York';
      });

      it('should not add additional params to SendPulse if user is not subscribed', (done) => {
        window.digitalData.user.pushNotifications.isSubscribed = false;
        sinon.spy(window.oSpP, 'push');
        window.digitalData.user.city = 'New York';
        setTimeout(() => {
          assert.ok(!window.oSpP.push.called);
          done();
        }, 100);
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

    });
  });
});