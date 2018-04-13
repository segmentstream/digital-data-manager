import { getProp } from 'driveback-utils/dotProp';
import arrayMerge from 'driveback-utils/arrayMerge';

const keyPersistedKeys = '_persistedKeys';
const keyLastEventTimestamp = '_lastEventTimestamp';
const keyAnonymousId = 'user.anonymousId';

/**
 * DDStorage also implements migrations between cookieStorage and localStorage
 * cookie -> local is implemented using forwarding
 * local -> cookie is implemented using full transfer
 */
class DDStorage {
  constructor(digitalData, storage, reserveStorage) {
    this.digitalData = digitalData;
    this.storage = storage;
    if (reserveStorage) {
      this.ddReserveStorage = new DDStorage(digitalData, reserveStorage);
      if (!reserveStorage.supportsSubDomains()) { // only for localStorage
        this.transferFromReserveStorage();
      }
    }
  }

  transferFromReserveStorage() {
    if (this.ddReserveStorage.getLastEventTimestamp()) {
      // move lastEventTimestamp
      if (this.ddReserveStorage.getLastEventTimestamp() > this.getLastEventTimestamp()) {
        this.setLastEventTimestamp(this.ddReserveStorage.getLastEventTimestamp());
      } else {
        this.ddReserveStorage.removeLastEventTimestamp();
      }
      // move persisted values
      this.ddReserveStorage.getPersistedKeys().forEach((persistedKey) => {
        const value = this.get(persistedKey);
        const ttl = this.ddReserveStorage.getTtl(persistedKey);
        if (value !== undefined) {
          this.storage.set(persistedKey, value, ttl);
        }
        this.ddReserveStorage.getStorage().remove(persistedKey);
      });
      // update persisted keys
      this.updatePersistedKeys(this.getPersistedKeys());
      this.ddReserveStorage.clearPersistedKeys();
    }
  }

  getStorage() {
    return this.storage;
  }

  getTtl(key) {
    if (this.getStorage().getTtl) {
      return this.getStorage().getTtl(key);
    }
    return undefined;
  }

  persist(key, exp) {
    const value = getProp(this.digitalData, key);
    if (value !== undefined) {
      this.addPersistedKey(key);
      this.storage.set(key, value, exp);

      if (this.ddReserveStorage) {
        if (key === keyAnonymousId) { // keep in both storages
          this.ddReserveStorage.persist(key, exp);
        } else {
          this.ddReserveStorage.unpersist(key); // remove from old storage
        }
      }
    }
  }

  getPersistedKeys() {
    const persistedKeys = this.storage.get(keyPersistedKeys) || [];
    // get persisted keys from oldStorage
    if (this.ddReserveStorage) {
      const reservePersistedKeys = this.ddReserveStorage.getPersistedKeys();
      arrayMerge(persistedKeys, reservePersistedKeys);
    }
    return persistedKeys;
  }

  addPersistedKey(key) {
    const persistedKeys = this.getPersistedKeys();
    if (persistedKeys.indexOf(key) < 0) {
      persistedKeys.push(key);
      this.updatePersistedKeys(persistedKeys);
    }
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
    if (this.ddReserveStorage) {
      this.ddReserveStorage.removeLastEventTimestamp();
    }
    return this.storage.set(keyLastEventTimestamp, timestamp);
  }

  updatePersistedKeys(persistedKeys) {
    this.storage.set(keyPersistedKeys, persistedKeys);
  }

  clearPersistedKeys() {
    this.storage.remove(keyPersistedKeys);
  }

  get(key) {
    let value = this.storage.get(key);

    // check old cookie storage for possible value and clean if necessary
    if (value === undefined && this.ddReserveStorage) {
      value = this.ddReserveStorage.get(key);
    }

    if (value === undefined) {
      this.removePersistedKey(key);
    }

    return value;
  }

  unpersist(key) {
    // unpersist from old cookie storage if possible
    if (this.ddReserveStorage) {
      this.ddReserveStorage.unpersist(key);
    }
    this.removePersistedKey(key);
    return this.storage.remove(key);
  }

  clear() {
    if (this.ddReserveStorage) {
      this.ddReserveStorage.clear();
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
