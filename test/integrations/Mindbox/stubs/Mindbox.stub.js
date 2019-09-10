export const options = {
  projectSystemName: 'Test',
  brandSystemName: 'drivebackru',
  pointOfContactSystemName: 'test-services.mindbox.ru',
  projectDomain: 'test.com',
  userIdProvider: 'TestWebsiteId',
  endpointId: 'endpointId'
}

export const webPushWithCustomServiceWorkerOptions = {
  webpush: true,
  useCustomServiceWorkerPath: true,
  serviceWorkerPath: '/my-folder/mindbox-services-worker.js',
  pushSubscriptionTriggerEvent: 'Viewed Page'
}

export const webPushWithCustomServiceWorkerScopeOptions = {
  webpush: true,
  useCustomServiceWorkerPath: true,
  serviceWorkerPath: '/my-folder/mindbox-services-worker.js',
  serviceWorkerScope: '/my-folder/',
  pushSubscriptionTriggerEvent: 'Viewed Page'
}

export const expectedInitOptions = {
  projectSystemName: 'Test',
  brandSystemName: 'drivebackru',
  pointOfContactSystemName: 'test-services.mindbox.ru',
  projectDomain: 'test.com',
  firebaseMessagingSenderId: '',
  serviceWorkerPath: '/my-folder/mindbox-services-worker.js'
}

export const expectedInitOptionsWithServiceWorkerScope = {
  projectSystemName: 'Test',
  brandSystemName: 'drivebackru',
  pointOfContactSystemName: 'test-services.mindbox.ru',
  projectDomain: 'test.com',
  firebaseMessagingSenderId: '',
  serviceWorkerPath: '/my-folder/mindbox-services-worker.js',
  serviceWorkerScope: '/my-folder/'
}
