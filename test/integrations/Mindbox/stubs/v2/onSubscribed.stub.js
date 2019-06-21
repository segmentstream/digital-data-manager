const onSubscribedSubscribedStub = {
  operation: 'EmailSubscribe',
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
        pointOfContact: 'Email'
      }
    ]
  }
}

const onSubscribedEmailSubscribeCustomStub = {
  operation: 'EmailSubscribeCustom',
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
        pointOfContact: 'Email'
      }
    ]
  }
}

export { onSubscribedSubscribedStub, onSubscribedEmailSubscribeCustomStub }
