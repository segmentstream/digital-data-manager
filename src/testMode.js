import { log, info, warn, group, groupEnd } from './functions/safeConsole';

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

export function logValidationResult(event, validationResult, integrationName) {
  const { errors, warnings } = validationResult;
  for (const error of errors) {
    const [field, message] = error;
    warn(`Field '${field}' ${message}`);
  }
  for (const warning of warnings) {
    const [field, message] = warning;
    info(`Field '${field}' ${message}`);
  }
}

export function logEnrichedIntegrationEvent(event, integrationName, validationResult) {
  group(`${event.name} -> ${integrationName}`);
  log(event);
  if (validationResult) {
    logValidationResult(event, validationResult, integrationName);
  }
  groupEnd();
}

export default { isTestMode, showTestModeOverlay };
