import assert from 'assert';
import reset from './../reset.js';
import sinon from 'sinon';
import Driveback from './../../src/integrations/Driveback.js';
import ddManager from './../../src/ddManager.js';

function emulateDrivebackLoad(driveback) {
  sinon.stub(driveback, 'load', () => {
    window.DrivebackOnLoad = {
      push: function(fn) {
        fn();
      }
    };
    window.Driveback = {};
    window.DriveBack = {};
    window.Driveback.Loader = {};
    window.dbex = () => {};
    driveback.onLoad();
  });
}

describe('Integrations: Driveback', () => {
  let driveback;
  window.digitalData = {
    events: []
  };
  const options = {
    websiteToken: 'aba543e1-1413-5f77-a8c7-aaf6979208a3',
  };

  beforeEach(() => {
    driveback = new Driveback(window.digitalData, options);
    ddManager.addIntegration('Driveback', driveback);
  });

  afterEach(() => {
    driveback.reset();
    ddManager.reset();
    reset();
  });

  describe('#constructor', () => {

    it('should create Driveback integrations with proper options and tags', () => {
      assert.equal(options.websiteToken, driveback.getOption('websiteToken'));
      assert.equal('script', driveback.getTag().type);
      assert.ok(driveback.getTag().attr.src.indexOf('driveback.ru') > 0);
    });

  });

  describe('#load', () => {

    it('should load', (done) => {
      assert.ok(!driveback.isLoaded());
      emulateDrivebackLoad(driveback);
      ddManager.once('load', () => {
        assert.ok(driveback.isLoaded());
        done();
      });
      ddManager.initialize();
    });

  });

  describe('after loading', () => {
    beforeEach((done) => {
      emulateDrivebackLoad(driveback);
      ddManager.once('load', done);
      ddManager.initialize();
    });

    it('should initialize all global variables', () => {
      assert.ok(window.DrivebackNamespace);
      assert.ok(window.DriveBack);
      assert.ok(window.Driveback);
      assert.ok(DrivebackOnLoad.push);
    });
  });

  describe('after loading with experiments', () => {
    beforeEach((done) => {
      driveback.setOption('experiments', true);
      driveback.setOption('experimentsToken', '123123');
      emulateDrivebackLoad(driveback);
      ddManager.once('load', () => {
        done();
      });
      ddManager.initialize();
    });

    it('should add dbex snippet', () => {
      DrivebackOnLoad.push(() => {
        assert.ok(window.dbex);
      });
    });

    it('should track experiment session', (done) => {
      sinon.stub(window, 'dbex');
      window.digitalData.events.push({
        name: 'Viewed Experiment',
        experiment: '123',
        callback: () => {
          assert.ok(window.dbex.calledWith('trackSession', '123'));
          window.dbex.restore();
          done();
        }
      });
    });

    it('should track experiment session', (done) => {
      sinon.stub(window, 'dbex');
      window.digitalData.events.push({
        name: 'Achieved Experiment Goal',
        experiment: '123',
        callback: () => {
          assert.ok(window.dbex.calledWith('trackConversion', '123'));
          window.dbex.restore();
          done();
        }
      });
    });
  });

});
