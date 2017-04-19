export default function getStyle(el, prop) {
  if (window.getComputedStyle) {
    return window.getComputedStyle(el)[prop];
  } else if (el.currentStyle) {
    return el.currentStyle[prop];
  }
  return undefined;
}
