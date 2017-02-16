import cookie from 'js-cookie';
import { getProp } from './functions/dotProp';
import topDomain from './functions/topDomain.js';

class CookieStorage
{
  constructor(options = {}) {
    this.options = Object.assign({
      cookieDomain: topDomain(location.href),
      cookieMaxAge: 31536000000, // default to a year
      prefix: 'dd_',
    }, options);

    // http://curl.haxx.se/rfc/cookie_spec.html
    // https://publicsuffix.org/list/effective_tld_names.dat
    //
    // try setting a dummy cookie with the options
    // if the cookie isn't set, it probably means
    // that the domain is on the public suffix list
    // like myapp.herokuapp.com or localhost / ip.
    if (this.getOption('cookieDomain')) {
      cookie.set('__tld__', true, {
        domain: this.getOption('cookieDomain'),
      });
      if (!this.get('__tld__')) {
        this.setOption('cookieDomain', null);
      }
      cookie.remove('__tld__');
    }
  }

  set(key, val, exp) {
    key = this.getOption('prefix') + key;
    exp = exp || this.getOption('cookieMaxAge');
    const expDays = exp / 86400;
    return cookie.set(key, val, {
      expires: expDays,
      domain: this.getOption('cookieDomain'),
    });
  }

  get(key) {
    key = this.getOption('prefix') + key;
    return cookie.getJSON(key);
  }

  remove(key) {
    key = this.getOption('prefix') + key;
    return cookie.remove(key);
  }

  getOption(name) {
    return this.options[name];
  }

  clear() {
    var cookies = document.cookie.split(';');
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf('=');
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }
}

export default CookieStorage;
