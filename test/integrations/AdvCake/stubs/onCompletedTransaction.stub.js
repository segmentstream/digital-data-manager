const onCompletedTransactionStub = {
  in: {
    orderId: '123',
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
      }
    ],
    total: 200
  },
  out: {
    orderInfo: {
      id: '123',
      totalPrice: 200
    },
    basketProducts: [
      {
        id: '123',
        name: 'Hat',
        price: 100,
        quantity: 2,
        categoryId: '2',
        categoryName: 'Headwear',
        brand: 'DB'
      }
    ],
    pageType: 6
  }
}

export {
  onCompletedTransactionStub
}
