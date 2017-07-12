export default function isPromise(result) {
  return (typeof result === 'object' && result.then && typeof result.then === 'function');
}
