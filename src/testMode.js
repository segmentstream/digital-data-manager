import { log, group, groupEnd } from './functions/safeConsole';
import { TYPE_ERROR, TYPE_SUCCESS, TYPE_WARNING } from './EventValidator';

const validationMessagesColors = {
  [TYPE_ERROR]: 'red',
  [TYPE_WARNING]: '#ee9a00',
  [TYPE_SUCCESS]: 'green',
};

export function isTestMode() {
  return window.localStorage.getItem('_ddm_test_mode') === '1';
}

export function valueIsLogable(value) {
  return (value !== undefined && value !== null && !(Array.isArray(value) && typeof(value[0]) === 'object'));
}

export function prepareValueForLog(value) {
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    return '"' + value + '"';
  }
  return value;
}

export function showTestModeOverlay() {
  const css = [
    'position: fixed',
    'width: 100%',
    'bottom: 0',
    'font-size: 15px',
    "font-family: 'Helvetica Neue',Helvetica, Arial",
    'text-align: center',
    'background-color: #1392e0',
    'opacity: 0.5',
    'color: #FFF !important',
    'padding: 5px 0',
    'z-index: 2147483646',
    'line-height: 15px',
    '-webkit-transform: translate3d(0,0,0)',
  ];
  const overlayDiv = document.createElement('div');
  overlayDiv.innerHTML = '<a style="color: #fff;" href="#" onclick="window.localStorage.removeItem(\'_ddm_test_mode\');location.reload();return false;">Выйти из превью</a>';

  overlayDiv.style.cssText = css.join(';');
  document.body.appendChild(overlayDiv);
}

export function logValidationResult(event, messages) {
  for (const [field, errorMsg, value, resultType] of messages) {
    if (resultType === TYPE_SUCCESS) {
      if (!valueIsLogable(value)) {
        log(`%c[${resultType}] ${field}`, `color: ${validationMessagesColors[resultType]};`);
      } else {
        log(`%c[${resultType}] ${field}: ${prepareValueForLog(value)}`, `color: ${validationMessagesColors[resultType]};`);
      }
    } else {
      if (!valueIsLogable(value)) {
        log(`%c[${resultType}] ${field} ${errorMsg}`, `color: ${validationMessagesColors[resultType]};`);
      } else {
        log(`%c[${resultType}] ${field} ${errorMsg}: ${prepareValueForLog(value)}`, `color: ${validationMessagesColors[resultType]};`);
      }
    }
  }
}

export function logEnrichedIntegrationEvent(event, integrationName, result, messages, isInitialized) {
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

export default { isTestMode, showTestModeOverlay };
