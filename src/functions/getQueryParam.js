import htmlGlobals from './htmlGlobals';
import normalizeString from './normalizeString';

export default function getQueryParam(name, queryString) {
  if (!queryString) {
    queryString = htmlGlobals.getLocation().search;
  }
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp(`[\\?&]${name}=([^&#]*)`);
  const results = regex.exec(queryString);
  return results === null ? '' : normalizeString(decodeURIComponent(results[1].replace(/\+/g, ' ')));
}
