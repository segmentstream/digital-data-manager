const onRegisteredRegistrationStub = {
  operation: 'Registration',
  identificator: {
    provider: 'email',
    identity: 'test@driveback.ru'
  },
  data: {
    email: 'test@driveback.ru',
    firstName: 'John',
    lastName: 'Dow'
  }
}

const onRegisteredRegistrationCustomStub = {
  operation: 'RegistrationCustom',
  identificator: {
    provider: 'email',
    identity: 'test@driveback.ru'
  },
  data: {
    email: 'test@driveback.ru',
    firstName: 'John',
    lastName: 'Dow'
  }
}

const onRegisteredRegistrationAndSubscriptionLegacyStub = {
  operation: 'Registration',
  identificator: {
    provider: 'email',
    identity: 'test@driveback.ru'
  },
  data: {
    email: 'test@driveback.ru',
    firstName: 'John',
    lastName: 'Dow',
    subscriptions: [
      {
        pointOfContact: 'Email',
        isSubscribed: true,
        valueByDefault: true
      },
      {
        pointOfContact: 'Sms',
        isSubscribed: true,
        valueByDefault: true
      }
    ]
  }
}

const onRegisteredRegistrationAndSubscriptionStub = {
  operation: 'Registration',
  identificator: {
    provider: 'email',
    identity: 'test@driveback.ru'
  },
  data: {
    email: 'test@driveback.ru',
    firstName: 'John',
    lastName: 'Dow'
  }
}
const onRegisteredUpdateProfileSubscriptionOnLegacyStub = {
  operation: 'UpdateProfile',
  identificator: {
    provider: 'email',
    identity: 'test@driveback.ru'
  },
  data: {
    email: 'test@driveback.ru',
    firstName: 'John',
    lastName: 'Dow',
    authenticationTicket: 'xxxxx',
    subscriptions: [
      {
        pointOfContact: 'Email',
        isSubscribed: true
      },
      {
        pointOfContact: 'Sms',
        isSubscribed: true
      }
    ]
  }
}
const onRegisteredUpdateProfileSubscriptionOnStub = {
  operation: 'UpdateProfile',
  identificator: {
    provider: 'email',
    identity: 'test@driveback.ru'
  },
  data: {
    email: 'test@driveback.ru',
    firstName: 'John',
    lastName: 'Dow',
    authenticationTicket: 'xxxxx'
  }
}
const onRegisteredUpdateProfileSubscriptionOffStub = {
  operation: 'UpdateProfile',
  identificator: {
    provider: 'email',
    identity: 'test@driveback.ru'
  },
  data: {
    email: 'test@driveback.ru',
    firstName: 'John',
    lastName: 'Dow'
  }
}

export {
  onRegisteredRegistrationStub,
  onRegisteredRegistrationCustomStub,
  onRegisteredRegistrationAndSubscriptionStub,
  onRegisteredRegistrationAndSubscriptionLegacyStub,
  onRegisteredUpdateProfileSubscriptionOnStub,
  onRegisteredUpdateProfileSubscriptionOnLegacyStub,
  onRegisteredUpdateProfileSubscriptionOffStub
}
