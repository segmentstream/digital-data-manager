export default function clone(obj, preserveFunctions = false) {
  if (!obj) {
    return obj;
  }

  if (!preserveFunctions && JSON.parse && JSON.stringify) {
    return JSON.parse(JSON.stringify(obj));
  }

  switch (typeof obj) {
  case 'object':
    if (!obj.length) {
      if (obj instanceof Date) {
        return new Date(obj.getTime());
      }
      // plain object
      const copy = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          copy[key] = clone(obj[key], preserveFunctions);
        }
      }
      return copy;
    }
    // array
    const copy = new Array(obj.length);
    for (let i = 0, l = obj.length; i < l; i += 1) {
      copy[i] = clone(obj[i], preserveFunctions);
    }
    return copy;

  default: // string, number, boolean, …
    return obj;
  }
}
