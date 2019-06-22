import assert from 'assert';
import sinon from 'sinon';
import noop from '@segmentstream/utils/noop';
import reset from './../reset.js';
import argumentsToArray from './../functions/argumentsToArray.js';
import GoogleAnalytics from './../../src/integrations/GoogleAnalytics.js';
import OWOXBIStreaming from './../../src/integrations/OWOXBIStreaming.js';
import ddManager from './../../src/ddManager.js';

describe('Integrations: OWOXBIStreaming', () => {

  describe('OWOXBIStreaming', () => {
    let ga;
    let owox;
    const options = {
      trackingId: 'UA-51485228-7',
      domain: 'auto',
    };

    beforeEach(() => {
      window.digitalData = {
        events: [],
      };
      ga = new GoogleAnalytics(window.digitalData, options);
      owox = new OWOXBIStreaming(window.digitalData);

      // reset in case GA was loaded
      // from previous tests asyncronously
      ga.reset();
      owox.reset();

      // OWOX should depend on Google Analtics, so this order is for reason
      // to test that everything works well even if OWOX BI is added before GA
      // TODO: change order and make sure everything works
      ddManager.addIntegration('Google Analytics', ga);
      ddManager.addIntegration('OWOX BI Streaming', owox);
    });

    afterEach(() => {
      ga.reset();
      owox.reset();
      ddManager.reset();
      reset();
    });

    describe('before loading', () => {
      beforeEach(() => {
        sinon.stub(ga, 'load');
        sinon.stub(owox, 'load');
      });

      afterEach(() => {
        ga.load.restore();
        owox.load.restore();
      });

      describe('#initialize', () => {
        it('should require Google Analytics OWOXBIStreaming plugin', () => {
          window.ga = noop;
          sinon.stub(window, 'ga');
          ddManager.initialize();
          ddManager.on('ready', () => {
            window.ga.calledWith('ddl.require', 'OWOXBIStreaming');
            window.ga.calledWith('provide', 'OWOXBIStreaming');
            window.ga.restore();
          });
        });

        it('should require Google Analytics OWOXBIStreaming plugin', () => {
          owox.setOption('sessionStreaming', true);
          owox.setOption('sessionIdDimension', 'sessionId');
          window.ga = noop;
          sinon.stub(window, 'ga');
          ddManager.initialize();
          ddManager.on('ready', () => {
            window.ga.calledWith('ddl.require', 'OWOXBIStreaming', {
              sessionIdDimension: 'sessionId',
            });
            window.ga.restore();
          });
        });
      });
    });
  });
});
