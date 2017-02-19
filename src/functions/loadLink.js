import onLoad from './scriptOnLoad.js';
import async from 'async';

export default function(options, fn) {
  if (!options) throw new Error('Cant load nothing...');

  const https = document.location.protocol === 'https:' ||
      document.location.protocol === 'chrome-extension:';

  // If you use protocol relative URLs, third-party scripts like Google
  // Analytics break when testing with `file:` so this fixes that.
  if (options.href && options.href.indexOf('//') === 0) {
    options.href = https ? 'https:' + options.href : 'http:' + options.href;
  }

  // Allow them to pass in different URLs depending on the protocol.
  if (https && options.https) options.href = options.https;
  else if (!https && options.http) options.href = options.http;

  // Make the `<link>` element and insert it before the first link on the
  // page, which is guaranteed to exist since this CSS is included on the page.
  const link = document.createElement('link');
  link.href = options.href;
  if (options.rel) link.rel = options.rel;
  if (options.type) link.type = options.type;

  // If we have a fn, attach event handlers, even in IE. Based off of
  // the Third-Party Javascript script loading example:
  // https://github.com/thirdpartyjs/thirdpartyjs-code/blob/master/examples/templates/02/loading-files/index.html
  if (typeof fn === 'function') {
    onLoad(link, fn);
  }

  async.nextTick(() => {
    // Append after event listeners are attached for IE.
    const firstLink = document.getElementsByTagName('link')[0];
    firstLink.parentNode.insertBefore(link, firstLink);
  });

  // Return the link element in case they want to do anything special, like
  // give it an ID or attributes.
  return link;
}
