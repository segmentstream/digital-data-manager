import Integration from './../Integration';
import deleteProperty from './../functions/deleteProperty';
import { getProp } from './../functions/dotProp';
import each from './../functions/each';
import after from './../functions/after';
import {
  VIEWED_PAGE,
  SUBSCRIBED,
} from './../events';
import { DIGITALDATA_VAR } from './../variableTypes';

function isHttps() {
  return (window.location.href.indexOf('https:') >= 0);
}

function clickListenerWorkaround() {
  function getDialogBody() {
    return document.querySelector('.onesignal-bell-launcher-dialog-body');
  }

  function getSubscribeButton() {
    return document.querySelector('#onesignal-bell-container .onesignal-bell-launcher #subscribe-button');
  }

  function getUnsubscribeButton() {
    return document.querySelector('#onesignal-bell-container .onesignal-bell-launcher #unsubscribe-button');
  }

  function onSubscribeButtonClicked() {
    window.OneSignal.event.trigger('notifyButtonSubscribeClick');
  }

  function onUnsubscribeButtonClicked() {
    window.OneSignal.event.trigger('notifyButtonUnsubscribeClick');
  }

  function onDialogBodyModified() {
    if (getSubscribeButton()) {
      getSubscribeButton().removeEventListener('click', onSubscribeButtonClicked);
      getSubscribeButton().addEventListener('click', onSubscribeButtonClicked);
    }
    if (getUnsubscribeButton()) {
      getUnsubscribeButton().removeEventListener('click', onUnsubscribeButtonClicked);
      getUnsubscribeButton().addEventListener('click', onUnsubscribeButtonClicked);
    }
  }

  function hookTreeModified() {
    if (getDialogBody()) {
      getDialogBody().addEventListener('DOMSubtreeModified', onDialogBodyModified);
    }
  }

  window.OneSignal = window.OneSignal || [];
  window.OneSignal.push(() => {
    window.OneSignal.once('notifyButtonLauncherClick', () => {
      hookTreeModified();
    });
  });
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

    this.SEMANTIC_EVENTS = [
      VIEWED_PAGE,
      SUBSCRIBED,
      this.getOption('pushSubscriptionTriggerEvent'),
    ];

    this.addTag('manifest', {
      type: 'link',
      attr: {
        rel: 'manifest',
        href: optionsWithDefaults.path.replace(/\/$/, '') + '/manifest.json',
      },
    });
    this.addTag({
      type: 'script',
      attr: {
        src: 'https://cdn.onesignal.com/sdks/OneSignalSDK.js',
      },
    });
  }

  getSemanticEvents() {
    if (this.initialized) {
      return this.SEMANTIC_EVENTS;
    }
    return [];
  }

  allowCustomEvents() {
    return false;
  }

  getEnrichableEventProps(event) {
    const enrichableProps = ['user.email'];

    if (this.SEMANTIC_EVENTS.indexOf(event.name) >= 0) {
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
    if (!this.getOption('subdomainName') && !isHttps()) {
      return;
    }

    window.OneSignal = window.OneSignal || [];

    if (this.getOption('notifyButton') && this.getOption('notifyButton').displayPredicate) {
      try {
        this.getOption('notifyButton').displayPredicate =
          Function(this.getOption('notifyButton').displayPredicate); // eslint-disable-line no-new-func
      } catch (e) {
        deleteProperty(this.getOption('notifyButton'), 'displayPredicate');
      }
    }

    if (this.getOption('notifyButton') && this.getOption('notifyButton').enable) {
      clickListenerWorkaround(); // temporary fix of notify bell click listener
    }

    if (this.getOption('path') && this.getOption('path') !== '/') {
      window.OneSignal.push(function() {
        // This registers the workers at the root scope, which is allowed by the HTTP header "Service-Worker-Allowed: /"
        window.OneSignal.SERVICE_WORKER_PARAM = { scope: '/' };
      });
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
    this.initialized = true;
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
        window.OneSignal.push(['getUserId', (userId) => {
          if (userId) { // This operation can only be performed after the user is subscribed
            window.OneSignal.syncHashedEmail(user.email);
          }
        }]);
      }
    }

    if (event.name === this.getOption('pushSubscriptionTriggerEvent')) {
      window.OneSignal.push(['registerForPushNotifications']);
      this.sendTagsUpdate(event);
    } else if (this.SEMANTIC_EVENTS.indexOf(event.name) >= 0) {
      this.sendTagsUpdate(event);
    }
  }
}

export default OneSignal;
