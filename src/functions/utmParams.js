import { parse } from './queryString.js';
import each from './each.js';

export default function utmParams(query) {
  // Remove leading ? if present
  if (query.charAt(0) === '?') {
    query = query.substring(1);
  }

  query = query.replace(/\?/g, '&');

  const params = parse(query);
  const results = {};

  each(params, (key, param) => {
    if (key.substr(0, 4) === 'utm_') {
      param = key.substr(4);
      if (param === 'campaign') param = 'name';
      results[param] = params[key];
    }
  });

  return results;
}
