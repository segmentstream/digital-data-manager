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

const onViewedCartPageStub = {
  user: undefined,
  basketProducts,
  pageType: 4,
};

export {
  onViewedCartPageStub,
};
