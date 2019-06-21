const onUpdatedProfileInfoSubscriptionsStub = [
  {
    type: 'email',
    topic: 'News',
    isSubscribed: true
  },
  {
    type: 'email',
    topic: 'Offers',
    isSubscribed: false
  },
  {
    type: 'sms',
    isSubscribed: true
  }
]

const onUpdatedProfileInfoStub = {
  operation: 'UpdateProfile',
  data: {
    customer: {
      authenticationTicket: 'xxxxx',
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
          isSubscribed: true
        },
        {
          pointOfContact: 'Email',
          topic: 'Offers',
          isSubscribed: false
        },
        {
          pointOfContact: 'Sms',
          isSubscribed: true
        }
      ]
    }
  }
}

export { onUpdatedProfileInfoSubscriptionsStub, onUpdatedProfileInfoStub }
