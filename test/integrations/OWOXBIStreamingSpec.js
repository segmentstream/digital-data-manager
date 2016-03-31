import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import argumentsToArray from './../functions/argumentsToArray.js';
import GoogleAnalytics from './../../src/integrations/GoogleAnalytics.js';
import OWOXBIStreaming from './../../src/integrations/OWOXBIStreaming.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: OWOXBIStreaming', () => {

  describe('OWOXBIStreaming', () => {
    let ga;
    let owox;
    let options = {
      trackingId: 'UA-51485228-7',
      domain: 'auto'
    };

    beforeEach(() => {
      window.digitalData = {
        events: []
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      owox = new OWOXBIStreaming(window.digitalData, {
        'sessionIdDimension': 'sessionId'
      });
      ddManager.addIntegration(ga);
      ddManager.addIntegration(owox);
    });

    afterEach(() => {
      ga.reset();
      owox.reset();
      ddManager.reset();
      reset();
    });

    describe('before loading', function () {
      beforeEach(function () {
        sinon.stub(ga, 'load');
        sinon.stub(owox, 'load');
      });

      afterEach(function () {
        ga.load.restore();
        owox.load.restore();
      });

      describe('#initialize', function () {

        it('should require Google Analytics OWOXBIStreaming plugin', function () {
          ga.setOption('sessionIdDimension', 'SessionId');
          ddManager.initialize();
          assert.deepEqual(argumentsToArray(window.ga.q[1]), ['ddl.require', 'OWOXBIStreaming', {
            'sessionIdDimension': 'sessionId'
          }]);
          assert.deepEqual([window.ga.q[2][0], window.ga.q[2][1]], ['provide', 'OWOXBIStreaming']);
        });

      });

    });
  });
});