import sha256 from 'crypto-js/sha256'

const userStub = {
  in: {
    userId: '555',
    email: 'test@mail.com'
  },
  outLoggedIn: {
    name: 'Login',
    properties: {
      dyType: 'login-v1',
      hashedEmail: sha256('test@mail.com'),
      cuid: '555',
      cuidType: 'userId'
    }
  },
  outRegistered: {
    name: 'Signup',
    properties: {
      dyType: 'signup-v1',
      hashedEmail: sha256('test@mail.com'),
      cuid: '555',
      cuidType: 'userId'
    }
  },
  outSubscribed: {
    name: 'Newsletter Subscription',
    properties: {
      dyType: 'newsletter-subscription-v1',
      hashedEmail: sha256('test@mail.com')
    }
  }
}

export {
  userStub
}
