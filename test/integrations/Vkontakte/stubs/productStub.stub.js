const productStub = {
  in: {
    id: '123',
    unitPrice: 100,
    unitSalePrice: 90,
    currency: 'USD'
  },
  out: {
    products: [
      {
        id: '123',
        price_old: 100,
        price: 90
      }
    ],
    total_price: 90,
    currency_code: 'USD'
  }
}

export default productStub
