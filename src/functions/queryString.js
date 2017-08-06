import each from './each.js';

const pattern = /(\w+)\[(\d+)\]/;

/**
 * Safely encode the given string
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

const encode = function encode(str) {
  try {
    return encodeURIComponent(str);
  } catch (e) {
    return str;
  }
};

/**
 * Safely decode the string
 *
 * @param {String} str
 * @return {String}
 * @api private
 */

const decode = function decode(str) {
  try {
    return decodeURIComponent(str.replace(/\+/g, ' '));
  } catch (e) {
    return str;
  }
};

/**
 * Parse the given query `str`.
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

export function parse(str) {
  if (typeof str !== 'string') return {};

  str = str.trim();
  if (str === '') return {};
  if (str.charAt(0) === '?') str = str.slice(1);

  const obj = {};
  const pairs = str.split('&');
  for (let i = 0; i < pairs.length; i++) {
    const parts = pairs[i].split('=');
    const key = decode(parts[0]);
    const m = pattern.exec(key);

    if (m) {
      obj[m[1]] = obj[m[1]] || [];
      obj[m[1]][m[2]] = decode(parts[1]);
      continue;
    }

    obj[parts[0]] = parts[1] === null
      ? ''
      : decode(parts[1]);
  }

  return obj;
}

/**
 * Stringify the given `obj`.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

export function stringify(obj) {
  if (!obj) return '';
  const pairs = [];

  each(obj, (key, value) => {
    if (typeof (value) === 'object' && value.length) {
      for (let i = 0; i < value.length; ++i) {
        pairs.push(`${encode(`${key}[${i}]`)}=${encode(value[i])}`);
      }
      return;
    }

    pairs.push(`${encode(key)}=${encode(obj[key])}`);
  });

  return pairs.join('&');
}
