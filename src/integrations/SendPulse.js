import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';
import each from './../functions/each.js';
import type from 'component-type';

class SendPulse extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      protocol: 'http',
      pushScriptUrl: '',
      pushSubscriptionTriggerEvent: 'Agreed to Receive Push Notifications',
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        charset: 'UTF-8',
        src: this.getOption('pushScriptUrl'),
      },
    });
  }

  static getName() {
    return 'SendPulse';
  }

  initialize() {
    window.ddListener.push(['on', 'change:user', (user) => {
      if (user.pushNotifications.isSubscribed) {
        this.sendUserAttributes(user);
      }
    }]);
    this.load(() => {
      const original = window.oSpP.storeSubscription;
      window.oSpP.storeSubscription = (value) => {
        original(value);
        if (value !== 'DENY') {
          this.sendUserAttributes(this._digitalData.user);
        }
      };
      this.ready();
    });
  }

  enrichDigitalData(done) {
    const pushNotification = this._digitalData.user.pushNotifications = {};
    try {
      pushNotification.isSupported = this.checkPushNotificationsSupport();
      this.getPushSubscriptionInfo((subscriptionInfo) => {
        if (subscriptionInfo === undefined) {
          pushNotification.isSubscribed = false;
          if (window.oSpP.isSafariNotificationSupported()) {
            const info = window.safari.pushNotification.permission('web.com.sendpulse.push');
            if (info.persmission === 'denied') {
              pushNotification.isDenied = true;
            }
          }
        } else {
          if (subscriptionInfo.value === 'DENY') {
            pushNotification.isSubscribed = false;
            pushNotification.isDenied = true;
          } else {
            pushNotification.isSubscribed = true;
            pushNotification.subscriptionId = subscriptionInfo.value;
          }
        }
        done();
      });
    } catch (e) {
      pushNotification.isSupported = false;
      done();
    }
  }

  checkPushNotificationsSupport() {
    const oSpP = window.oSpP;

    if (!oSpP.detectSite()) {
      return false;
    }
    if (oSpP.detectOs() === 'iOS') {
      return false;
    }
    const os = oSpP.detectOs();
    const browserInfo = oSpP.detectBrowser();
    const browserName = browserInfo.name.toLowerCase();
    if ((browserName === 'chrome') && (parseFloat(browserInfo.version) < 42)) {
      return false;
    }
    if ((browserName === 'firefox') && (parseFloat(browserInfo.version) < 44)) {
      return false;
    }
    if ((browserName === 'firefox') && (os === 'Android')) {
      return false;
    }
    if (browserName === 'safari') {
      return oSpP.isSafariNotificationSupported();
    }
    return true;
  }

  getPushSubscriptionInfo(callback) {
    const oSpP = window.oSpP;
    oSpP.getDbValue('SPIDs', 'SubscriptionId', (event) => {
      callback(event.target.result);
    });
  }

  sendUserAttributes(user) {
    each(user, (key, value) => {
      if (type(value) !== 'object') {
        window.oSpP.push(key, value);
      }
    });
  }

  isLoaded() {
    return !!(window.oSpP);
  }

  reset() {
    deleteProperty(window, 'oSpP');
  }

  trackEvent(event) {
    if (event.name === this.getOption('pushSubscriptionTriggerEvent')) {
      if (this.checkPushNotificationsSupport()) {
        const browserInfo = oSpP.detectBrowser();
        const browserName = browserInfo.name.toLowerCase();
        if (browserName === 'safari') {
          window.oSpP.startSubscription();
        } else if (browserName === 'chrome' || browserName === 'firefox') {
          window.oSpP.showPopUp();
        }
      }
    }
  }
}

export default SendPulse;
