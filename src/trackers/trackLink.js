import { bind, unbind } from '@segmentstream/utils/eventListener';
import isMeta from '@segmentstream/utils/isMeta';
import preventDefault from '@segmentstream/utils/preventDefault';
import domQuery from '@segmentstream/utils/domQuery';

function applyHandler(event, el, handler, followLink = true) {
  if (event.detail === 0) {
    return; // prevent incorrect markup clicks propogation
  }

  const href = (
    el.tagName === 'A'
    && (
      el.getAttribute('href')
      || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
      || el.getAttribute('xlink:href')
    )
  );

  try {
    handler(el);
  } catch (error) {
    // TODO
  }

  if (
    followLink
    && href
    && el.target !== '_blank'
    && !isMeta(event)
    && !event.defaultPrevented
    && event.returnValue !== false
  ) {
    preventDefault(event);
    setTimeout(() => {
      window.location.href = href;
    }, 500);
  }
}

function onClick(el, handler, followLink = true) {
  return (event) => {
    applyHandler(event, el, handler, followLink);
  };
}

export default function trackLink(selector, handler, followLink = true) {
  if (!selector) return;

  if (typeof handler !== 'function') {
    throw new TypeError('Must pass function handler to `ddManager.trackLink`.');
  }

  let trackedLinks = [];

  bind(window.document, 'click', () => {
    trackedLinks.forEach((trackedLink) => {
      const [el, onClickHandler] = trackedLink;
      unbind(el, 'click', onClickHandler);
    });

    const links = (window.jQuery) ? window.jQuery(selector).get() : domQuery(selector);
    trackedLinks = [];
    links.forEach((el) => {
      const onClickHandler = onClick(el, handler, followLink);
      bind(el, 'click', onClickHandler);
      trackedLinks.push([el, onClickHandler]);
    });
  }, true); // capturing phase
}
