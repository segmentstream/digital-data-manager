const currentCategory = {
  id: '2',
  name: 'Headwear'
}

const currentProduct = {
  id: '123',
  name: 'Hat',
  price: 100,
  brand: 'DB'
}

const basketProducts = [
  {
    brand: 'DB',
    categoryId: '2',
    categoryName: 'Headwear',
    id: '123',
    name: 'Hat',
    price: 100,
    quantity: 2
  },
  {
    brand: 'DB',
    categoryId: '1',
    categoryName: 'Shirts',
    id: '124',
    name: 'Shirt',
    price: 300,
    quantity: 1
  }
]

const onViewedProductPageStub = {
  in: {
    id: '123',
    name: 'Hat',
    unitSalePrice: 100,
    manufacturer: 'DB',
    categoryId: '2',
    category: ['Accessories', 'Headwear']
  },
  out: {
    user: {
      email: 'test@test.com'
    },
    currentCategory,
    currentProduct,
    basketProducts,
    pageType: 2
  }
}

export {
  onViewedProductPageStub
}
