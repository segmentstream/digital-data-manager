(function(a, domain) {
  domain = domain || 'cdn.ddmanager.ru';
  var b = window.ddManager = window.ddManager || [];
  window.ddListener = window.ddListener || [];
  var c = window.digitalData = window.digitalData || {};
  c.events = c.events || [];
  c.changes = c.changes || [];
  if (!b.initialize) if (b.invoked) window.console && console.error && console.error('Digital Data Manager snippet included twice.'); else {
    b.invoked = !0;
    b.methods = 'initialize addIntegration persist unpersist on once off'.split(' ');
    b.factory = function(a) {
      return function() {
        var c = Array.prototype.slice.call(arguments);
        c.unshift(a);
        b.push(c);
        return b;
      };
    };
    for (c = 0; c < b.methods.length; c++) {
      var d = b.methods[c];
      b[d] = b.factory(d);
    }
    b.load = function(a) {
      var b = document.createElement('script');
      b.type = 'text/javascript';
      b.charset = 'utf-8';
      b.async = !0;
      b.src = a;
      a = document.getElementsByTagName('script')[0];
      a.parentNode.insertBefore(b, a);
    };
    b.loadProject = function(a) {
      var queryString = window.location.search;
      var initUrl;
      var testMode;
      if (queryString.indexOf('ddm_test_mode=1') >= 0) {
        try {
          testMode = true;
          window.localStorage.setItem('_ddm_test_mode', '1');
        } catch (e) {}
      } else if (queryString.indexOf('ddm_test_mode=0') >= 0) {
        try {
          testMode = false;
          window.localStorage.removeItem('_ddm_test_mode');
        } catch (e) {}
      } else {
        try {
          testMode = ('1' === window.localStorage.getItem('_ddm_test_mode'));
        } catch (e) {}
      }
      if (testMode) {
        b.load(window.DDMANAGER_TESTMODE_INIT_URL
          || ('https://api.ddmanager.ru/v1/ddm-initialization/' + a + '.js'));
      } else {
        b.load(window.DDMANAGER_INIT_URL || ('https://' + domain + '/ddm-initialization/' + a + '.js'));
      }

    };
    b.CDN_DOMAIN = domain;
    b.SNIPPET_VERSION = '1.0.11';
    b.loadProject(a);
  }
})('<PROJECT_ID>', '<CDN_DOMAIN>');
