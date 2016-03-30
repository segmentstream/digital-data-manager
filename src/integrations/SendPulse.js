import Integration from './../Integration.js';
import deleteProperty from './../functions/deleteProperty.js';

class SendPulse extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      protocol: 'http',
      pushScriptUrl: '',
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
    this.load(this.ready);
  }

  enrichDigitalData(done) {
    const pushNotification = this._digitalData.user.pushNotifications = {};
    try {
      pushNotification.isSupported = this.checkPushNotificationsSupport();
      this.getPusSubscriptionInfo((subscriptionInfo) => {
        if (subscriptionInfo === undefined) {
          pushNotification.isSubscribed = false;
          if (window.safari && window.safari.pushNotification) {
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

  getPusSubscriptionInfo(callback) {
    const oSpP = window.oSpP;
    oSpP.getDbValue('SPIDs', 'SubscriptionId', (event) => {
      callback(event.target.result);
    });
  }

  isLoaded() {
    return !!(window.oSpP);
  }

  reset() {
    deleteProperty(window, 'oSpP');
  }
}

export default SendPulse;
