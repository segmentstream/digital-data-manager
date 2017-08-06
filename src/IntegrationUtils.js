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
    let value = getProp(source, variable.value);
    if (value !== undefined) {
      if (typeof value === 'boolean') value = value.toString();
      values[key] = value;
    }
  });
  return values;
}
