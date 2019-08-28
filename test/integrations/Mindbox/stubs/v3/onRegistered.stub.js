const onRegisteredUserStub = {
  userId: 'user123',
  authenticationTicket: 'xxxxx',
  email: 'test@driveback.ru',
  phone: '79374134389',
  firstName: 'John',
  lastName: 'Dow',
  childrenNames: ['Helen', 'Bob'],
  city: 'Moscow',
  b2b: true
}

const onRegisteredRegistrationStub = {
  operation: 'Registration',
  data: {
    customer: {
      ids: {
        bitrixId: 'user123'
      },
      firstName: 'John',
      lastName: 'Dow',
      email: 'test@driveback.ru',
      mobilePhone: '79374134389',
      customFields: {
        source: 'Driveback',
        city: 'Moscow',
        b2b: true,
        childrenNames: [
          'Helen',
          'Bob'
        ]
      }
    }
  }
}

const onRegisteredRegistrationCustomStub = {
  operation: 'RegistrationCustom',
  data: {
    customer: {
      ids: {
        bitrixId: 'user123'
      },
      firstName: 'John',
      lastName: 'Dow',
      email: 'test@driveback.ru',
      mobilePhone: '79374134389',
      customFields: {
        source: 'Driveback',
        city: 'Moscow',
        b2b: true,
        childrenNames: [
          'Helen',
          'Bob'
        ]
      }
    }
  }
}

const onRegisteredRegistrationWithSubscriptionLegacyStub = {
  operation: 'Registration',
  data: {
    customer: {
      ids: {
        bitrixId: 'user123'
      },
      firstName: 'John',
      lastName: 'Dow',
      email: 'test@driveback.ru',
      mobilePhone: '79374134389',
      customFields: {
        source: 'Driveback',
        city: 'Moscow',
        b2b: true,
        childrenNames: [
          'Helen',
          'Bob'
        ]
      },
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
}

const onRegisteredRegistrationWithSubscriptionStub = {
  operation: 'Registration',
  data: {
    customer: {
      ids: {
        bitrixId: 'user123'
      },
      firstName: 'John',
      lastName: 'Dow',
      email: 'test@driveback.ru',
      mobilePhone: '79374134389',
      customFields: {
        source: 'Driveback',
        city: 'Moscow',
        b2b: true,
        childrenNames: [
          'Helen',
          'Bob'
        ]
      }
    }
  }
}

const onRegisteredRegistrationWithMassSubscriptionsStub = {
  operation: 'Registration',
  data: {
    customer: {
      ids: {
        bitrixId: 'user123'
      },
      firstName: 'John',
      lastName: 'Dow',
      email: 'test@driveback.ru',
      mobilePhone: '79374134389',
      customFields: {
        source: 'Driveback',
        city: 'Moscow',
        b2b: true,
        childrenNames: [
          'Helen',
          'Bob'
        ]
      },
      subscriptions: [
        {
          pointOfContact: 'Email',
          topic: 'News',
          isSubscribed: true,
          valueByDefault: true
        },
        {
          pointOfContact: 'Email',
          topic: 'Offers',
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
}

export {
  onRegisteredUserStub,
  onRegisteredRegistrationStub,
  onRegisteredRegistrationCustomStub,
  onRegisteredRegistrationWithSubscriptionStub,
  onRegisteredRegistrationWithMassSubscriptionsStub,
  onRegisteredRegistrationWithSubscriptionLegacyStub
}
