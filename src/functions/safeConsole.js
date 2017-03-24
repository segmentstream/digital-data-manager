window.console.log = window.console.log || noop;
window.console.warn = window.console.warn || window.console.log;
window.console.error = window.console.error || window.console.warn;

const browserSupportsGroups = !!window.console.group;

export function log(message) {
  window.console.log(message);
}

export function warn(message) {
  window.console.warn(message);
}

export function error(error) {
  console.log('Error:', error);
  window.console.error(error);
}

export function group(message) {
  if (browserSupportsGroups) {
    window.console.group(message);
  } else {
    log(message);
  }
}

export function groupEnd() {
  if (browserSupportsGroups) window.console.groupEnd();
}
