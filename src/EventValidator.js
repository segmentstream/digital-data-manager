import { getProp } from './functions/dotProp';

const MSG_IS_REQUIRED = 'is required';
const MSG_NOT_STRING = 'should be a string';
const MSG_NOT_NUMERIC = 'should be numeric';
const MSG_NOT_ARRAY = 'should be an array';
const MSG_NOT_BOOLEAN = 'shoule be boolean';

const RULE_REQUIRED = 'required';
const RULE_STRING = 'string';
const RULE_NUMERIC = 'numeric';
const RULE_ARRAY = 'array';
const RULE_BOOLEAN = 'boolean';

export const TYPE_ERROR = 'ERR';
export const TYPE_WARNING = 'WARN';
export const TYPE_SUCCESS = 'OK';

const empty = (value) => {
  return (value === undefined || value === null || value === '');
};

const required = (value) => {
  if (empty(value)) {
    return MSG_IS_REQUIRED;
  }
  return true;
};

const string = (value) => {
  if (empty(value)) return null;
  if (typeof value !== 'string') {
    return MSG_NOT_STRING;
  }
  return true;
};

const numeric = (value) => {
  if (empty(value)) return null;
  if (typeof value !== 'number') {
    return MSG_NOT_NUMERIC;
  }
  return true;
};

const array = (value) => {
  if (empty(value)) return null;
  if (!Array.isArray(value)) {
    return MSG_NOT_ARRAY;
  }
  return true;
};

const boolean = (value) => {
  if (empty(value)) return null;
  if (typeof value !== 'boolean') {
    return MSG_NOT_BOOLEAN;
  }
  return true;
};

const ruleHandlers = {
  [RULE_REQUIRED]: required,
  [RULE_STRING]: string,
  [RULE_NUMERIC]: numeric,
  [RULE_ARRAY]: array,
  [RULE_BOOLEAN]: boolean,
};

const validateField = (field, value, validations = {}) => {
  const errors = validations.errors || [];
  const warnings = validations.warnings || [];

  // validate errors
  for (const ruleName of errors) {
    const errorMsg = ruleHandlers[ruleName](value);
    if (!empty(errorMsg)) {
      if (errorMsg !== true) {
        return [false, [field, errorMsg, value, TYPE_ERROR]];
      }
    }
  }

  // validate warnings
  for (const ruleName of warnings) {
    const errorMsg = ruleHandlers[ruleName](value);
    if (!empty(errorMsg)) {
      if (errorMsg !== true) {
        return [true, [field, errorMsg, value, TYPE_WARNING]];
      }
    }
  }

  if (!empty(value)) {
    return [true, [field, true, value, TYPE_SUCCESS]];
  }

  return [true];
};

const validateArrayField = (arrayField, arrayFieldValues, subfield, validations) => {
  const messages = [];
  let result = true;

  if (!Array.isArray(arrayFieldValues)) {
    const fieldName = [arrayField, subfield].join('[].');
    let message;
    [result, message] = validateField(fieldName, undefined, validations);
    if (message) {
      messages.push(message);
    }
  } else {
    let i = 0;
    for (const arrayFieldValue of arrayFieldValues) {
      const value = getProp(arrayFieldValue, subfield);
      const fieldName = [arrayField, i, subfield].join('.');
      const [fieldResult, message] = validateField(fieldName, value, validations);
      if (!fieldResult) result = false;
      if (message) {
        messages.push(message);
      }
      i += 1;
    }
  }

  return [result, messages];
};

export const validateEvent = (event, validationConfig) => {
  const fields = validationConfig.fields || [];
  let allMessages = [];
  let finalResult = true;

  for (const field of fields) {
    const validations = validationConfig.validations || {};
    const fieldValidations = validations[field];
    let result;
    if (field.indexOf('[]') > 0) {
      let messages;
      const [ arrayField, subfield ] = field.split('[].');
      const value = getProp(event, arrayField);
      [result, messages] = validateArrayField(arrayField, value, subfield, fieldValidations);
      allMessages = allMessages.concat(messages);
    } else {
      let message;
      const value = getProp(event, field);
      [result, message] = validateField(field, value, fieldValidations);
      if (message) allMessages.push(message);
    }
    if (!result) finalResult = false;
  }

  // console.log(finalResult, allMessages);

  return [finalResult, allMessages];
};

export function validateIntegrationEvent(event, integration) {
  const validationConfig = integration.getEventValidationConfig(event);
  if (validationConfig) {
    return validateEvent(event, validationConfig);
  }
  return [true];
}

export function trackValidationErrors(digitalData, event, integrationName, messages = []) {
  for (const message of messages) {
    const [field, errorMsg, , resultType] = message;
    if (resultType === TYPE_ERROR) {
      digitalData.events.push({
        name: 'Integration Validation Failed',
        category: 'DDM Validations',
        label: `${event.name} (${integrationName})`,
        action: `Field '${field}' ${errorMsg}`,
        nonInteraction: true,
      });
    }
  }
}
