import { bind, unbind } from './../functions/eventListener';
import isMeta from './../functions/isMeta';
import preventDefault from './../functions/preventDefault';
import domQuery from './../functions/domQuery';

const namedTrackers = {};

function isElement(el) {
  return (el && el.nodeType === 1);
}

function applyHandler(event, el, handler) {
  const href = el.getAttribute('href')
    || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    || el.getAttribute('xlink:href');

  try {
    handler(el);
  } catch (error) {
    // TODO
  }

  if (href && el.target !== '_blank' && !isMeta(event)) {
    preventDefault(event);
    setTimeout(() => {
      window.location.href = href;
    }, 500);
  }
}

function onClick(el, handler) {
  return (event) => {
    applyHandler(event, el, handler);
  };
}

class LinkTracker {
  constructor() {
    this.trackers = [];
  }

  addTracker(el, handler) {
    if (!isElement(el)) {
      throw new TypeError('Must pass HTMLElement to `ddManager.trackLink`.');
    }
    const onClickHandler = onClick(el, handler);
    bind(el, 'click', onClickHandler);

    this.trackers.push([el, onClickHandler]);
  }

  reset() {
    for (const tracker of this.trackers) {
      const [el, handler] = tracker;
      unbind(el, 'click', handler);
    }
  }
}

export default function trackLink(links, handler, trackingId) {
  if (!links) return;
  if (typeof links === 'string') {
    links = domQuery(links);
  } else if (isElement(links)) {
    links = [links];
  } else if (links.toArray) { // handles jquery
    links = links.toArray();
  }

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackLink`.');
  }

  let linkTracker;
  if (trackingId) {
    linkTracker = namedTrackers[trackingId];
    if (linkTracker) {
      linkTracker.reset();
    }
  }
  
  if (!linkTracker) {
    linkTracker = new LinkTracker();
    namedTrackers[trackingId] = linkTracker;
  }

  for (const el of links) {
    linkTracker.addTracker(el, handler);
  }

  return;
}
