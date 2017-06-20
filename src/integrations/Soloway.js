import Integration from './../Integration';
import { getProp } from './../functions/dotProp';
import cleanObject from './../functions/cleanObject';
import deletePropery from './../functions/deleteProperty';
import normalizeString from './../functions/normalizeString';
import md5 from 'crypto-js/md5';
import {
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
  REGISTERED,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
} from './../events';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
  REGISTERED,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
];

class Soloway extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
    }, options);

    super(digitalData, optionsWithDefaults);
  }

  adriverCounterFactory() {
    /* eslint-disable */
    return function k() {
      var g = window.document;
      var a = function(d, b) {
        if (this instanceof AdriverCounter)
          d = a.items.length || 1,
          a.items[d] = this,
          b.ph = d,
          b.custom && (b.custom = a.toQueryString(b.custom, ";")),
          a.request(a.toQueryString(b));
        else
          return a.items[d]
      };
      a.httplize = function(a) {
        return (/^\/\//.test(a)
          ? location.protocol
          : "") + a
      };
      a.loadScript = function(a) {
        try {
          var b = g.getElementsByTagName("head")[0],
            c = g.createElement("script");
          c.setAttribute("type", "text/javascript");
          c.setAttribute("charset", "windows-1251");
          c.setAttribute("src", a.split("![rnd]").join(Math.round(1E6 * Math.random())));
          c.onreadystatechange = function() {
            /loaded|complete/.test(this.readyState) && (c.onload = null, b.removeChild(c));
          };
          c.onload = function() {
            b.removeChild(c);
          };
          b.insertBefore(c, b.firstChild);
        } catch (f) {
          console.error(f);
        }
      };
      a.toQueryString = function(a, b, c) {
        b = b || "&";
        c = c || "=";
        var f = [],
          e;
        for (e in a)
          a.hasOwnProperty(e) && f.push(e + c + escape(a[e]));
        return f.join(b)
      };
      a.request = function(d) {
        var b = a.toQueryString(a.defaults);
        a.loadScript(a.redirectHost + "/cgi-bin/erle.cgi?" + d + "&rnd=![rnd]" + (b
          ? "&" + b
          : ""))
      };
      a.items = [];
      a.defaults = {
        tail256: document.referrer || "unknown"
      };
      a.redirectHost = a.httplize("//ad.adriver.ru");
      return a;
    }
    /* eslint-enable */
  }

  initAdriverCounter(params) {
    params = Object.assign(params, {
      sid: this.getOption('siteId'),
      bt: 62,
    });
    params = cleanObject(params);
    new window.AdriverCounter(0, params); // eslint-disable-line
  }

  getSemanticEvents() {
    return SEMANTIC_EVENTS;
  }

  getEnrichableEventProps(event) {
    switch (event.name) {
    case VIEWED_PRODUCT_DETAIL:
      return ['product.id', 'product.categoryId', 'user.email'];
    case ADDED_PRODUCT:
      return ['product.id', 'product.categoryId', 'user.email'];
    case REMOVED_PRODUCT:
      return ['product.id', 'product.categoryId', 'user.email'];
    case COMPLETED_TRANSACTION:
      return ['transaction.orderId', 'transaction.total', 'user.email'];
    case REGISTERED:
      return ['user.userId', 'user.email'];
    default:
      return ['user.email'];
    }
  }

  getEventValidationConfig(event) {
    const productValidationConfig = {
      fields: ['product.id', 'product.categoryId'],
      validations: {
        'product.id': {
          errors: ['required'],
          warnings: ['string'],
        },
        'product.categoryId': {
          errors: ['required'],
          warnings: ['string'],
        },
      },
    };
    const config = {
      [VIEWED_PRODUCT_DETAIL]: productValidationConfig,
      [ADDED_PRODUCT]: productValidationConfig,
      [REMOVED_PRODUCT]: productValidationConfig,
      [COMPLETED_TRANSACTION]: {
        fields: ['transaction.orderId', 'transaction.total'],
        validations: {
          'transaction.orderId': {
            errors: ['required'],
            warnings: ['string'],
          },
          'transaction.total': {
            errors: ['required'],
            warnings: ['numeric'],
          },
        },
      },
      [REGISTERED]: {
        fields: ['user.userId'],
        validations: {
          'user.userId': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
    };

    return config[event.name];
  }

  initialize() {
    window.AdriverCounter = this.adriverCounterFactory()();
  }

  isLoaded() {
    return !!window.AdriverCounter;
  }

  reset() {
    deletePropery(window, 'AdriverCounter');
    this.pageTracked = false;
  }

  getEmailMd5(event) {
    const email = getProp(event, 'user.email');
    if (email) {
      const emailNorm = normalizeString(email);
      const emailMd5 = md5(emailNorm).toString();
      return emailMd5;
    }
    return undefined;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [REGISTERED]: 'onRegistered',
      [REMOVED_PRODUCT]: 'onRemovedProduct',
      [ADDED_PRODUCT]: 'onAddedProduct',
    };

    const method = methods[event.name];
    if (method) {
      this[method](event);
    }
  }

  onViewedPage(event) {
    this.pageTracked = false;
    setTimeout(() => {
      if (!this.pageTracked) {
        this.onViewedOther(event);
      }
    }, 100);
  }

  onViewedOther(event) {
    this.initAdriverCounter({
      custom: {
        153: this.getEmailMd5(event),
      },
    });
    this.pageTracked = true;
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    if (!product.id) return;

    this.initAdriverCounter({
      custom: {
        10: product.id,
        11: product.categoryId,
        153: this.getEmailMd5(event),
      },
    });

    this.pageTracked = true;
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    if (!transaction.orderId) return;

    this.initAdriverCounter({
      sz: 'confirm',
      custom: {
        150: transaction.orderId,
        151: transaction.total,
        153: this.getEmailMd5(event),
      },
    });

    this.pageTracked = true;
  }

  onAddedProduct(event) {
    const product = event.product || {};
    if (!product.id) return;

    this.initAdriverCounter({
      sz: 'add_basket',
      custom: {
        10: product.id,
        11: product.categoryId,
        153: this.getEmailMd5(event),
      },
    });

    this.pageTracked = true;
  }

  onRemovedProduct(event) {
    const product = event.product || {};
    if (!product.id) return;

    this.initAdriverCounter({
      sz: 'del_basket',
      custom: {
        10: product.id,
        11: product.categoryId,
        153: this.getEmailMd5(event),
      },
    });

    this.pageTracked = true;
  }

  onRegistered(event) {
    const user = event.user || {};
    if (!user.userId) return;

    this.initAdriverCounter({
      sz: 'regist',
      custom: {
        152: user.userId,
        153: this.getEmailMd5(event),
      },
    });

    this.pageTracked = true;
  }
}

export default Soloway;
