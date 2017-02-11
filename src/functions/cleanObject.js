import deleteProperty from './deleteProperty';

export default function cleanObject(object) {
  for (var key in object) {
    const value = object[key];
    if (value === undefined) {
      deleteProperty(object, key);
    }

    if (typeof value === 'object' && !(value instanceof Date)) {
      cleanObject(object[key]);

      if(value === null) {
        continue;
      }

      if(!Array.isArray(value) && !Object.keys(value).length) {
        deleteProperty(object, key);
      }
    }
  }

  return object;
}
