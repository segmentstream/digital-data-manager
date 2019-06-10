const basketProducts = [
  {
    brand: 'DB',
    categoryId: '2',
    categoryName: 'Headwear',
    id: '123',
    name: 'Hat',
    price: 100,
    quantity: 2,
  },
  {
    brand: 'DB',
    categoryId: '1',
    categoryName: 'Shirts',
    id: '124',
    name: 'Shirt',
    price: 300,
    quantity: 1,
  },
];

const onViewedHomePageAuthorizedStub = {
  user: {
    email: 'test@test.com',
  },
  basketProducts,
  pageType: 1,
};

const onViewedHomePageUnauthorizedStub = {
  user: undefined,
  basketProducts,
  pageType: 1,
};

export {
  onViewedHomePageUnauthorizedStub,
  onViewedHomePageAuthorizedStub,
};
