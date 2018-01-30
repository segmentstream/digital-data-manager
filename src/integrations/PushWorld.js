import cookie from 'js-cookie';
import Integration from './../Integration';

class PushWorld extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      domain: undefined,
      platformCode: undefined,
    }, options);

    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: `https://${options.domain}.push.world/embed.js`,
      },
    });
  }

  initialize() {
    window.pw = {
      websiteId: this.getOption('platformCode'),
      date: Date.now(),
    };
    this.enrichDigitalData();
    document.addEventListener('pw:subscribe:allow', (event) => {
      this.digitalData.changes.push(['user.pushNotifications.isSubscribed', true]);
      this.digitalData.changes.push(['user.pushNotifications.userId', event.detail.device_id]);
    }, false);
    document.addEventListener('pw:subscribe:deny', () => {
      this.digitalData.changes.push(['user.pushNotifications.isDenied', true]);
    }, false);
  }

  enrichDigitalData() {
    const status = cookie.get(`pw_status_${this.getOption('platformCode')}`);
    let isSubscribed = false;
    switch (status) {
      case 'allow':
        isSubscribed = true;
        this.digitalData.changes.push(['user.pushNotifications.userId', cookie.get('pw_deviceid')]);
        break;
      case 'deny':
        this.digitalData.changes.push(['user.pushNotifications.isDenied', true]);
        break;
      default:
        break;
    }
    this.digitalData.changes.push(['user.pushNotifications.isSubscribed', isSubscribed]);
  }
}

export default PushWorld;
