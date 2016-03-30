import SendPulse from './../../src/integrations/SendPulse.js';
import ddManager from './../../src/ddManager.js';
import sinon from 'sinon';
import assert from 'assert';
import reset from './../reset.js';

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
      window.digitalData.user = {};

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
          }
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

    describe('#enrichDigitalData', function () {

      it('should enrich digitalData.user', () => {
        assert.ok(window.digitalData.user.pushNotifications);
      });

    });
  });
});