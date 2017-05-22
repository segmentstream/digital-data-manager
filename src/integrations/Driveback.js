import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import noop from './../functions/noop.js';
import {
  VIEWED_PAGE,
  VIEWED_EXPERIMENT,
  ACHIEVED_EXPERIMENT_GOAL,
} from './../events';

function getExperment(experiment) {
  if (typeof experiment === 'object') {
    if (experiment.id) {
      return experiment;
    }
    return undefined;
  }
  if (experiment) {
    return {
      id: experiment,
    };
  }
  return undefined;
}

class Driveback extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      autoInit: true,
      websiteToken: '',
      experiments: false,
      experimentsToken: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      VIEWED_EXPERIMENT,
      ACHIEVED_EXPERIMENT_GOAL,
    ];

    this.addTag({
      type: 'script',
      attr: {
        id: 'driveback-sdk',
        src: '//cdn.driveback.ru/js/loader.js',
      },
    });
  }

  getEventValidations(event) {
    if (event.name === VIEWED_EXPERIMENT || event.name === ACHIEVED_EXPERIMENT_GOAL) {
      if (typeof event.experiment === 'string') {
        return [
          ['experiment', { required: true, string: true }],
        ];
      }
      return [
        ['experiment.id', { required: true, string: true }],
        ['experiment.variationId', { numeric: true }],
      ];
    }
    return [];
  }

  initialize() {
    if (this.getOption('websiteToken')) {
      window.DrivebackNamespace = 'Driveback';
      window.Driveback = window.Driveback || {};
      window.DrivebackOnLoad = window.DrivebackOnLoad || [];
      window.Driveback.initStubCalled = false;
      window.Driveback.init = () => {
        window.Driveback.initStubCalled = true;
      };
      window.DrivebackLoaderAsyncInit = () => {
        window.Driveback.Loader.init(this.getOption('websiteToken'));
      };
      // by default Driveback is initialized automatically
      if (this.getOption('autoInit') === false) {
        window.DrivebackAsyncInit = noop;
      }

      // include Driveback Experiments snippet
      if (this.getOption('experiments')) {
        /* eslint-disable */
        !function(a){function b(a,b,c){var d,e=new Date;c?(e.setTime(e.getTime()+1e3*c),d="; expires="+e.toGMTString()):d="",document.cookie=a+"="+b+d+"; path=/"}function c(a){var b,c,d=a+"=",e=document.cookie.split(";");for(b=0;b<e.length;b+=1){for(c=e[b];" "===c.charAt(0);)c=c.substring(1,c.length);if(0===c.indexOf(d))return c.substring(d.length,c.length)}return null}function d(){var a,c,d=[];for(a=0;a<H.length;a+=1)d.push(H[a].join(":"));d.length>0&&(c=d.join("|"),b(x,c,B))}function e(){if(void 0!==w)return w;if(w=!0,JSON.stringify&&JSON.parse)if(/(MSIE [0-8]\.\d+)/.test(navigator.userAgent))w=!1;else try{localStorage.test=1}catch(a){w=!1}else w=!1;return w}function f(a){var b,c=0,d=Math.random();for(b=0;b<a.length;b+=1)if(c+=a[b],d<c)return b;return-1}function g(a){var b,c;"function"==typeof a?a.apply(v):(b=a[0],c=Array.prototype.slice.call(a,1),v[b]&&v[b].apply(v,c))}function h(a){return F[a]}function i(a){var b=I[a];return void 0!==b?H[b][1]:-1}function j(a,b){var c=I[a];void 0===c?(I[a]=H.length,H.push([a,b,0]),d()):H[c][1]!==b&&(H[c][1]=b,H[c][2]=0,d())}function k(a){var b=I[a];void 0!==b&&(H[b][2]=1,d())}function l(a){var b=I[a];return void 0!==b&&1===H[b][2]}function m(){var a,b,d,e,f;if(b=c(x))for(d=b.split("|"),a=0;a<d.length;a+=1)e=d[a].split(":"),f=e[0],F[f]&&(I[f]=H.length,H.push([e[0],Number(e[1]),Number(e[2])]))}function n(b){(a.Image?new Image:a.document.createElement("img")).src=a.location.protocol+b}function o(a,b){var c=C+"/track?t=s&exp="+a+"&var="+b;n(c),k(a)}function p(a,b,c){var d=c?"&val="+c:"",e=C+"/track?t=c&exp="+a+"&var="+b+d;n(e)}function q(){var a=c(z);return!(!a||!localStorage.getItem(y))}function r(a){var b;if(!D){for(E=a,b=0;b<a.length;b+=1)F[a[b][0]]=a[b];for(m(),d(),D=!0,b=0;b<G.length;b+=1)g(G[b])}}function s(a){var b=document.createElement("script"),c=document.getElementsByTagName("script")[0];b.type="text/javascript",b.async=!0,b.src=C+"/"+a+"/experiments.js",c.parentNode.insertBefore(b,c)}function t(a){localStorage.setItem(y,JSON.stringify(a)),b(z,"x",A),r(a)}function u(){var a=JSON.parse(localStorage.getItem(y)||[]);r(a)}var v,w,x="_dbexu",y="dbex::data",z="_dbexdr",A=3600,B=48211200,C="//dbex-tracker.driveback.ru",D=!1,E=[],F={},G=[],H=[],I={};a.dbex||(v=function(){var a=arguments;if(0!==a.length){if("init"===a[0])return void(q()?u():s(a[1]));1===a.length&&"function"==typeof a[0]&&(a=a[0]),D?g(a):G.push(a)}},v.onLoaded=t,v.chooseVariation=function(a){var b,c=h(a);return c?(b=i(a),b<0&&(b=f(c[1]),b>=0&&j(a,b)),b):-1},v.setVariation=function(a,b){var c=h(a);c&&b>=0&&j(a,b)},v.trackSession=function(a){var b,c,d=h(a);d&&(b=i(a),c=l(a),b<0&&(b=v.chooseVariation(a)),!c&&b>=0&&o(a,b))},v.trackConversion=function(a,b){var c,d,e=h(a);e&&(c=i(a),d=l(a),d&&c>=0&&p(a,c,b))},v.chooseVariations=function(){var a,b={};for(a=0;a<E.length;a+=1)b[E[a][0]]=this.chooseVariation(E[a][0]);return b},e()?a.dbex=v:a.dbex=function(){})}(window);        /* eslint-enable */
        if (this.getOption('experimentsToken')) {
          window.dbex('init', this.getOption('experimentsToken'));
        }

        // disable automatic Driveback init and init only when dbex is ready
        if (this.getOption('autoInit')) {
          window.DrivebackAsyncInit = noop;
          window.dbex(function onDbexExperimentsLoaded() {
            window.Driveback.init();
          });
        }
      }

      if (this.getOption('experiments') && window.dbex) {
        this.enrichDigitalData();
      }

      this.load(this.onLoad);
    } else {
      this.onLoad();
    }
  }

  getSemanticEvents() {
    return this.SEMANTIC_EVENTS;
  }

  enrichDigitalData() {
    if (!window.dbex.chooseVariations) return; // TODO: hotfix, remove later
    window.dbex(() => {
      this.digitalData.user = this.digitalData.user || {};
      this.digitalData.user.experiments = window.dbex.chooseVariations();
      this.onEnrich();
    });
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE) {
      this.onViewedPage();
    } else if (this.getOption('experiments')) {
      if (event.name === VIEWED_EXPERIMENT) {
        const experiment = getExperment(event.experiment);
        if (!experiment) {
          return;
        }
        if (experiment.variationId !== undefined) {
          window.dbex('setVariation', experiment.id, experiment.variationId);
        }
        window.dbex('trackSession', experiment.id);
      } else if (event.name === ACHIEVED_EXPERIMENT_GOAL) {
        const experiment = getExperment(event.experiment);
        if (!experiment) {
          return;
        }

        window.dbex('trackConversion', experiment.id, event.value);
      }
    }
  }

  onViewedPage() {
    if (window.Driveback.initInvoked) {
      window.DriveBack.reactivateCampaigns(); // keep capital "B" in DriveBack
    } else {
      if (this.getOption('autoInit') === false) {
        if (this.getOption('experiments')) {
          window.dbex(function onDbexExperimentsLoaded() {
            window.Driveback.init();
          });
        } else {
          window.Driveback.init();
        }
      }
    }
  }

  isLoaded() {
    return !!(window.Driveback && window.Driveback.Loader);
  }

  reset() {
    deleteProperty(window, 'Driveback');
    deleteProperty(window, 'DriveBack');
    deleteProperty(window, 'DrivebackNamespace');
    deleteProperty(window, 'DrivebackOnLoad');
    deleteProperty(window, 'DrivebackLoaderAsyncInit');
    deleteProperty(window, 'DrivebackAsyncInit');
    deleteProperty(window, 'dbex');
  }
}

export default Driveback;
