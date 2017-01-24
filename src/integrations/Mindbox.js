import hmacSha512 from 'crypto-js/hmac-sha512';
import Integration from './../Integration.js';

function generateMessageById(systemName, identity) {
  const time = new Date;
  const formattedTime = time.toISOString().split('.')[0].replace('T', ' ');
  const message = `EmailAuthenticationHex|${identity}|${formattedTime}`;

  return message;
}

function generateMessageByEmail(email) {
  const time = new Date;
  const formattedTime = time.toISOString().split('.')[0].replace('T', ' ');
  const message = `EmailAuthenticationHex|${email}|${formattedTime}`;

  return message;
}

function generateMessageByPhone(phone) {
  const time = new Date;
  const formattedTime = time.toISOString().split('.')[0].replace('T', ' ');
  const message = `MobilePhoneAuthenticationHex|${phone}|${formattedTime}`;

  return message;
}

class Mindbox extends Integration {

  constructor(digitalData, options) {
    const optionsWithDefaults = Object.assign({
      projectSystemName: '',
      brandSystemName: '',
      pointOfContactSystemName: '',
      projectDomain: '',
      serviceKey: '',
    }, options);

    super(digitalData, optionsWithDefaults);

    const src = '//tracker.directcrm.ru/scripts/v1/tracker.js?v=' + Math.random();
    this.addTag({
      type: 'script',
      attr: {
        async: 1,
        src: src,
      },
    });

    this._isLoaded = false;
  }

  initialize() {
    this._isLoaded = true;
    this.onLoad();
  }
}

export default Mindbox;
