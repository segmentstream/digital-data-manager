import { getProp } from 'driveback-utils/dotProp';

const keyPersistedKeys = '_persistedKeys';
const keyLastEventTimestamp = '_lastEventTimestamp';

class DDStorage
{
  constructor(digitalData, storage) {
    this.digitalData = digitalData;
    this.storage = storage;
  }

  persist(key, exp) {
    const value = getProp(this.digitalData, key);
    if (value !== undefined) {
      const persistedKeys = this.getPersistedKeys();
      if (persistedKeys.indexOf(key) < 0) {
        persistedKeys.push(key);
        this.updatePersistedKeys(persistedKeys);
      }
      return this.storage.set(key, value, exp);
    }
  }

  getPersistedKeys() {
    const persistedKeys = this.storage.get(keyPersistedKeys) || [];
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

  setLastEventTimestamp(timestamp) {
    return this.storage.set(keyLastEventTimestamp, timestamp);
  }

  updatePersistedKeys(persistedKeys) {
    this.storage.set(keyPersistedKeys, persistedKeys);
  }

  get(key) {
    const value = this.storage.get(key);
    if (value === undefined) {
      this.removePersistedKey(key);
    }
    return value;
  }

  unpersist(key) {
    this.removePersistedKey(key);
    return this.storage.remove(key);
  }

  clear() {
    const persistedKeys = this.getPersistedKeys();
    for (const key of persistedKeys) {
      this.storage.remove(key);
    }
    this.storage.remove(keyPersistedKeys);
    this.storage.remove(keyLastEventTimestamp);
  }
}

export default DDStorage;
