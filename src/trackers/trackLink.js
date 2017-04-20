import { bind } from './../functions/eventListener';
import isMeta from './../functions/isMeta';
import preventDefault from './../functions/preventDefault';
import domQuery from './../functions/domQuery';

function isElement(el) {
  return (el && el.nodeType === 1);
}

function onClick(el, handler) {
  return (e) => {
    const href = el.getAttribute('href')
      || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
      || el.getAttribute('xlink:href');

    try {
      console.warn(el);
      console.warn(handler);
      handler(el);
    } catch (error) {
      // TODO
    }

    if (href && el.target !== '_blank' && !isMeta(e)) {
      preventDefault(e);
      setTimeout(() => {
        window.location.href = href;
      }, 500);
    }
  };
}

export default function trackLink(links, handler) {
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

  for (const el of links) {
    if (!isElement(el)) {
      throw new TypeError('Must pass HTMLElement to `ddManager.trackLink`.');
    }
    bind(el, 'click', onClick(el, handler));
  }

  return this;
}
