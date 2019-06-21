const onSubscribedEmailSubscribeStub = {
  operation: 'EmailSubscribe',
  data: {
    customer: {
      email: 'test@driveback.ru',
      firstName: 'John',
      lastName: 'Dow',
      customFields: {
        source: 'Driveback'
      },
      area: {
        ids: {
          externalId: 'region123'
        }
      },
      subscriptions: [
        {
          pointOfContact: 'Email'
        }
      ]
    }
  }
}

const onSubscribedEmailSubscribeCustomStub = {
  operation: 'EmailSubscribeCustom',
  data: {
    customer: {
      email: 'test@driveback.ru',
      firstName: 'John',
      lastName: 'Dow',
      customFields: {
        source: 'Driveback'
      },
      subscriptions: [
        {
          pointOfContact: 'Email'
        }
      ]
    }
  }
}

const onSubscribedEmailSubscribeAlterCustomStub = {
  operation: 'EmailSubscribeCustom',
  data: {
    customer: {
      email: 'test@driveback.ru',
      firstName: 'John',
      lastName: 'Dow',
      mobilePhone: '111111111',
      subscriptions: [
        {
          pointOfContact: 'Email',
          topic: 'News'
        },
        {
          pointOfContact: 'Email',
          topic: 'Special Offers'
        },
        {
          pointOfContact: 'Sms',
          topic: 'Special Offers'
        }
      ]
    },
    pointOfContact: 'Footer Form'
  }
}

export {
  onSubscribedEmailSubscribeStub,
  onSubscribedEmailSubscribeCustomStub,
  onSubscribedEmailSubscribeAlterCustomStub
}
