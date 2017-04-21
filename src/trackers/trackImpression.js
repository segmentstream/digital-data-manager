import getStyle from './../functions/getStyle';
import domQuery from './../functions/domQuery';

class Batch {
  constructor(handler) {
    this.blocks = [];
    this.viewedBlocks = [];
    this.handler = handler;
  }

  addViewedBlock(block) {
    this.viewedBlocks.push(block);
  }

  isViewedBlock(block) {
    return !(this.viewedBlocks.indexOf(block) < 0);
  }

  setBlocks(blocks) {
    this.blocks = blocks;
  }
}

class BatchTable {
  constructor() {
    this.selectors = [];
    this.batches = {};
  }

  add(selector, handler) {
    if (this.selectors.indexOf(selector) < 0) {
      this.selectors.push(selector);
      this.batches[selector] = [];
    }

    const batch = new Batch(handler);
    this.batches[selector].push(batch);
  }

  update() {
    for (const selector of this.selectors) {
      const batches = this.batches[selector];
      const blocks = domQuery(selector);
      for (const batch of batches) {
        batch.setBlocks(blocks);
      }
    }
  }

  getAll() {
    let allBatches = [];
    for (const selector of this.selectors) {
      const batches = this.batches[selector];
      allBatches = [...allBatches, ...batches];
    }
    return allBatches;
  }
}

const batchTable = new BatchTable();

let isStarted = false;

/**
 * Returns true if element is visible by css
 * and at least 3/4 of the element fit user viewport
 *
 * @param el DOMElement
 * @returns boolean
 */
function isVisible(el) {
  const docEl = window.document.documentElement;

  const elemWidth = el.clientWidth;
  const elemHeight = el.clientHeight;

  const elemTop = el.getBoundingClientRect().top;
  const elemBottom = elemTop + elemHeight;
  const elemLeft = el.getBoundingClientRect().left;
  const elemRight = elemLeft + elemWidth;

  const visible = !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length) && Number(getStyle(el, 'opacity')) > 0 && getStyle(el, 'visibility') !== 'hidden';
  if (!visible) {
    return false;
  }

  const fitsVertical = (
    ((elemBottom - elemHeight / 4) <= docEl.clientHeight) &&
    ((elemTop + elemHeight / 4) >= 0)
  );

  const fitsHorizontal = (
    (elemLeft + elemWidth / 4 >= 0) &&
    (elemRight - elemWidth / 4 <= docEl.clientWidth)
  );

  if (!fitsVertical || !fitsHorizontal) {
    return false;
  }

  let elementFromPoint = document.elementFromPoint(
    elemLeft + elemWidth / 2,
    elemTop + elemHeight / 2
  );

  while (elementFromPoint && elementFromPoint !== el && elementFromPoint.parentNode !== document) {
    elementFromPoint = elementFromPoint.parentNode;
  }
  return (!!elementFromPoint && elementFromPoint === el);
}

function trackViews() {
  batchTable.update();

  const batches = batchTable.getAll();
  for (const batch of batches) {
    const newViewedBlocks = [];

    const blocks = batch.blocks;
    for (const block of blocks) {
      if (isVisible(block) && !batch.isViewedBlock(block)) {
        newViewedBlocks.push(block);
        batch.addViewedBlock(block);
      }
    }

    if (newViewedBlocks.length > 0) {
      try {
        batch.handler(newViewedBlocks);
      } catch (error) {
        // TODO
      }
    }
  }
}

function startTracking() {
  trackViews();
  setInterval(() => {
    trackViews();
  }, 500);
}

export default function trackImpression(selector, handler) {
  if (!selector) return;

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackImpression`.');
  }

  batchTable.add(selector, handler);

  if (!isStarted) {
    isStarted = true;
    startTracking();
  }
}
