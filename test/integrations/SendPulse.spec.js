import SendPulse from './../../src/integrations/SendPulse.js';
import ddManager from './../../src/ddManager.js';
import sinon from 'sinon';
import assert from 'assert';
import reset from './../reset.js';
import after from '@segmentstream/utils/after.js';
import deleteProperty from '@segmentstream/utils/deleteProperty.js';

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

      sinon.stub(_sp, 'load').callsFake(function(callback) {
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
                    value: 'v1/gAAAAABW9rF70jehdBnhO...O1DEYc0qZud-g-FdaW73j__'
                  }
                }
              });
            }, 1);
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
      ddManager.initialize();
    });

    afterEach(() => {
      _sp.load.restore();
    });

    describe('#enrichDigitalData', () => {

      it('should enrich digitalData.user', (done) => {
        _sp.on('enrich', () => {
          assert.ok(window.digitalData.user.pushNotifications);
          done();
        });
      });

      it('should not support push notifications for IE and Edge', (done) => {
        _sp.on('enrich', () => {
          window.oSpP.detectBrowser = () => {
            return {
              name: 'Edge',
              version: '25.10'
            }
          };
          assert.ok(!_sp.checkPushNotificationsSupport());
          done();
        });
      });
    });

    describe('digitalData changes', () => {

      afterEach(() => {
        window.oSpP.push.restore();
      });

      it('should add additional params to SendPulse once integration is initialized (legacy version)', (done) => {
        _sp.setOption('userVariables', ['test']);
        _sp.once('enrich', () => {
          assert.ok(window.oSpP.push.calledWith('test', 'test'));
          done();
        })
      });

      it('should not add additional params to SendPulse once integration is initialized (legacy version)', (done) => {
        _sp.once('load', () => {
          assert.ok(!window.oSpP.push.calledWith('test', 'test'));
          done();
        })
      });

      // it('should add additional params to SendPulse once integration is initialized', (done) => {
      //   _sp.setOption('userVariables', ['user.test']);
      //   _sp.once('load', () => {
      //     assert.ok(window.oSpP.push.calledWith('test', 'test'));
      //     done();
      //   })
      // });

      it('should not add additional params to SendPulse once integration is initialized', (done) => {
        _sp.once('enrich', () => {
          assert.ok(!window.oSpP.push.calledWith('test', 'test'));
          done();
        })
      });
    });

    describe('oSpP.storeSubscription', () => {

      it('should send user attributes if any', (done) => {
        _sp.setOption('userVariables', ['test']);
        _sp.once('enrich', () => {
          window.digitalData.user.test = 'test';
          //sinon.spy(window.oSpP, 'push');
          window.oSpP.storeSubscription('DUMMY');
          assert.ok(window.oSpP.push.calledWith('test', 'test'));
          done();
        });
      });

      it('should not send user attributes if any', (done) => {
        _sp.once('enrich', () => {
          window.digitalData.user.test = 'test';
          //sinon.spy(window.oSpP, 'push');
          window.oSpP.storeSubscription('DUMMY');
          assert.ok(!window.oSpP.push.calledWith('test', 'test'));
          done();
        });
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
        sinon.stub(_sp, 'isHttps').callsFake(() => {
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
            _sp.isHttps.restore();
            done();
          }
        });
      });

    });
  });
});
