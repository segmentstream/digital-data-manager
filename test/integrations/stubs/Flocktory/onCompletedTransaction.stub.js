const onCompletedTransactionStub = {
  in: {
    orderId: '123',
    total: 20000,
    currency: 'USD',
    lineItems: [
      {
        product: {
          id: '123',
          name: 'Test Product',
          category: 'Category 1',
          currency: 'USD',
          unitSalePrice: 10000,
          imageUrl: '/1.jpg'
        },
        quantity: 1,
        subtotal: 10000
      },
      {
        product: {
          id: '234',
          name: 'Test Product 2',
          category: 'Category 1',
          currency: 'USD',
          unitSalePrice: 5000,
          imageUrl: '/2.jpg'
        },
        quantity: 2,
        subtotal: 10000
      }
    ]
  },
  out: {
    id: '123',
    items: [
      {
        id: '123',
        title: 'Test Product',
        price: 10000,
        image: '/1.jpg',
        count: 1
      },
      {
        id: '234',
        title: 'Test Product 2',
        price: 5000,
        image: '/2.jpg',
        count: 2
      }
    ],
    price: 20000
  }
}

export {
  onCompletedTransactionStub
}
