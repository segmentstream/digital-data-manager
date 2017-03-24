!function(a, domain) {
    domain = domain || "cdn.ddmanager.ru";
    var b = window.ddManager = window.ddManager || [];
    window.ddListener = window.ddListener || [];
    var c = window.digitalData = window.digitalData || {};
    c.events = c.events || [];
    if (!b.initialize) if (b.invoked) window.console && console.error && console.error("Digital Data Manager snippet included twice."); else {
        b.invoked = !0;
        b.methods = "initialize addIntegration persist unpersist on once off".split(" ");
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
            var b = document.createElement("script");
            b.type = "text/javascript";
            b.async = !0;
            b.src = a;
            a = document.getElementsByTagName("script")[0];
            a.parentNode.insertBefore(b, a);
        };
        b.loadProject = function(a) {
            var c = window.location.search;
            0 <= c.indexOf("ddm_test_mode=1") ? window.localStorage.setItem("_ddm_test_mode", "1") : 0 <= c.indexOf("ddm_test_mode=1") && window.localStorage.removeItem("_ddm_test_mode");
            a = "1" === window.localStorage.getItem("_ddm_test_mode") ? "//api.ddmanager.ru/v1/ddm-initialization/" + a + ".js" : "//" + domain + "/ddm-initialization/" + a + ".js";
            b.load(a);
        };
        b.CDN_DOMAIN = domain;
        b.SNIPPET_VERSION = "1.0.4";
        b.loadProject(a);
    }
}("<PROJECT_ID>", "<CDN_DOMAIN>");
