import store from 'lockr';

class Storage {
  constructor(options = {}) {
    this.options = Object.assign({
      prefix: 'ddl:',
    }, options);
  }

  supportsSubDomains() {
    return false;
  }

  set(key, val, exp) {
    key = this.getOption('prefix') + key;
    if (exp !== undefined) {
      store.set(key, {
        val,
        exp: exp * 1000,
        time: Date.now(),
      });
    } else {
      store.set(key, val);
    }
  }

  get(key) {
    key = this.getOption('prefix') + key;

    if (!window.localStorage) { // SRP violation, but its ok for this case
      // TODO add logging;
      return undefined;
    }
    const info = store.get(key);

    if (info instanceof Object) {
      if (info.val !== undefined && info.exp && info.time) {
        if ((Date.now() - info.time) > info.exp) {
          store.rm(key);
          return undefined;
        }
        return info.val;
      }
    }
    return info;
  }

  getTtl(key) {
    key = this.getOption('prefix') + key;
    const info = store.get(key);
    if (info !== undefined) {
      if (info.val !== undefined && info.exp && info.time) {
        return info.exp - (Date.now() - info.time);
      }
    }
    return undefined;
  }

  remove(key) {
    key = this.getOption('prefix') + key;
    return store.rm(key);
  }

  isEnabled() {
    try {
      localStorage.setItem('ddm_localstorage_test', 1);
      localStorage.removeItem('ddm_localstorage_test');
    } catch (e) {
      return false;
    }
    return true;
  }

  getOption(name) {
    return this.options[name];
  }
}

export default Storage;
