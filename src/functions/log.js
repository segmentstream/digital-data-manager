import noop from './noop';

const MESSAGE = 'message';
const WARNING = 'warning';
const ERROR = 'error';

function log(msg, type) {
  /* eslint-disable */
  console.log = console.log || noop;
  console.warn = console.warn || console.log;
  console.error = console.error || console.warn;
  if (!type) {
    console.log(msg);
  } else if (type === WARNING) {
    console.warn(msg);
  } else if (type === ERROR) {
    console.error(msg);
  }
  /* eslint-enable */
}

log.MESSAGE = MESSAGE;
log.WARNING = WARNING;
log.ERROR = ERROR;

export default log;
