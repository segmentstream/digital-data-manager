const cartStub = {
  in: {
    lineItems: [
      {
        product: {
          id: '123',
          unitPrice: 100,
          unitSalePrice: 90,
          currency: 'USD'
        },
        quantity: 2,
        subtotal: 180
      },
      {
        product: {
          id: '124',
          unitPrice: 200,
          unitSalePrice: 200,
          currency: 'USD'
        },
        quantity: 1,
        subtotal: 200
      }
    ],
    subtotal: 380,
    currency: 'USD'
  },
  out: {
    products: [
      {
        id: '123',
        price_old: 100,
        price: 90
      },
      {
        id: '124',
        price_old: 200,
        price: 200
      }
    ],
    total_price: 380,
    currency_code: 'USD'
  }
}

export default cartStub
