import assert from 'assert';
import {
  objectToTime,
  cleanData,
  counterInc,
  counter,
} from '../src/RollingAttributesHelper';

function getData(currentTime) {
  const ct = parseInt(currentTime / 1000, 10);
  return {
    [ct - 10]: 9,
    [ct - 8]: 7,
    [ct - 5]: 2,
    [ct - 3]: 1,
  };
}

describe('RollingAttributesHelper', () => {
  describe('#cleanData', () => {
    it('should work with empty dict', () => {
      const paramStorage = {
        ttl: 2592000,
        data: {},
        granularity: 86400,
      };

      const { data } = cleanData(paramStorage);
      assert.deepEqual(data, {});
    });

    it('should not drop topical data', () => {
      const currentTime = Date.now();
      const paramStorage = {
        ttl: 2592000,
        data: getData(currentTime),
        granularity: 86400,
      };

      const { data } = cleanData(paramStorage, currentTime);
      assert.deepEqual(data, getData(currentTime));
    });

    it('should drop outdated data', () => {
      const currentTime = Date.now();
      const ttl = 2592000;
      const paramStorage = {
        ttl,
        data: getData(currentTime),
        granularity: 86400,
      };
      const currentTimeShort = parseInt(currentTime / 1000, 10);


      // clear half of data
      const { data: data1 } = cleanData(paramStorage, currentTime + (ttl - 8) * 1000);
      // clear all data
      const { data: data2 } = cleanData(paramStorage, currentTime + (ttl - 3) * 1000);

      assert.deepEqual(data1, { [currentTimeShort - 5]: 2, [currentTimeShort - 3]: 1 });
      assert.deepEqual(data2, {});
    });
  });

  describe('#objectToTime', () => {
    it('should work with string arguments', () => {
      assert.equal(objectToTime('1day'), 86400);
      assert.equal(objectToTime('1week'), 7 * 86400);
      assert.equal(objectToTime('1month'), 30 * 86400);
      assert.equal(objectToTime('1year'), 365 * 86400);
      assert.equal(objectToTime('whatever'), 86400);
    });

    it('should work with object arguments', () => {
      assert.equal(objectToTime({ days: 2 }), 2 * 86400);
      assert.equal(objectToTime({ weeks: 3 }), 21 * 86400);
      assert.equal(objectToTime({ months: 2 }), 60 * 86400);
      assert.equal(objectToTime({ hours: 5 }), 5 * 3600);
      assert.equal(objectToTime({ minutes: 17 }), 17 * 60);
    });
  });

  describe('#counterInc', () => {
    it('should increment counter on empty data', () => {
      let paramsStorage = counterInc('foo', '1day', '1month', {});
      paramsStorage = counterInc('foo', '1day', '1month', { foo: paramsStorage });

      const firstKey = Object.keys(paramsStorage.data)[0];

      assert.ok(firstKey);
      assert.equal(paramsStorage.data[firstKey], 2);
    });

    it('should increment counter on non empty data', () => {
      const previosEventsCount = 7;
      const timestamp = new Date().getTime() - 86400001;
      let paramsStorage = {
        foo: {
          ttl: 2592000,
          data: { [timestamp]: previosEventsCount },
        },
      };

      paramsStorage = counterInc('foo', '1day', '1month', paramsStorage);
      const otherTimestamp = Object.keys(paramsStorage.data).filter(k => k !== timestamp)[0];


      assert.equal(Object.keys(paramsStorage.data).length, 2);
      assert.equal(paramsStorage.data[timestamp], previosEventsCount);
      assert.equal(paramsStorage.data[otherTimestamp], 1);
    });
  });

  describe('#counter', () => {
    it('should return zero if counter not set', () => {
      assert.equal(counter('whatever', {}), 0);
    });

    it('should eval counter correct', () => {
      const previosEventsCount = 33;
      let paramsStorage = {
        foo: {
          ttl: 2592000,
          data: { [new Date().getTime() - 86401]: previosEventsCount },
          granularity: 86400,
        },
      };

      paramsStorage = counterInc('foo', '1day', '1month', paramsStorage);
      paramsStorage = counterInc('foo', '1day', '1month', { foo: paramsStorage });

      assert.equal(counter('foo', { foo: paramsStorage }), 35);
    });
  });
});
