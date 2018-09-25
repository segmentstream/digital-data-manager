import assert from 'assert';
import reset from './reset';
import {
  objectToTime,
  cleanOrderedTimestamps,
  counterInc,
  counter,
} from '../src/DDBehavioralAttributesHelper';

describe('DDBehavioralAttributesHelper', () => {
  describe('#cleanOrderedTimestamps', () => {
    it('should work with empty array', () => {
      const data = [];
      cleanOrderedTimestamps(data, 123);
      assert.deepEqual(data, []);
    });

    it('should not drop topical data', () => {
      const data = [[11, 9], [5, 7], [4, 2], [3, 1]];
      cleanOrderedTimestamps(data, 1);
      assert.deepEqual(data, [[11, 9], [5, 7], [4, 2], [3, 1]]);
    });

    it('should drop outdated data', () => {
      const data1 = [[11, 9], [5, 7], [4, 2], [3, 1]];
      const data2 = [[11, 9], [5, 7], [4, 2], [3, 1]];
      cleanOrderedTimestamps(data1, 4);
      cleanOrderedTimestamps(data2, 12);
      assert.deepEqual(data1, [[11, 9], [5, 7]]);
      assert.deepEqual(data2, []);
    });
  });

  describe('#objectToTime', () => {
    it('should work with string arguments', () => {
      assert.equal(objectToTime('1day'), 86400000);
      assert.equal(objectToTime('1week'), 7 * 86400000);
      assert.equal(objectToTime('1month'), 30 * 86400000);
      assert.equal(objectToTime('whatever'), 86400000);
    });

    it('should work with object arguments', () => {
      assert.equal(objectToTime({ days: 2 }), 2 * 86400000);
      assert.equal(objectToTime({ weeks: 3 }), 21 * 86400000);
      assert.equal(objectToTime({ monthes: 2 }), 60 * 86400000);
      assert.equal(objectToTime({ hours: 5 }), 5 * 3600000);
      assert.equal(objectToTime({ minutes: 17 }), 17 * 60000);
    });
  });

  describe('#counterInc', () => {
    it('should increment counter on empty data', () => {
      let paramsStorage = counterInc('foo', '1day', '1month', {});
      paramsStorage = counterInc('foo', '1day', '1month', { foo: paramsStorage });

      assert.equal(paramsStorage.data.length, 1);
      assert.equal(paramsStorage.data[0][1], 2);
    });

    it('should increment counter on non empty data', () => {
      const previosEventsCount = 7;
      let paramsStorage = {
        foo: {
          ttl: 2592000000,
          data: [[new Date().getTime() - 86400001, previosEventsCount]],
        },
      };

      paramsStorage = counterInc('foo', '1day', '1month', paramsStorage);

      assert.equal(paramsStorage.data.length, 2);
      assert.equal(paramsStorage.data[0][1], 1);
      assert.equal(paramsStorage.data[1][1], previosEventsCount);
    });
  });

  describe('#counter', () => {
    it('should eval counter correct', () => {
      const previosEventsCount = 33;
      let paramsStorage = {
        foo: {
          ttl: 2592000000,
          data: [[new Date().getTime() - 86400001, previosEventsCount]],
        },
      };

      paramsStorage = counterInc('foo', '1day', '1month', paramsStorage);
      paramsStorage = counterInc('foo', '1day', '1month', { foo: paramsStorage });

      assert.equal(counter('foo', { foo: paramsStorage }), 35);
    });
  });
});
