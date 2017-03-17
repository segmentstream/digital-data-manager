import { getProp } from './functions/dotProp';
import each from './functions/each';

export const ERROR_TYPE_NOTICE = 'notice';

const MSG_IS_REQUIRED = 'is required';

const RULE_REQUIRED = 'required';

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

const validateField = (field, value, rules, errorType) => {
  const errors = [];
  const warnings = [];

  each (rules, (ruleName, ruleParam) => {
    const result = ruleHandlers[ruleName](value, ruleParam);
    if (result !== true) {
      if (errorType === ERROR_TYPE_NOTICE) {
        warnings.push([field, result]);
      } else {
        errors.push([field, result]);
      }
    }
  });

  return { errors, warnings };
};

const validateArrayField = (arrayField, arrayFieldValues, subfield, rules, errorType) => {
  const errors = [];
  const warnings = [];

  each(rules, (ruleName, ruleParam) => {
    let result;
    if (!Array.isArray(arrayFieldValues)) {
      result = ruleHandlers[ruleName](undefined, ruleParam);
      const filedName = [arrayField, subfield].join('[]');
      if (errorType === ERROR_TYPE_NOTICE) {
        warnings.push([filedName, result]);
      } else {
        errors.push([filedName, result]);
      }
    } else {
      let i = 1;
      for (const arrayFieldValue of arrayFieldValues) {
        const value = getProp(arrayFieldValue, subfield);
        result = ruleHandlers[ruleName](value, ruleParam);
        const fieldName = [arrayField, i, subfield].join('.');
        if (errorType === ERROR_TYPE_NOTICE) {
          warnings.push([fieldName, result]);
        } else {
          errors.push([fieldName, result]);
        }
        i += 1;
      }
    }
  });

  return { errors, warnings };
};

export const validateEvent = (event, validations) => {
  const errors = [];
  const warnings = [];

  for (const validation of validations) {
    const [ field, rules, errorType ] = validation;

    if (field.indexOf('[]') > 0) {
      const [ arrayField, subfield ] = field.split('[]');
      const value = getProp(event, arrayField);
      return validateArrayField(arrayField, value, subfield, rules, errorType);
    }

    const value = getProp(event, field);
    return validateField(field, value, rules, errorType);
  }

  return { errors, warnings };
};
