/**
 * Return the `fn` wrapped in logic that will only let it be called after
 * it has been invoked a certain number of `times`.
 *
 * @param {Number} times
 * @param {Function} fn
 */

export default function(times, fn) {
  let timeLeft = times;
  return () => {
    if (--timeLeft < 1) {
      return fn.apply(this, arguments);
    }
  };
}
