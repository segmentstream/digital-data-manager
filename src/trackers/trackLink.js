import { bind, unbind } from './../functions/eventListener';
import isMeta from './../functions/isMeta';
import preventDefault from './../functions/preventDefault';
import domQuery from './../functions/domQuery';

function applyHandler(event, el, handler) {
  const href = el.getAttribute('href')
    || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
    || el.getAttribute('xlink:href');

  try {
    handler(el);
  } catch (error) {
    // TODO
  }

  if (
    href &&
    el.target !== '_blank' &&
    !isMeta(event) &&
    !event.defaultPrevented &&
    event.returnValue !== false
  ) {
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

export default function trackLink(selector, handler) {
  if (!selector) return;

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackLink`.');
  }

  let trackedLinks;

  bind(window.document, 'click', function bindClickListeners() {
    const links = domQuery(selector);
    trackedLinks = [];
    for (const el of links) {
      const onClickHandler = onClick(el, handler);
      bind(el, 'click', onClickHandler);
      trackedLinks.push([el, onClickHandler]);
    }
  }, true); // capturing phase

  bind(window.document, 'click', function unbindClickListeners() {
    for (const trackedLink of trackedLinks) {
      const [el, onClickHandler] = trackedLink;
      unbind(el, 'click', onClickHandler);
    }
  }); // bubbling phase

  return;
}
