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
  LOGGED_IN,
  SUBSCRIBED,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CART,
} from './../events/semanticEvents';

const SEMANTIC_EVENTS = [
  VIEWED_PAGE,
  VIEWED_PRODUCT_DETAIL,
  COMPLETED_TRANSACTION,
  LOGGED_IN,
  REGISTERED,
  SUBSCRIBED,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_CART,
];

class Soloway extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      siteId: '',
      userSegmentVar: undefined,
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

  initAdriverCounter(event, params) {
    params = params || {};
    params.custom = params.custom || {};
    params.custom = Object.assign(params.custom, {
      153: this.getEmailMd5(event),
      160: getProp(event, 'user.hasTransacted') ? 1 : 0,
      162: this.getUserSegment(event),
    });
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
    let enrichableProps;
    switch (event.name) {
    case VIEWED_PRODUCT_DETAIL:
      enrichableProps = ['product.id', 'product.categoryId'];
      break;
    case ADDED_PRODUCT:
      enrichableProps = ['product.id', 'product.categoryId'];
      break;
    case REMOVED_PRODUCT:
      enrichableProps = ['product.id', 'product.categoryId'];
      break;
    case COMPLETED_TRANSACTION:
      enrichableProps = ['transaction.orderId', 'transaction.total'];
      break;
    case REGISTERED:
      enrichableProps = ['user.userId'];
      break;
    case LOGGED_IN:
      enrichableProps = ['user.userId'];
      break;
    default:
      enrichableProps = [];
    }

    enrichableProps.push('user.email', 'user.hasTransacted');

    const userSegmentVar = this.getOption('userSegmentVar');
    if (userSegmentVar) {
      enrichableProps.push(userSegmentVar);
    }

    return enrichableProps;
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
        fields: ['user.userId', 'user.email'],
        validations: {
          'user.userId': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [LOGGED_IN]: {
        fields: ['user.userId', 'user.email'],
        validations: {
          'user.userId': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [SUBSCRIBED]: {
        fields: ['user.email'],
        validations: {
          'user.email': {
            errors: ['required'],
            warnings: ['string'],
          },
        },
      },
      [VIEWED_CART]: {
        fields: ['user.email'],
        validations: {
          'user.email': {
            warnings: ['string'],
          },
        },
      },
    };

    let validationConfig = config[event.name];
    const userSegmentVar = this.getOption('userSegmentVar');

    if (userSegmentVar) {
      if (!validationConfig) {
        validationConfig = {
          fields: [userSegmentVar],
        };
      } else {
        validationConfig.fields = validationConfig.fields || [];
        validationConfig.fields.push(userSegmentVar);
      }
    }

    return validationConfig;
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

  getUserSegment(event) {
    const userSegmentVar = this.getOption('userSegmentVar');
    if (userSegmentVar) {
      return getProp(event, userSegmentVar);
    }
    return undefined;
  }

  trackEvent(event) {
    const methods = {
      [VIEWED_PAGE]: 'onViewedPage',
      [VIEWED_PRODUCT_DETAIL]: 'onViewedProductDetail',
      [COMPLETED_TRANSACTION]: 'onCompletedTransaction',
      [REGISTERED]: 'onRegistered',
      [LOGGED_IN]: 'onLoggedIn',
      [SUBSCRIBED]: 'onSubscribed',
      [REMOVED_PRODUCT]: 'onRemovedProduct',
      [ADDED_PRODUCT]: 'onAddedProduct',
      [VIEWED_CART]: 'onViewedCart',
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
    this.initAdriverCounter(event);
    this.pageTracked = true;
  }

  onViewedProductDetail(event) {
    const product = event.product || {};
    if (!product.id) return;

    this.initAdriverCounter(event, {
      custom: {
        10: product.id,
        11: product.categoryId,
      },
    });

    this.pageTracked = true;
  }

  onNewBuyer(event) {
    const transaction = event.transaction || {};
    if (!transaction.orderId) return;

    this.initAdriverCounter(event, {
      sz: 'new_buyer',
      custom: {
        150: transaction.orderId,
        151: transaction.total,
      },
    });

    this.pageTracked = true;
  }

  onCompletedTransaction(event) {
    const transaction = event.transaction || {};
    if (!transaction.orderId) return;

    if (transaction.isFirst) {
      this.onNewBuyer(event);
    }

    this.initAdriverCounter(event, {
      sz: 'confirm',
      custom: {
        150: transaction.orderId,
        151: transaction.total,
      },
    });

    this.pageTracked = true;
  }

  onAddedProduct(event) {
    const product = event.product || {};
    if (!product.id) return;

    this.initAdriverCounter(event, {
      sz: 'add_basket',
      custom: {
        10: product.id,
        11: product.categoryId,
      },
    });

    this.pageTracked = true;
  }

  onRemovedProduct(event) {
    const product = event.product || {};
    if (!product.id) return;

    this.initAdriverCounter(event, {
      sz: 'del_basket',
      custom: {
        10: product.id,
        11: product.categoryId,
      },
    });

    this.pageTracked = true;
  }

  onViewedCart(event) {
    this.initAdriverCounter(event, {
      sz: 'basket',
    });

    this.pageTracked = true;
  }

  onRegistered(event) {
    const user = event.user || {};
    if (!user.userId) return;

    this.initAdriverCounter(event, {
      sz: 'regist',
      custom: {
        152: user.userId,
      },
    });

    this.pageTracked = true;
  }

  onLoggedIn(event) {
    const user = event.user || {};
    if (!user.userId) return;

    this.initAdriverCounter(event, {
      sz: 'authorization',
      custom: {
        152: user.userId,
      },
    });

    this.pageTracked = true;
  }

  onSubscribed(event) {
    const user = event.user || {};
    if (!user.email) return;

    this.initAdriverCounter(event, {
      sz: 'newsletter',
    });

    this.pageTracked = true;
  }
}

export default Soloway;
