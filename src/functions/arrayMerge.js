export function arrayMerge(destArray, sourceArray) {
  for (const value of sourceArray) {
    if (destArray.indexOf(value) < 0) {
      destArray.push(value);
    }
}
