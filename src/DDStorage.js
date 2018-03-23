import { getProp } from 'driveback-utils/dotProp';
import arrayMerge from 'driveback-utils/arrayMerge';

const keyPersistedKeys = '_persistedKeys';
const keyLastEventTimestamp = '_lastEventTimestamp';
const keyAnonymousId = 'user.anonymousId';

class DDStorage {
  constructor(digitalData, storage, cookieStorage) {
    this.digitalData = digitalData;
    this.storage = storage;
    if (cookieStorage) {
      this.ddCookieStorage = new DDStorage(digitalData, cookieStorage);
    }
  }

  persist(key, exp) {
    const value = getProp(this.digitalData, key);
    if (value !== undefined) {
      const persistedKeys = this.getPersistedKeys();
      if (persistedKeys.indexOf(key) < 0) {
        persistedKeys.push(key);
        this.updatePersistedKeys(persistedKeys);
      }
      this.storage.set(key, value, exp);

      if (this.ddCookieStorage) {
        if (key === keyAnonymousId) { // keep in both storages
          this.ddCookieStorage.persist(key, exp);
        } else {
          this.ddCookieStorage.unpersist(key); // remove from old storage
        }
      }
    }
  }

  getPersistedKeys() {
    const persistedKeys = this.storage.get(keyPersistedKeys) || [];
    // get persisted keys from oldStorage
    if (this.ddCookieStorage) {
      arrayMerge(persistedKeys, this.ddCookieStorage.getPersistedKeys());
    }
    return persistedKeys;
  }

  removePersistedKey(key) {
    const persistedKeys = this.getPersistedKeys();
    const index = persistedKeys.indexOf(key);
    if (index > -1) {
      persistedKeys.splice(index, 1);
    }
    this.updatePersistedKeys(persistedKeys);
  }

  getLastEventTimestamp() {
    return this.storage.get(keyLastEventTimestamp);
  }

  removeLastEventTimestamp() {
    this.storage.remove(keyLastEventTimestamp);
  }

  setLastEventTimestamp(timestamp) {
    if (this.ddCookieStorage) {
      this.ddCookieStorage.removeLastEventTimestamp();
    }
    return this.storage.set(keyLastEventTimestamp, timestamp);
  }

  updatePersistedKeys(persistedKeys) {
    this.storage.set(keyPersistedKeys, persistedKeys);
  }

  get(key) {
    let value = this.storage.get(key);

    // check old cookie storage for possible value
    if (value === undefined && this.ddCookieStorage) {
      value = this.ddCookieStorage.get(key);
    }
    if (value === undefined) {
      this.removePersistedKey(key);
    }
    return value;
  }

  unpersist(key) {
    // unpersist from old cookie storage if possible
    if (this.ddCookieStorage) {
      this.ddCookieStorage.unpersist(key);
    }
    this.removePersistedKey(key);
    return this.storage.remove(key);
  }

  clear() {
    if (this.ddCookieStorage) {
      this.ddCookieStorage.clear();
    }
    const persistedKeys = this.getPersistedKeys();
    persistedKeys.forEach((key) => {
      this.storage.remove(key);
    });
    this.storage.remove(keyPersistedKeys);
    this.storage.remove(keyLastEventTimestamp);
  }
}

export default DDStorage;
