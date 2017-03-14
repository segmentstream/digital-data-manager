import assert from 'assert';
import sinon from 'sinon';
import reset from './../reset.js';
import DoubleClickFloodlight from './../../src/integrations/DoubleClickFloodlight.js';
import ddManager from './../../src/ddManager.js';


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
    ddManager.addIntegration('DoubleClick Floodlight', criteo);
  });

  afterEach(() => {
    criteo.reset();
    ddManager.reset();
    reset();
  });

  describe('before loading', () => {
    beforeEach(function () {
      sinon.stub(criteo, 'load');
    });

    afterEach(function () {
      criteo.load.restore();
    });

    describe('#constructor', () => {
      it('should add proper tags and options', () => {
        assert.equal(options.account, criteo.getOption('account'));
        assert.equal(undefined, criteo.getOption('deduplication'));
        assert.equal('script', criteo.getTag().type);
        assert.equal(criteo.getTag().attr.src, '//static.criteo.net/js/ld/ld.js');
      });
    });

    describe('#initialize', () => {
      it('should initialize criteo queue object', () => {
        ddManager.initialize();
        assert.ok(window.criteo_q);
        assert.ok(window.criteo_q.push);
      });

      it('should call tags load after initialization', () => {
        ddManager.initialize();
        assert.ok(criteo.load.calledOnce);
      });
    });
  });


  describe('loading', function () {
    beforeEach(() => {
      sinon.stub(criteo, 'load', () => {
        window.criteo_q = {
          push: function() {}
        };
        criteo.onLoad();
      });
    });

    afterEach(() => {
      criteo.load.restore();
    });

    it('should load', function (done) {
      assert.ok(!criteo.isLoaded());
      ddManager.once('load', () => {
        assert.ok(criteo.isLoaded());
        done();
      });
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });
  });

  describe('after loading', () => {
    beforeEach((done) => {
      sinon.stub(criteo, 'load', () => {
        setTimeout(criteo.onLoad, 0);
      });
      ddManager.once('ready', () => {
        done();
      });
      ddManager.initialize({
        sendViewedPageEvent: false,
      });
    });

    afterEach(function () {
      criteo.load.restore();
    });

    describe('#Viewed Page', () => {

      it('should define account id', (done) => {
        viewedPage({}, () => {
          assert.deepEqual(window.criteo_q[0][0], { event: 'setAccount', account: options.account });
          done();
        });
      });

      it('should define "d" site type if other option is not specified', (done) => {
        viewedPage({}, () => {
          assert.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: "d" });
          done();
        });
      });

      it('should define "d" site type if website.type is not one of: "desktop", "tablet" or "mobile"', (done) => {
        viewedPage({
          website: {
            type: "test"
          }
        }, () => {
          assert.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: "d" });
          done();
        });
      });

      it('should define "d" site type if digitalData.website.type is "desktop"', (done) => {
        viewedPage({
          website: {
            type: "desktop"
          }
        }, () => {
          assert.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: "d" });
          done();
        });
      });

      it('should define "t" site type if digitalData.website.type is "tablet"', (done) => {
        viewedPage({
          website: {
            type: "tablet"
          }
        }, () => {
          assert.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: "t" });
          done();
        });
      });

      it('should define "m" site type if digitalData.website.type is "mobile"', (done) => {
        viewedPage({
          website: {
            type: "mobile"
          }
        }, () => {
          assert.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: "m" });
          done();
        });
      });

      it('should set email if digitalData.user.email is defined', (done) => {
        viewedPage({
          user: {
            email: 'test@driveback.ru'
          }
        }, () => {
          assert.deepEqual(window.criteo_q[0][2], { event: 'setEmail', email: 'test@driveback.ru' });
          done();
        });
      });

      it('should set email and website type from digitalData', (done) => {
        window.digitalData.website = {
          type: 'mobile'
        };
        window.digitalData.user = {
          email: 'test@driveback.ru'
        }
        viewedPage({}, () => {
          assert.deepEqual(window.criteo_q[0][1], { event: 'setSiteType', type: "m" });
          assert.deepEqual(window.criteo_q[0][2], { event: 'setEmail', email: 'test@driveback.ru' });
          done();
        });
      });
    });

  });
});
