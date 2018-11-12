import Integration from '../Integration';

class JivoChat extends Integration {
  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      widgetId: '',
    }, options);
    super(digitalData, optionsWithDefaults);

    this.addTag({
      type: 'script',
      attr: {
        src: `//code.jivosite.com/script/widget/${options.widgetId};`,
      },
    });
  }

  isLoaded() {
    return !!window.jivo_version;
  }
}

export default JivoChat;
