import sinon from 'sinon';
import noop from '@segmentstream/utils/noop';
import reset from '../reset';
import GoogleAnalytics from '../../src/integrations/GoogleAnalytics';
import Renta from '../../src/integrations/Renta';
import ddManager from '../../src/ddManager';

describe('Integrations: Renta', () => {
  describe('Renta', () => {
    let ga;
    let renta;
    const options = { trackingId: 'UA-51485228-1', doman: 'auto' };

    beforeEach(() => {
      window.digitalData = { events: [] };
      ga = new GoogleAnalytics(window.digitalData, options);
      renta = new Renta(window.digitalData);

      ga.reset();
      renta.reset();

      ddManager.addIntegration('Google Analytics', ga);
      ddManager.addIntegration('Renta Streaming', renta);
    });

    afterEach(() => {
      ga.reset();
      renta.reset();
      ddManager.reset();
      reset();
    });

    describe('before loading', () => {
      beforeEach(() => {
        sinon.stub(ga, 'load');
        sinon.stub(renta, 'load');
      });

      afterEach(() => {
        ga.load.restore();
        renta.load.restore();
      });

      describe('#initialize', () => {
        it('should require Google Analytics Renta plugin', () => {
          window.ga = noop;
          sinon.stub(window, 'ga');
          ddManager.initialize();
          ddManager.on('ready', () => {
            window.ga.calledWith('require', 'RentaStreaming');
            window.ga.restore();
          });
        });
      });
    });
  });
});
