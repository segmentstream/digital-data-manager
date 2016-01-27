import store from 'store';
import cookie from 'js-cookie';

class Storage
{
  constructor(options) {
    this.options = Object.assign({
      prefix: 'ddl:',
      sessionLength: 3600
    }, options);
  }

  set(key, val, exp) {
    key = this.prefix + key;
    if (store.enabled) {
      store.set(key, {
        val: val,
        exp: exp,
        time: new Date().getTime()
      });
    } else {
      const expDays = exp / 86400;
      cookie.set(key, value, {
        expires: expDays
      });
    }
  }

  get(key) {
    key = this.prefix + key;
    if (store.enabled) {
      var info = store.get(key);
      if (!info) {
        return null;
      }
      if (new Date().getTime() - info.time > info.exp) {
        return null;
      }
      return info.val;
    } else {
      return cookie.get(key);
    }
  }

  remove(key) {
    key = this.prefix + key;
    if (store.enabled) {
      return store.remove(key);
    } else {
      cookie.remove(key);
    }
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
