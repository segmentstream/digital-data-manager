import Integration from './../Integration';
import deleteProperty from './../functions/deleteProperty';
import getProperty from './../functions/getProperty';
import each from './../functions/each';

class OneSignal extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      appId: '',
      autoRegister: false,
      subdomainName: undefined,
      path: '/',
      safariWebId: undefined,
      pushSubscriptionTriggerEvent: 'Agreed to Receive Push Notifications',
      tags: {},
      noConflict: false,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: 'https://cdn.onesignal.com/sdks/OneSignalSDK.js',
      },
    });
  }

  initialize() {
    window.OneSignal = window.OneSignal || [];
    if (!this.getOption('noConflict')) {
      window.OneSignal.push(['init', {
        appId: this.getOption('appId'),
        autoRegister: this.getOption('autoRegister'),
        subdomainName: this.getOption('subdomainName'),
        path: this.getOption('path'),
        safari_web_id: this.getOption('safariWebId'),
      }]);
      window.OneSignal.push(['sendTags', this.getTags(), function onTagsSent() {
        // Callback called when tags have finished sending
      }]);
      this.load(this.ready);
    } else {
      this.ready();
    }
  }

  isLoaded() {
    return (window.OneSignal && !Array.isArray(window.OneSignal));
  }

  reset() {
    deleteProperty(window, 'OneSignal');
  }

  getTags() {
    const tags = {};
    const tagSettings = this.getOption('tags');
    each(tagSettings, (tagName, ddlVarName) => {
      let tagVal = getProperty(this.digitalData, ddlVarName);
      if (tagVal !== undefined) {
        if (typeof tagVal === 'boolean') tagVal = tagVal.toString();
        tags[tagName] = tagVal;
      }
    });
    return tags;
  }

  enrichDigitalData(done) {
    const pushNotification = this.digitalData.user.pushNotifications = {};
    window.OneSignal.push(function onOneSignalLoaded() {
      pushNotification.isSupported = window.OneSignal.isPushNotificationsSupported();
      window.OneSignal.getNotificationPermission(function onGetPushNotificationPermission(permission) {
        switch (permission) {
        case 'granted':
          pushNotification.isSubscribed = true;
          window.OneSignal.getRegistrationId(function onGetRegistrationId(registrationId) {
            pushNotification.subscriptionId = registrationId;
          });
          window.OneSignal.getUserId(function onGetUserId(userId) {
            pushNotification.userId = userId;
          });
          break;
        case 'denied':
          pushNotification.isSubscribed = false;
          pushNotification.isDenied = true;
          break;
        default:
          pushNotification.isSubscribed = false;
          break;
        }
      });
    });
    done();
  }

  trackEvent(event) {
    if (event.name === this.getOption('pushSubscriptionTriggerEvent')) {
      window.OneSignal.push(['registerForPushNotifications']);
    }
  }
}

export default OneSignal;
