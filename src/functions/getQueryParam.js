import htmlGlobals from './htmlGlobals';

export default function getQueryParam(name, queryString) {
  if (!queryString) {
    queryString = htmlGlobals.getLocation().search;
  }
  name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
  const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  const results = regex.exec(queryString);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}
