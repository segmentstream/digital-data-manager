import uuid from 'uuid/v4';

class User {
  setStorage(storage) {
    this.storage = storage;
  }

  userId(userId) {
    const previousId = this.storage.get('user.userId');
    this.storage.set('user.userId', userId);
    if (previousId === userId) {
      return userId;
    }
    if (previousId !== userId && userId) {
      this.anonymousId(null);
    }
    return userId;
  }

  anonymousId() {
    let anonymousId = this.storage.get('user.anonymousId');
    if (!anonymousId) {
      anonymousId = uuid();
      this.storage.set('user.anonymousId', anonymousId);
    }
      
    return anonymousId;
  }

  setData(data = {}) {
    this.data = data;
    if (!data.anonymousId) {
      data.anonymousId = this.anonymousId();
    }
    if (data.userId) this.userId(data.userId);
  }

  getData() {
    return this.data;
  }
}

export default new User();