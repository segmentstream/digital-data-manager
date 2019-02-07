import loadScript from 'driveback-utils/loadScript';
import { log, group, groupEnd } from 'driveback-utils/safeConsole';
import { getProp } from 'driveback-utils/dotProp';
import { isTestMode } from '../testMode';
import AsyncQueue from '../integrations/utils/AsyncQueue';

const isAjvLoaded = () => !!window.Ajv;
const asyncQueue = new AsyncQueue(isAjvLoaded);

let ajvLoadInitiated = false;
let ajv;

const ajvValidate = (schema, obj, key) => {
  const validate = ajv.compile(schema);
  const data = (key) ? getProp(obj, key) : obj;
  const valid = validate(data);

  let prefix;
  if (data && data.name && data.timestamp) {
    prefix = `"${data.name}" event`;
  } else {
    prefix = `window.digitalData${key ? `.${key}` : ''}`;
  }

  if (!valid) {
    group(`${prefix} validation errors:`);
    validate.errors.forEach(error => log(['%c', error.dataPath, error.message].join(' '), 'color: red'));
    groupEnd();
  } else {
    log(`%c ${prefix} is valid!`, 'color: green');
  }
};

export const validate = (schema, obj, key) => {
  if (!isTestMode()) return;
  if (!schema) {
    log('%c Schema undefined', 'color: red');
    return;
  }
  if (!ajvLoadInitiated) {
    asyncQueue.init();
    loadScript({ src: 'https://cdnjs.cloudflare.com/ajax/libs/ajv/6.8.1/ajv.min.js' });
    ajvLoadInitiated = true;
  }
  asyncQueue.push(() => {
    if (!ajv) ajv = new window.Ajv({ allErrors: true });
    ajvValidate(schema, obj, key);
  });
};
