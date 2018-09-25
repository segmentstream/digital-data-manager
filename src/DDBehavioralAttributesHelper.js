import each from 'driveback-utils/each';
import { error as errorLog } from 'driveback-utils/safeConsole';
import { getProp } from 'driveback-utils/dotProp';

const MINUTE = 60000;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const MONTH = DAY * 30;

export function objectToTime(obj) {
  let time = 0;

  if (typeof obj === 'string') {
    switch (obj) {
      case '1week': obj = { weeks: 1 }; break;
      case '1month': obj = { monthes: 1 }; break;
      default: obj = { days: 1 };
    }
  }

  each(obj, (key, val) => {
    switch (key) {
      case 'minutes': time += MINUTE * parseInt(val, 10); break;
      case 'hours': time += HOUR * parseInt(val, 10); break;
      case 'days': time += DAY * parseInt(val, 10); break;
      case 'weeks': time += DAY * 7 * parseInt(val, 10); break;
      case 'monthes': time += MONTH * parseInt(val, 10); break;
      default:
    }
  });
  return time;
}

export function cleanOrderedTimestamps(data, maxTtl) {
  while (data.length) {
    const [timestamp, count] = data.pop();
    if (maxTtl < timestamp) {
      data.push([timestamp, count]);
      break;
    }
  }
}

export function getParamStorage(paramName, digitalData) {
  const paramStorage = getProp(digitalData, paramName) || {};
  if (paramStorage.ttl === undefined || paramStorage.data === undefined) {
    errorLog(`param ${paramName} not initialized`);
    return false;
  }
  return paramStorage;
}

export function saveAccessTime(paramStorage, currentTime) {
  paramStorage.lastEventTime = currentTime;
  paramStorage.firstEventTime = paramStorage.firstEventTime || currentTime;
}

export function saveIncrementValue(paramStorage, currentTime) {
  const granularityTimestamp = currentTime - (currentTime % paramStorage.granularity);
  const timestamp = (paramStorage.data[0] || [])[0];
  if (timestamp === granularityTimestamp) {
    paramStorage.data[0][1] += 1;
  } else {
    paramStorage.data.unshift([granularityTimestamp, 1]);
  }
}

export function counterInc(paramName, granularityObj, ttlObj, digitalData) {
  const granularity = objectToTime(granularityObj);
  const ttl = objectToTime(ttlObj);

  const currentTime = new Date().getTime();
  const paramStorage = getParamStorage(paramName, digitalData) || {};

  if (paramStorage.ttl === undefined) paramStorage.ttl = ttl;
  if (paramStorage.data === undefined) paramStorage.data = [];


  paramStorage.granularity = granularity;

  saveAccessTime(paramStorage, currentTime);
  saveIncrementValue(paramStorage, currentTime);

  cleanOrderedTimestamps(paramStorage.data, currentTime - paramStorage.ttl);
  return paramStorage;
}

export function counter(paramName, digitalData) {
  const paramStorage = getParamStorage(paramName, digitalData);
  if (!paramStorage) return -1;

  const currentTime = new Date().getTime();

  cleanOrderedTimestamps(paramStorage.data, currentTime - paramStorage.ttl);
  return paramStorage.data.reduce((acc, [__, count]) => (acc + count), 0);
}
