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
          unitSalePrice: 10000
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
          unitSalePrice: 5000
        },
        quantity: 2,
        subtotal: 10000
      }
    ]
  },
  out: {
    content_ids: ['123', '234'],
    content_type: 'product',
    currency: 'USD',
    value: 20000,
    paramExample: 'example'
  }
}

export {
  onCompletedTransactionStub
}
