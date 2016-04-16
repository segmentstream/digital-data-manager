import Integration from './../Integration.js';

class OWOXBIStreaming extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      namespace: 'ddl',
      sessionIdDimension: '',
    }, options);

    super(digitalData, optionsWithDefaults);
  }

  initialize() {
    this.ga('require', 'OWOXBIStreaming', {
      sessionIdDimension: this.getOption('sessionIdDimension'),
    });
    /* eslint-disable */
    (function(){function g(h,b){var f=h.get('sendHitTask'),g=function(){function a(a,e){var d='XDomainRequest'in window?'XDomainRequest':'XMLHttpRequest',c=new window[d];c.open('POST',a,!0);c.onprogress=function(){};c.ontimeout=function(){};c.onerror=function(){};c.onload=function(){};c.setRequestHeader&&c.setRequestHeader('Content-Type','text/plain');'XDomainRequest'==d?setTimeout(function(){c.send(e)},0):c.send(e)}function
    f(a,e){var d=new Image;d.onload=function(){};d.src=a+'?'+e}var g=b&&b.domain?b.domain:'google-analytics.bi.owox.com';return{send:function(b){var e=location.protocol+'//'+g+'/collect',d;try{navigator.sendBeacon&&navigator.sendBeacon(d=e+'?tid='+h.get('trackingId'),b)||(2036<b.length?a(d?d:e+'?tid='+h.get('trackingId'),b):f(e,b))}catch(c){}}}}();h.set('sendHitTask',function(a){if(b&&0<b.sessionIdDimension)try{a.set('dimension'+b.sessionIdDimension,a.get('clientId')+'_'+Date.now()),a.get('buildHitTask')(a)}catch(h){}f(a);g.send(a.get('hitPayload'))})}var
        f=window[window.GoogleAnalyticsObject||'ga'];'function'==typeof f&&f('provide','OWOXBIStreaming',g)})();
    /* eslint-enable */
    this._loaded = true;
    this.ready();
  }

  isLoaded() {
    return !!this._loaded;
  }

  reset() {

  }

  ga() {
    if (!this.getOption('namespace')) {
      window.ga.apply(window, arguments);
    } else {
      if (arguments[0]) {
        arguments[0] = this.getOption('namespace') + '.' + arguments[0];
      }
      window.ga.apply(window, arguments);
    }
  }
}

export default OWOXBIStreaming;
