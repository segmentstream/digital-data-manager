class AsyncQueue {
  constructor(isLoadedDelegate) {
    this.asyncQueue = [];

    // emulate async queue for Ofsys sync script
    let invervalCounter = 0;
    const invervalId = setInterval(() => {
      invervalCounter++;
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
    this.asyncQueue.push(handler);
  }
}

export default AsyncQueue;
