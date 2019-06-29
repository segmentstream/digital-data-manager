const cartStub = {
  lineItems: [
    {
      product: {
        id: '123',
        name: 'Hat',
        unitSalePrice: 100,
        manufacturer: 'DB',
        categoryId: '2',
        category: ['Accessories', 'Headwear']
      },
      quantity: 2,
      subtotal: 200
    },
    {
      product: {
        id: '124',
        name: 'Shirt',
        unitSalePrice: 300,
        manufacturer: 'DB',
        categoryId: '1',
        category: ['Tops', 'Shirts']
      },
      quantity: 1,
      subtotal: 300
    }
  ]
}

export default cartStub
