import { getProp } from './functions/dotProp';
import each from './functions/each';

const MSG_IS_REQUIRED = 'is required';

const RULE_REQUIRED = 'required';

export const TYPE_ERROR = 'ERR';
export const TYPE_WARNING = 'WARN';
export const TYPE_SUCCESS = 'OK';

const required = (value, isRequired) => {
  if (isRequired) {
    if (value === undefined || value === null || value === '') {
      return MSG_IS_REQUIRED;
    }
  }
  return true;
};

const ruleHandlers = {
  [RULE_REQUIRED]: required,
};

const validateField = (field, value, rules, options = {}) => {
  const messages = [];
  let result = true;

  each(rules, (ruleName, ruleParam) => {
    const errorMsg = ruleHandlers[ruleName](value, ruleParam);
    let resultType = TYPE_SUCCESS;
    if (errorMsg !== true) {
      if (options.critical === false) {
        resultType = TYPE_WARNING;
      } else {
        resultType = TYPE_ERROR;
        result = false;
      }
    }
    messages.push([field, errorMsg, value, resultType]);
  });

  return [result, messages];
};

const validateArrayField = (arrayField, arrayFieldValues, subfield, rules, options = {}) => {
  const messages = [];
  let result = true;

  const pushResult = (fieldName, errorMsg, value) => {
    let resultType = TYPE_SUCCESS;
    if (errorMsg !== true) {
      if (options.critical === false) {
        resultType = TYPE_WARNING;
      } else {
        resultType = TYPE_ERROR;
        result = false;
      }
    }
    messages.push([fieldName, errorMsg, value, resultType]);
  };

  each(rules, (ruleName, ruleParam) => {
    if (!Array.isArray(arrayFieldValues)) {
      const errorMsg = ruleHandlers[ruleName](undefined, ruleParam);
      const fieldName = [arrayField, subfield].join('[].');
      pushResult(fieldName, errorMsg);
    } else {
      let i = 1;
      for (const arrayFieldValue of arrayFieldValues) {
        const value = getProp(arrayFieldValue, subfield);
        const errorMsg = ruleHandlers[ruleName](value, ruleParam);
        const fieldName = [arrayField, i, subfield].join('.');
        pushResult(fieldName, errorMsg, value);
        if (options.limit && i >= options.limit) break;
        i += 1;
      }
    }
  });

  return [result, messages];
};

export const validateEvent = (event, validations) => {
  const allMessages = [];
  let finalResult = true;

  for (const validation of validations) {
    const [ field, rules, options ] = validation;
    let result;
    let messages;

    if (field.indexOf('[]') > 0) {
      const [ arrayField, subfield ] = field.split('[].');
      const value = getProp(event, arrayField);
      [result, messages] = validateArrayField(arrayField, value, subfield, rules, options);
    } else {
      const value = getProp(event, field);
      [result, messages] = validateField(field, value, rules, options);
    }

    if (!result) finalResult = false;
    for (const message of messages) {
      allMessages.push(message);
    }
  }

  return [finalResult, allMessages];
};

export function validateIntegrationEvent(event, integration) {
  const validations = integration.getEventValidations(event);
  if (validations.length) {
    return validateEvent(event, validations);
  }
  return [true];
}

export function trackValidationErrors(digitalData, event, integrationName, messages) {
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
