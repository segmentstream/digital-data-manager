/**
 * toString.
 */

const toString = window.JSON ? JSON.stringify : String;

/**
 * Formatters
 */

const formatters = {
  o: toString,
  s: String,
  d: parseInt,
};

/**
 * Format the given `str`.
 *
 * @param {String} str
 * @param {...} args
 * @return {String}
 * @api public
 */

export default function format(str) {
  const args = [].slice.call(arguments, 1);
  let j = 0;

  return str.replace(/%([a-z])/gi, (_, f) => (formatters[f]
    ? formatters[f](args[j++])
    : _ + f));
}
