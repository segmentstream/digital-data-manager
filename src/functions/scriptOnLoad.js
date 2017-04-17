/**
 * Add event listener to `el`, `fn()`.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function addEventListener(el, fn) {
  console.warn('addEventListener');
  el.addEventListener('load', (_, e) => {
    console.warn('load - addEventListener');
    fn(null, e);
  }, false);
  el.addEventListener('error', (e) => {
    const err = new Error('script error "' + el.src + '"');
    err.event = e;
    fn(err);
  }, false);
}

/**
 * Attach event.
 *
 * @param {Element} el
 * @param {Function} fn
 * @api private
 */

function attachEvent(el, fn) {
  console.warn('attachEvent');
  el.attachEvent('onreadystatechange', (e) => {
    console.warn('load - attachEvent');
    if (!/complete|loaded/.test(el.readyState)) return;
    // IE8 FIX
    if (el.readyState === 'loaded') {
      setTimeout(() => {
        fn(null, e);
      }, 500);
    } else {
      fn(null, e);
    }
  });
  el.attachEvent('onerror', (e) => {
    const err = new Error('failed to load the script "' + el.src + '"');
    err.event = e || window.event;
    fn(err);
  });
}

export default function(el, fn) {
  return el.addEventListener
      ? addEventListener(el, fn)
      : attachEvent(el, fn);
}
