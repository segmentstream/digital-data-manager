
const currentCategory = {
  id: '2',
  name: 'Headwear'
}

const products = [
  {
    id: '123',
    name: 'Hat',
    price: 100
  },
  {
    id: '125',
    name: 'Cap',
    price: 200
  }
]

const onViewedListingPageStub = {
  in: {
    category: ['Accessories', 'Headwear'],
    categoryId: '2',
    items: [
      {
        id: '123',
        name: 'Hat',
        unitSalePrice: 100
      },
      {
        id: '125',
        name: 'Cap',
        unitSalePrice: 200
      }
    ]
  },
  out: {
    user: undefined,
    currentCategory,
    products,
    pageType: 3,
    basketProducts: []
  }
}

export {
  onViewedListingPageStub
}
