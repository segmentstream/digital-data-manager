import store from 'store';
import cookie from 'js-cookie';
import debug from 'debug';
import topDomain from './functions/topDomain.js';

class Storage
{
  constructor(options) {
    this.options = Object.assign({
      cookieDomain: topDomain(location.href),
      cookieMaxAge: 31536000000, // default to a year
      prefix: 'ddl:',
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
        debug('fallback to domain=null');
        this.setOption('cookieDomain', null);
      }
      cookie.remove('__tld__');
    }
  }

  set(key, val, exp) {
    key = this.prefix + key;
    if (store.enabled) {
      store.set(key, {
        val: val,
        exp: exp,
        time: new Date().getTime(),
      });
    } else {
      exp = exp || this.getOption('cookieMaxAge');
      const expDays = exp / 86400;
      cookie.set(key, val, {
        expires: expDays,
        domain: this.getOption('cookieDomain'),
      });
    }
  }

  get(key) {
    key = this.prefix + key;
    if (store.enabled) {
      const info = store.get(key);
      if (!info) {
        return null;
      }
      if (new Date().getTime() - info.time > info.exp) {
        return null;
      }
      return info.val;
    }
    return cookie.get(key);
  }

  remove(key) {
    key = this.prefix + key;
    if (store.enabled) {
      return store.remove(key);
    }
    cookie.remove(key);
  }

  clear() {
    if (store.enabled) {
      return store.clear();
    }
  }

  isEnabled() {
    return store.enabled;
  }

  getOption(name) {
    return this.options[name];
  }
}

export default Storage;
