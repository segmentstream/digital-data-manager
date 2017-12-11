import each from 'driveback-utils/each';
import { getProp } from 'driveback-utils/dotProp';
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

export function extractVariableMappingValues(source, variableMapping) {
  const values = {};
  each(variableMapping, (key, variable) => {
    let value;
    if (typeof variable === 'object' && variable.type) {
      value = getProp(source, variable.value);
    } else {
      value = getProp(source, variable);
    }
    if (value !== undefined) {
      if (typeof value === 'boolean') value = value.toString();
      values[key] = value;
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
