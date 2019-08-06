const onCompletedTransactionStub = {
  in: {
    lineItems: [
      {
        product: {
          id: '123',
          skuCode: 'sku123',
          unitSalePrice: 100
        },
        quantity: 1
      },
      {
        product: {
          id: '234',
          skuCode: 'sku234',
          unitPrice: 100,
          unitSalePrice: 50
        },
        quantity: 2
      },
      {
        product: {
          id: '345',
          skuCode: 'sku345',
          unitPrice: 30
        }
      },
      {
        product: {
          id: '456',
          skuCode: 'sku456'
        }
      }
    ],
    orderId: '123',
    isFirst: true,
    total: 230
  },
  out: ['123', '234', '345', '456'],
  outGroupedFeed: ['sku123', 'sku234', 'sku345', 'sku456'],
  outTotal: 230
}

export {
  onCompletedTransactionStub
}
