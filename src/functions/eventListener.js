const bindName = window.addEventListener ? 'addEventListener' : 'attachEvent';
const unbindName = window.removeEventListener ? 'removeEventListener' : 'detachEvent';
const prefix = bindName !== 'addEventListener' ? 'on' : '';

/**
 * Bind `el` event `type` to `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

export function bind(el, type, fn, capture) {
  el[bindName](prefix + type, fn, capture || false);
  return fn;
}

/**
 * Unbind `el` event `type`'s callback `fn`.
 *
 * @param {Element} el
 * @param {String} type
 * @param {Function} fn
 * @param {Boolean} capture
 * @return {Function}
 * @api public
 */

export function unbind(el, type, fn, capture) {
  el[unbindName](prefix + type, fn, capture || false);
  return fn;
}
