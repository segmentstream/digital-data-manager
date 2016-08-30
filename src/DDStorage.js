import dot from 'dot-object';

const keyPersistedKeys = '_persistedKeys';

class DDStorage
{
  constructor(digitalData, storage) {
    this.digitalData = digitalData;
    this.storage = storage;
  }

  persist(key, exp) {
    const value = dot.pick(key, this.digitalData);
    if (value !== undefined) {
      const persistedKeys = this.getPersistedKeys();
      if (persistedKeys.indexOf(key) < 0) {
        persistedKeys.push(key);
        this.storage.set(keyPersistedKeys, persistedKeys);
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
    this.savePersistedKeys(persistedKeys);
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

  clearPersistedData() {
    const persistedKeys = this.getPersistedKeys();
    for (const key of persistedKeys) {
      this.storage.remove(key);
    }
    this.storage.remove(keyPersistedKeys);
  }
}

export default DDStorage;
