import { getProp } from './dotProp';

export default function getDataLayerProp(prop) {
  if (!window.dataLayer || !window.dataLayer.push) return undefined;
  for (let i = window.dataLayer.length; i >= 0; i -= 1) {
    if (typeof window.dataLayer[i] === 'object') {
      const value = getProp(window.dataLayer[i], prop);
      if (value !== undefined) {
        return value;
      }
    }
  }
  return undefined;
}
