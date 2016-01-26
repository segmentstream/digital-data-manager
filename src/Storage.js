import store from 'store';

class Storage
{
  constructor() {
    this.prefix = 'ddl:';
  }

  set(key, val, exp) {
    store.set(this.prefix + key, {
      val: val,
      exp: exp,
      time: new Date().getTime()
    });
  }

  get(key) {
    var info = store.get(this.prefix + key)
    if (!info) {
      return null;
    }
    if (new Date().getTime() - info.time > info.exp) {
      return null;
    }
    return info.val;
  }

  remove(key) {
    return store.remove(prefix + key);
  }

  clear() {
    return store.clear();
  }

  isEnabled() {
    return store.enabled;
  }
}

export default Storage;
