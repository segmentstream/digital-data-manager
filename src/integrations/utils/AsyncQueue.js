class AsyncQueue {
  constructor(isLoadedDelegate) {
    this.isLoadedDelegate = isLoadedDelegate;
    this.asyncQueue = [];

    // emulate async queue for Ofsys sync script
    let invervalCounter = 0;
    const invervalId = setInterval(() => {
      invervalCounter += 1;
      if (isLoadedDelegate()) {
        this.flushQueue();
        clearInterval(invervalId);
      } else if (invervalCounter > 10) {
        clearInterval(invervalId);
      }
    }, 100);
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
  }

  push(handler) {
    if (this.isLoadedDelegate()) {
      handler();
    } else {
      this.asyncQueue.push(handler);
    }
  }
}

export default AsyncQueue;
