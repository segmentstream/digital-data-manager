const onCompletedTransactionStub = {
  in: {
    orderId: '999',
    total: 100,
    currency: 'USD',
    lineItems: [
      {
        product: {
          id: '123',
          size: 'S',
          unitSalePrice: 25
        },
        quantity: 2
      },
      {
        product: {
          id: '124',
          size: 'M',
          unitSalePrice: 50
        },
        quantity: 1
      }
    ]
  },
  out: {
    name: 'Purchase',
    properties: {
      dyType: 'purchase-v1',
      uniqueTransactionId: '999',
      value: 100,
      currency: 'USD',
      cart: [
        {
          productId: '123',
          quantity: 2,
          itemPrice: 25,
          size: 'S'
        },
        {
          productId: '124',
          quantity: 1,
          itemPrice: 50,
          size: 'M'
        }
      ]
    }
  }
}

export {
  onCompletedTransactionStub
}
