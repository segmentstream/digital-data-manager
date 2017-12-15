import Integration from './../Integration';

class PushWorld extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      namespace: undefined,
      sessionStreaming: false,
      sessionIdDimension: undefined,
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
    this.enrichDigitalData();
  }

  enrichDigitalData() {
    const statusCookie = 'pw_status_'
    const isSubscribed;
    this.digitalData.changes.push(['user.pushNotifications.isSubscribed', isSubscribed]);
  }
}

export default PushWorld;
