import each from 'driveback-utils/each';
import { getProp } from 'driveback-utils/dotProp';

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH = DAY * 30;

export function objectToTime(obj) {
  let time = 0;

  if (typeof obj === 'string') {
    switch (obj) {
      case '1week': obj = { weeks: 1 }; break;
      case '1month': obj = { months: 1 }; break;
      case '1year': obj = { days: 365 }; break;
      default: obj = { days: 1 };
    }
  }

  each(obj, (key, val) => {
    switch (key) {
      case 'minutes': time += MINUTE * parseInt(val, 10); break;
      case 'hours': time += HOUR * parseInt(val, 10); break;
      case 'days': time += DAY * parseInt(val, 10); break;
      case 'weeks': time += DAY * 7 * parseInt(val, 10); break;
      case 'months': time += MONTH * parseInt(val, 10); break;
      default:
    }
  });
  return time;
}

export function cleanData(paramStorage, currentTime = Date.now()) {
  const { data, ttl, granularity } = paramStorage;
  if (!data) return {};
  const maxTtl = (currentTime / 1000) - ttl;
  return {
    ttl,
    granularity,
    data: Object.keys(data)
      .filter(timestamp => (maxTtl < timestamp))
      .reduce((result, timestamp) => {
        result[timestamp] = data[timestamp];
        return result;
      }, {}),
  };
}

/**
 * Generated object structure
 * {
 *   ttl: <ttl>,
 *   granularity: <granularity>,
 *   data: {
 *     <granularityTimestamp>: <eventsCount>,
 *     <granularityTimestamp>: <eventsCount>,
 *     ...
 *   }
 * }
 */
export function counterInc(paramName, granularityObj, ttlObj, digitalData) {
  const granularity = objectToTime(granularityObj);
  const ttl = objectToTime(ttlObj);
  const paramStorage = cleanData(getProp(digitalData, paramName) || {});
  const currentTime = (Date.now() / 1000);
  const granularityTimestamp = currentTime - (currentTime % granularity);
  const data = paramStorage.data || {};
  data[granularityTimestamp] = (data[granularityTimestamp] || 0) + 1;

  return { ttl, granularity, data };
}

export function counter(paramName, digitalData) {
  const rawParamStorage = getProp(digitalData, paramName);
  if (!rawParamStorage) return 0;
  const paramStorage = cleanData(rawParamStorage);
  const data = paramStorage.data || {};

  return Object.keys(data).reduce((acc, timestamp) => (acc + data[timestamp]), 0);
}
