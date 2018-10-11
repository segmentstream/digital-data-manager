import loadScript from 'driveback-utils/loadScript';
import { log, group, groupEnd } from 'driveback-utils/safeConsole';
import { isTestMode } from './../testMode';
import AsyncQueue from './../integrations/utils/AsyncQueue';

const isAjvLoaded = () => !!window.Ajv;
const asyncQueue = new AsyncQueue(isAjvLoaded);

let ajvLoadInitiated = false;
let ajv;

const ajvValidate = (data, schema) => {
  const validate = ajv.compile(schema);
  const valid = validate(window.digitalData);
  if (!valid) {
    if (data.name && data.timestamp) {
      group(`"${data.name}" event validation errors:`);
    } else {
      group('window.digitalData validation errors:');
    }
    validate.errors.map(error => log(['%c', error.dataPath, error.message].join(' '), 'color: red'));
    groupEnd();
  } else if (data.name && data.hasFired !== undefined) {
    log(`%c "${event.name}" event is valid!', 'color: green`);
  } else {
    log('%c window.digitalData is valid!', 'color: green');
  }
};

export const validate = (data, schema) => {
  if (!isTestMode()) return;
  if (!ajvLoadInitiated) {
    asyncQueue.init();
    loadScript({ src: 'https://cdnjs.cloudflare.com/ajax/libs/ajv/6.5.4/ajv.min.js' });
    ajvLoadInitiated = true;
  }
  asyncQueue.push(() => {
    if (!ajv) ajv = new window.Ajv();
    ajvValidate(data, schema);
  });
};
