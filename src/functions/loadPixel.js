/**
 * Create an error handler.
 *
 * @param {Fucntion} fn
 * @param {String} message
 * @param {Image} img
 * @return {Function}
 * @api private
 */

function error(fn, message, img) {
  return (e) => {
    e = e || window.event;
    const err = new Error(message);
    err.event = e;
    err.source = img;
    fn(err);
  };
}

export default function(options, fn) {
  fn = fn || function onPixelLoaded() {};
  const img = new Image();
  img.onerror = error(fn, 'failed to load pixel', img);
  img.onload = fn;
  img.src = options.src;
  img.width = 1;
  img.height = 1;
  return img;
}
