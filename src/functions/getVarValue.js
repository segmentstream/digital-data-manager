import { getProp } from './dotProp';

export default function getVarValue(variable, source) {
  if (variable.type === 'constant') {
    return variable.value;
  }
  return getProp(source, variable.value);
}
