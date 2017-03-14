import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset';
import DoubleClickFloodlight from './../../src/integrations/DoubleClickFloodlight';
import ddManager from './../../src/ddManager';

describe('Integrations: DoubleClick Floodlight', () => {
  let doubleClick;
  const options = {
    advertiserId: '123123',
    eventTags: {
      'Custom Event': {
        groupTag: 'customGroup',
        activityTag: 'customActivity',
        customVars: {
          'u1': {
            type: 'digitalData',
            value: 'user.userId'
          },
          'u2': {
            type: 'event',
            value: 'testParam'
          }
        }
      },
      'Completed Transaction': {
        groupTag: 'customSaleGroup',
        activityTag: 'customSaleActivity',
        customVars: {
          'u1': {
            type: 'digitalData',
            value: 'user.userId'
          },
          'u2': {
            type: 'event',
            value: 'testParam'
          }
        }
      }
    }
  };

  beforeEach(() => {
    window.digitalData = {
      website: {},
      page: {},
      user: {
        userId: 'user123',
      },
      events: []
    };
    doubleClick = new DoubleClickFloodlight(window.digitalData, options);
    ddManager.addIntegration('DoubleClick Floodlight', doubleClick);
  });

  afterEach(() => {
    doubleClick.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(doubleClick, 'load');
    });

    afterEach(function () {
      doubleClick.load.restore();
    });

    describe('#constructor', () => {
      it('should add proper options', () => {
        assert.equal(options.advertiserId, doubleClick.getOption('advertiserId'));
      });
    });

    describe('#initialize', () => {
      it('should initialize criteo queue object', () => {
        ddManager.initialize();
        assert.ok(doubleClick.isLoaded());
      });

      it('should not load any tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(!doubleClick.load.calledOnce);
      });
    });
  });


  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(doubleClick, 'load');
      ddManager.once('ready', () => {
        done();
      });
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });

    describe('#Custom Event', () => {
      it('should track custom event', (done) => {
        window.digitalData.events.push({
          name: 'Custom Event',
          testParam: 'testVal',
          callback: () => {
            doubleClick.load.calledWith({
              src: 123123,
              type: 'customGroup',
              cat: 'customActivity',
              ord: sinon.match.number,
              customVariables: 'u1=user123;u2=testVal'
            });
            done();
          }
        });
      });
    });

    describe('#Completed Transaction', () => {
      it('should track sale', (done) => {
        window.digitalData.events.push({
          name: 'Completed Transaction',
          transaction: {
            orderId: 'order123',
            lineItems: [
              {
                product: {
                  id: '123'
                },
                quantity: 1
              },
              {
                product: {
                  id: '234'
                },
                quantity: 2
              },
            ],
            total: 10000
          },
          testParam: 'testVal',
          callback: () => {
            doubleClick.load.calledWith({
              src: 123123,
              type: 'customGroup',
              cat: 'customActivity',
              ord: 'order123',
              qty: 3,
              cost: 10000,
              customVariables: 'u1=user123;u2=testVal'
            });
            done();
          }
        });
      });
    });

  });
});
