import { log, group, groupEnd } from 'driveback-utils/safeConsole';
import { TYPE_ERROR, TYPE_SUCCESS, TYPE_WARNING } from './EventValidator';

const validationMessagesColors = {
  [TYPE_ERROR]: 'red',
  [TYPE_WARNING]: '#ee9a00',
  [TYPE_SUCCESS]: 'green',
};

export function isTestMode() {
  return window.localStorage.getItem('_segmentstream_test_mode') === '1'
  || window.localStorage.getItem('_ddm_test_mode') === '1';
}

export function prepareValueForLog(value) {
  if (Array.isArray(value)) {
    if (value[0] && typeof value[0] === 'object') {
      return '[Array of Objects]';
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'object') {
    return '[Object]';
  }
  if (typeof value === 'string') {
    return `"${value}"`;
  }
  return value;
}

export function showTestModeMessage() {
  log('%c SegmentStream: Test Mode', 'color: blue; font-size: 18px');
}

export function logValidationResult(event, messages) {
  messages.forEach(([field, errorMsg, value, resultType]) => {
    if (resultType === TYPE_SUCCESS) {
      log(`%c[${resultType}] ${field}: ${prepareValueForLog(value)}`,
        `color: ${validationMessagesColors[resultType]};`);
    } else {
      log(`%c[${resultType}] ${field} ${errorMsg}: ${prepareValueForLog(value)}`,
        `color: ${validationMessagesColors[resultType]};`);
    }
  });
}

export function logEnrichedIntegrationEvent(
  event, integrationName, result, messages, isInitialized,
) {
  if (isInitialized && result) {
    group(`[EVENT] ${event.name} -> ${integrationName}`);
  } else if (!isInitialized) {
    group(`[EVENT] ${event.name} x> ${integrationName} (not initialized)`);
  } else {
    group(`[EVENT] ${event.name} x> ${integrationName} (not valid)`);
  }

  if (messages && messages.length) {
    logValidationResult(event, messages, integrationName);
  }

  groupEnd();
}

export default { isTestMode, showTestModeMessage };
