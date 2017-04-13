function _keyToArray(key) {
  key = key.trim();
  if (key === '') {
    return [];
  }
  key = key.replace(/\[(\w+)\]/g, '.$1');
  key = key.replace(/^\./, '');
  return key.split('.');
}

export function getProp(obj, prop) {
  const keyParts = _keyToArray(prop);
  let nestedVar = obj;
  while (keyParts.length > 0) {
    const childKey = keyParts.shift();
    if (nestedVar.hasOwnProperty(childKey) && nestedVar[childKey] !== undefined) {
      nestedVar = nestedVar[childKey];
    } else {
      return undefined;
    }
  }
  return nestedVar;
}

export function setProp(obj, prop, value) {
  if (typeof obj !== 'object' || typeof prop !== 'string') {
    return;
  }
  const keyParts = _keyToArray(prop);
  for (let i = 0; i < keyParts.length; i++) {
    const p = keyParts[i];
    if (typeof obj[p] !== 'object') {
      obj[p] = {};
    }
    if (i === keyParts.length - 1) {
      obj[p] = value;
    }
    obj = obj[p];
  }
}

export default { getProp, setProp };
