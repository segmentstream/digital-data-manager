import trackLink from './../../src/trackers/trackLink';
import fireEvent from './../functions/fireEvent';
import assert from 'assert';

describe('trackLink', () => {

  describe('#button', () => {
    let btn;
    let div;

    beforeEach(() => {
      // create button
      btn = document.createElement('button');
      const t = document.createTextNode('click me');
      btn.appendChild(t);
      btn.className = 'test-btn';

      // create div
      div = document.createElement('div');
      div.appendChild(btn);
      div.id = 'test-div';

      document.body.appendChild(div);
    });

    afterEach(() => {
      document.body.removeChild(div);
    });

    it.only('should track click by class name', (done) => {
      trackLink('.test-btn', (link) => {
        assert.equal(typeof link, 'object');
        done();
      });

      fireEvent(btn, 'click');
    });

    it.only('should track click by nested class name', (done) => {
      trackLink('#test-div .test-btn', (link) => {
        assert.equal(typeof link, 'object');
        done();
      });

      fireEvent(btn, 'click');
    });
  })

});
