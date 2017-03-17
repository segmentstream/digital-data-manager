import noop from './functions/noop';

window.console.log = window.console.log || noop;
window.console.warn = window.console.warn || window.console.log || noop;
const browserSupportsGroups = !!window.console.group;

function log(message) {
  window.console.log(message);
}

function warn(message) {
  window.console.warn(message);
}

function group(message) {
  if (browserSupportsGroups) {
    window.console.group(message);
  } else {
    log(message);
  }
}

function groupEnd() {
  if (browserSupportsGroups) window.console.groupEnd();
}

export function isTestMode() {
  return window.localStorage.getItem('_ddm_test_mode') === '1';
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

export function logEnrichedIntegrationEvent(event, integrationName) {
  group(`${event.name} -> ${integrationName}`);
  log(event);
  groupEnd();
}

export function logValidationError(event, errors, integrationName) {
  group(`${event.name} -> ${integrationName}`);
  for (const error of errors) {
    const {field, message} = error;
    warn(`Field '${field}' ${message}`);
  }
  groupEnd();
}

export default { isTestMode, showTestModeOverlay };
