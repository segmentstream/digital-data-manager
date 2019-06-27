class AsyncQueue {
  constructor(isLoadedDelegate) {
    this.isLoadedDelegate = isLoadedDelegate;
    this.asyncQueue = [];
  }

  init() {
    // emulate async queue for Ofsys sync script
    let invervalCounter = 0;
    const invervalId = setInterval(() => {
      invervalCounter += 1;
      if (this.isLoadedDelegate()) {
        this.flushQueue();
        clearInterval(invervalId);
      } else if (invervalCounter > 20) {
        clearInterval(invervalId);
      }
    }, 200);
  }

  flushQueue() {
    let handler = this.asyncQueue.shift();
    while (handler && typeof handler === 'function') {
      handler();
      handler = this.asyncQueue.shift();
    }
    this.asyncQueue.push = (callback) => {
      callback();
    };
    this._flushed = true;
  }

  push(handler) {
    this.asyncQueue.push(handler);
    if (!this._flushed && this.isLoadedDelegate()) {
      this.flushQueue();
    }
  }
}

export default AsyncQueue;
