import store from 'store';

class Storage
{
  constructor(options = {}) {
    this.options = Object.assign({
      prefix: 'ddl:',
    }, options);
  }

  set(key, val, exp) {
    key = this.getOption('prefix') + key;
    if (exp !== undefined) {
      store.set(key, {
        val: val,
        exp: exp,
        time: Date.now(),
      });
    } else {
      store.set(key, val);
    }
  }

  get(key) {
    key = this.getOption('prefix') + key;
    const info = store.get(key);
    if (info !== undefined) {
      if (info.val !== undefined && info.exp && info.time) {
        if (Date.now() - info.time > info.exp) {
          store.remove(key);
          return undefined;
        }
        return info.val;
      }
    }
    return info;
  }

  remove(key) {
    key = this.getOption('prefix') + key;
    return store.remove(key);
  }

  isEnabled() {
    return store.enabled;
  }

  getOption(name) {
    return this.options[name];
  }
}

export default Storage;
