export default function argumentsToArray (args) {
  if (args && args[1] === undefined) {
    return undefined
  }
  return Array.prototype.slice.call(args)
}
