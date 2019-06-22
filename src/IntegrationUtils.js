import each from '@segmentstream/utils/each';
import { getProp } from '@segmentstream/utils/dotProp';
import { DIGITALDATA_VAR } from './variableTypes';

export function getEnrichableVariableMappingProps(variableMapping) {
  const enrichableProps = [];
  each(variableMapping, (key, variable) => {
    if (variable.type === DIGITALDATA_VAR) {
      enrichableProps.push(variable.value);
    }
  });
  return enrichableProps;
}

/**
 * Possible options:
 * - booleanToString: true/false (default - false)
 * - multipleScopes: true/false (default - false)
 */
export function extractVariableMappingValues(source, variableMapping, options = {}) {
  const values = {};
  let srcObject = source;
  each(variableMapping, (key, variable) => {
    let value;
    const vartype = variable.type === DIGITALDATA_VAR ? 'event' : variable.type;
    if (options.multipleScopes) srcObject = source[vartype];

    if (srcObject) {
      if (typeof variable === 'object' && variable.type) {
        value = getProp(srcObject, variable.value);
      } else {
        value = getProp(srcObject, variable);
      }
      if (value !== undefined) {
        if (typeof value === 'boolean' && options.booleanToString) value = value.toString();
        values[key] = value;
      }
    }
  });
  return values;
}

export function getVariableMappingValue(source, key, variableMapping) {
  const variable = variableMapping[key];
  if (typeof variable === 'object' && variable.type) {
    return getProp(source, variable.value);
  }
  return getProp(source, variable);
}
