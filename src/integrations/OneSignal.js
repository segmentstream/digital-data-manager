import Integration from './../Integration';
import deleteProperty from './../functions/deleteProperty';
import { getProp } from './../functions/dotProp';
import each from './../functions/each';
import after from './../functions/after';
import {
  VIEWED_PAGE,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_CATEGORY,
  COMPLETED_TRANSACTION,
  SUBSCRIBED,
} from './../events';
import { DIGITALDATA_VAR } from './../variableTypes';

const semanticEvents = [
  VIEWED_PAGE,
  ADDED_PRODUCT,
  REMOVED_PRODUCT,
  VIEWED_PRODUCT_DETAIL,
  VIEWED_PRODUCT_CATEGORY,
  COMPLETED_TRANSACTION,
  SUBSCRIBED,
];

function isHttps() {
  return (window.location.href.indexOf('https:') >= 0);
}

class OneSignal extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      appId: '',
      autoRegister: false,
      subdomainName: undefined,
      path: '/',
      safariWebId: undefined,
      pushSubscriptionTriggerEvent: 'Agreed to Receive Push Notifications',
      tagVars: {},
      welcomeNotification: {
        disable: true,
      },
    }, options);

    super(digitalData, optionsWithDefaults);

    this.userTags = {}; // not to conflict with this.tags named it userTags
    this.enrichableTagProps = [];

    this.addTag('manifest', {
      type: 'link',
      attr: {
        rel: 'manifest',
        href: optionsWithDefaults.path.replace(/\/$/, '') + '/manifest.json'
      },
    });
    this.addTag({
      type: 'script',
      attr: {
        src: 'https://cdn.onesignal.com/sdks/OneSignalSDK.js',
      },
    });
  }

  getEnrichableEventProps(event) {
    const enrichableProps = ['user.email'];

    if (semanticEvents.indexOf(event.name) >= 0 || event.name === this.getOption('pushSubscriptionTriggerEvent')) {
      const enrichableTagProps = this.getEnrichableTagProps();
      for (const enrichableTagProp of enrichableTagProps) {
        enrichableProps.push(enrichableTagProp);
      }
    }

    return enrichableProps;
  }

  getEnrichableTagProps() {
    return this.enrichableTagProps;
  }

  prepareEnrichableTagProps() {
    const tagsSettings = this.getOption('tagVars');
    each(tagsSettings, (key, variable) => {
      if (variable.type === DIGITALDATA_VAR) {
        this.enrichableTagProps.push(variable.value);
      }
    });
  }

  initialize() {
    window.OneSignal = window.OneSignal || [];

    if (this.getOption('notifyButton') && this.getOption('notifyButton').displayPredicate) {
      try {
        this.getOption('notifyButton').displayPredicate =
          Function(this.getOption('notifyButton').displayPredicate);
      } catch (e) {
        deleteProperty(this.getOption('notifyButton'), 'displayPredicate');
      }
    }

    window.OneSignal.push(['init', {
      appId: this.getOption('appId'),
      autoRegister: this.getOption('autoRegister'),
      subdomainName: this.getOption('subdomainName'),
      path: this.getOption('path'),
      safari_web_id: this.getOption('safariWebId'),
      promptOptions: this.getOption('promptOptions'),
      notifyButton: this.getOption('notifyButton'),
      welcomeNotification: this.getOption('welcomeNotification'),
    }]);

    window.OneSignal.push(['getRegistrationId', (registrationId) => {
      if (registrationId) {
        window.OneSignal.push(['getTags', (tags) => {
          this.currentTags = tags;
          this.emit('getTags');
        }]);
      } else {
        this.currentTags = {};
        this.emit('getTags');
      }
    }]);

    this.enrichDigitalData();
    this.prepareEnrichableTagProps();

    const loaded = after((isHttps() ? 2 : 1), this.onLoad);
    if (isHttps()) {
      this.load('manifest', loaded);
    }
    this.load(loaded);
  }

  onGetTags(fn) {
    if (this.currentTags) {
      fn(this.currentTags);
    } else {
      this.on('getTags', () => {
        fn(this.currentTags);
      });
    }
  }

  extractTagValuesFromEvent(event) {
    const tagsSettings = this.getOption('tagVars');
    const newTags = {};
    each(tagsSettings, (key, variable) => {
      let tagVal = getProp(event, variable.value);
      if (tagVal !== undefined) {
        if (typeof tagVal === 'boolean') tagVal = tagVal.toString();
        newTags[key] = tagVal;
      }
    });
    return newTags;
  }

  getTagsToDelete(currentTags) {
    const newTagsKeys = Object.keys(this.getOption('tagVars'));
    const oldTagsKeys = Object.keys(currentTags);
    const tagKeysToDelete = oldTagsKeys.filter(key => newTagsKeys.indexOf(key) < 0);
    if (tagKeysToDelete.length) {
      return tagKeysToDelete;
    }
    return null;
  }

  getTagsToSend(newTags, currentTags) {
    const newTagsKeys = Object.keys(newTags);
    const tagsToSend = {};
    let tagsToSendCount = 0;
    for (const key of newTagsKeys) {
      if (String(newTags[key]) !== String(currentTags[key])) {
        tagsToSend[key] = newTags[key];
        tagsToSendCount += 1;
      }
    }
    if (tagsToSendCount > 0) {
      return tagsToSend;
    }
    return null;
  }

  isHttps() {
    return isHttps();
  }

  isLoaded() {
    return (window.OneSignal && !Array.isArray(window.OneSignal));
  }

  reset() {
    deleteProperty(window, 'OneSignal');
  }

  enrichDigitalData() {
    window.OneSignal.push(() => {
      const pushNotification = this.digitalData.user.pushNotifications = {};
      const isSupported = window.OneSignal.isPushNotificationsSupported();
      pushNotification.isSupported = isSupported;
      if (isSupported) {
        window.OneSignal.push(['getNotificationPermission', (permission) => {
          switch (permission) {
          case 'granted':
            pushNotification.isSubscribed = true;
            window.OneSignal.push(['getUserId', (userId) => {
              pushNotification.userId = userId;
              this.onEnrich();
            }]);
            break;
          case 'denied':
            pushNotification.isSubscribed = false;
            pushNotification.isDenied = true;
            this.onEnrich();
            break;
          default:
            pushNotification.isSubscribed = false;
            this.onEnrich();
            break;
          }
        }]);
      } else {
        this.onEnrich();
      }
    });
  }

  sendTagsUpdate(event) {
    this.onGetTags((currentTags) => {
      const newTags = this.extractTagValuesFromEvent(event);
      const tagsToDelete = this.getTagsToDelete(currentTags);
      const tagsToSend = this.getTagsToSend(newTags, currentTags);
      window.OneSignal.push(() => {
        if (tagsToSend) {
          window.OneSignal.sendTags(tagsToSend);
          Object.assign(this.currentTags, tagsToSend);
        }
        if (tagsToDelete) {
          window.OneSignal.deleteTags(tagsToDelete);
          for (const tagKeyToDelete of tagsToDelete) {
            deleteProperty(this.currentTags, tagKeyToDelete);
          }
        }
      });
    });
  }

  trackEvent(event) {
    if (event.name === VIEWED_PAGE || event.name === SUBSCRIBED) {
      const user = event.user;
      if (user && user.email) {
        window.OneSignal.push(function() {
          window.OneSignal.syncHashedEmail(user.email);
        });
      }
    }

    if (event.name === this.getOption('pushSubscriptionTriggerEvent')) {
      window.OneSignal.push(['registerForPushNotifications']);
      this.sendTagsUpdate(event);
    } else if (semanticEvents.indexOf(event.name) >= 0) {
      this.sendTagsUpdate(event);
    }
  }
}

export default OneSignal;
