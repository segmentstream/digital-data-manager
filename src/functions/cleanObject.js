import deleteProperty from './deleteProperty';
import each from './each';

export default function cleanObject(object) {
  each(object, (key) => {
    const value = object[key];
    if (value === undefined || value === null || value === '') {
      deleteProperty(object, key);
    } else if (
      typeof value === 'object'
      && !(value instanceof Date)
      && (!Array.isArray(value) || Object.keys(value).length > 0)
    ) {
      cleanObject(object[key]);
    }
  });

  return object;
}
