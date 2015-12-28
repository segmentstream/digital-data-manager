import debug from 'debug';

export default function throwError(code, message) {
  if (arguments.length === 1) {
    message = code;
    code = 'error';
  }
  const error = {
    code: code,
    message: message,
  };
  debug(message);
  throw error;
}
