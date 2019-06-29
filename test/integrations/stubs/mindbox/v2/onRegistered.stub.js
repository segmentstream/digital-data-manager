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

const onRegisteredRegistrationAndSubscriptionStub = {
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
const onRegisteredUpdateProfileSubscriptionOffStub = {
  operation: 'UpdateProfile',
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
        isSubscribed: false
      },
      {
        pointOfContact: 'Sms',
        isSubscribed: false
      }
    ]
  }
}

export {
  onRegisteredRegistrationStub,
  onRegisteredRegistrationCustomStub,
  onRegisteredRegistrationAndSubscriptionStub,
  onRegisteredUpdateProfileSubscriptionOnStub,
  onRegisteredUpdateProfileSubscriptionOffStub
}
