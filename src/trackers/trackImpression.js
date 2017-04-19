import { bind } from './../functions/eventListener';
import getStyle from './../functions/getStyle';

class Batch {
  constructor(blocks, handler) {
    this.blocks = blocks;
    this.handler = handler;
  }
}

/**
* array of Batch
*/
let batches = [];

let isStarted = false;

let docViewTop;
let docViewBottom;
let docViewLeft;
let docViewRight;

function isElement(el) {
  return (el && el.nodeType === 1);
}

function defineDocBoundaries(maxWebsiteWidth) {
  const _defineDocBoundaries = () => {
    docViewTop = window.pageYOffset;
    docViewBottom = docViewTop + window.document.documentElement.clientHeight;
    docViewLeft = window.pageXOffset;
    docViewRight = docViewLeft + window.document.documentElement.clientWidth;

    if (maxWebsiteWidth && maxWebsiteWidth < this.docViewRight && this.docViewLeft === 0) {
      docViewLeft = (docViewRight - maxWebsiteWidth) / 2;
      docViewRight = docViewLeft + maxWebsiteWidth;
    }
  };

  _defineDocBoundaries();
  bind(window, 'resize', () => {
    _defineDocBoundaries();
  });
  bind(window, 'scroll', () => {
    _defineDocBoundaries();
  });
}

/**
 * Returns true if element is visible by css
 * and at least 3/4 of the element fit user viewport
 *
 * @param el DOMElement
 * @returns boolean
 */
function isVisible(el) {
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
    ((elemBottom - elemHeight / 4) <= docViewBottom) &&
    ((elemTop + elemHeight / 4) >= docViewTop)
  );

  const fitsHorizontal = (
    (elemLeft + elemWidth / 4 >= docViewLeft) &&
    (elemRight - elemWidth / 4 <= docViewRight)
  );

  if (!fitsVertical || !fitsHorizontal) {
    return false;
  }

  let elementFromPoint = document.elementFromPoint(
    elemLeft - window.pageXOffset + elemWidth / 2,
    elemTop - window.pageYOffset + elemHeight / 2
  );

  while (elementFromPoint && elementFromPoint !== el && elementFromPoint.parentNode !== document) {
    elementFromPoint = elementFromPoint.parentNode;
  }
  return (!!elementFromPoint && elementFromPoint === el);
}

function trackViews() {
  for (const batch of batches) {
    const newViewedBlocks = [];

    const blocks = batch.blocks;
    for (const block of blocks) {
      if (isVisible(block)) {
        newViewedBlocks.push(block);
      }
    }

    if (newViewedBlocks.length > 0) {
      batch.blocks = blocks.filter((block) => {
        return newViewedBlocks.indexOf(block) < 0;
      });
      try {
        batch.handler(newViewedBlocks);
      } catch (error) {
        // TODO
      }
    }
  }

  batches = batches.filter((batch) => {
    return batch.blocks.length > 0;
  });
}

function startTracking() {
  defineDocBoundaries();
  trackViews();
  setInterval(() => {
    trackViews();
  }, 500);
}

export default function trackImpression(blocks, handler) {
  if (!blocks) return;

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackImpression`.');
  }

  // always arrays, handles jquery
  if (isElement(blocks)) {
    blocks = [blocks];
  } else if (blocks.toArray) {
    blocks = blocks.toArray();
  }

  batches.push(new Batch(blocks, handler));
  if (!isStarted) {
    isStarted = true;
    startTracking();
  }
}
