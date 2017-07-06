export default function getDataLayerProp(prop) {
  if (!window.dataLayer || !window.dataLayer.push) return undefined;
  let value;
  window.dataLayer.push(function dataLayerHandler() {
    value = this.get(prop);
  });
  return value;
}
