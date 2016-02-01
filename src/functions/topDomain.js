import {parse} from './url.js';
import cookie from 'js-cookie';

/**
 * Levels returns all levels of the given url.
 *
 * @param {String} url
 * @return {Array}
 * @api public
 */
function getLevels(url) {
  const host = parse(url).hostname;
  const parts = host.split('.');
  const last = parts[parts.length - 1];
  const levels = [];

  // Ip address.
  if (parts.length === 4 && parseInt(last, 10) === last) {
    return levels;
  }

  // Localhost.
  if (parts.length <= 1) {
    return levels;
  }

  // Create levels.
  for (let i = parts.length - 2; i >= 0; --i) {
    levels.push(parts.slice(i).join('.'));
  }

  return levels;
}

/**
 * Get the top domain.
 *
 * The function constructs the levels of domain
 * and attempts to set a global cookie on each one
 * when it succeeds it returns the top level domain.
 *
 * The method returns an empty string when the hostname
 * is an ip or `localhost`.
 *
 * Example levels:
 *
 *      domain.levels('http://www.google.co.uk');
 *      // => ["co.uk", "google.co.uk", "www.google.co.uk"]
 *
 * Example:
 *
 *      domain('http://localhost:3000/baz');
 *      // => ''
 *      domain('http://dev:3000/baz');
 *      // => ''
 *      domain('http://127.0.0.1:3000/baz');
 *      // => ''
 *      domain('http://example.com/baz');
 *      // => 'example.com'
 *
 * @param {String} url
 * @return {String}
 * @api public
 */

export default function topDomain(url) {
  const levels = getLevels(url);

  // Lookup the real top level one.
  for (let i = 0; i < levels.length; ++i) {
    const cname = '__tld__';
    const domain = levels[i];
    const opts = {
      domain: '.' + domain,
    };
    cookie.set(cname, 1, opts);
    if (cookie.get(cname)) {
      cookie.set(cname, null, opts);
      return domain;
    }
  }

  return '';
}
