import assert from 'assert';
import reset from './reset.js';
import EventManager from './../src/EventManager.js';
import nextTick from 'next-tick';

describe('EventManager', () => {

  let _eventManager;

  afterEach(() => {
    _eventManager.reset();
    _eventManager = undefined;
    reset();
  });

  describe('digitalData changed', () => {

    beforeEach(() => {
      window.digitalData = {};
      window.ddListener = [];
      _eventManager = new EventManager(window.digitalData, window.ddListener);
      _eventManager.initialize();
    });

    it('should fire change callback', (done) => {
      window.ddListener.push(['on', 'change', () => {
        done();
      }]);
      window.digitalData.test = 'test';
    });
  });


  describe('digitalData not changed', () => {

    beforeEach(() => {
      window.digitalData = {
        test: 'test'
      };
      window.ddListener = [];
      _eventManager = new EventManager(window.digitalData, window.ddListener);
      _eventManager.initialize();
    });

    it('should not fire change callback', (done) => {
      window.ddListener.push(['on', 'change', () => {
        assert.ok(false);
        done();
      }]);
      setTimeout(() => {
        assert.ok(true);
        done();
      }, 101); //check interval is 100, so 101 will work

      window.digitalData.test = 'test';
    });
  });


});