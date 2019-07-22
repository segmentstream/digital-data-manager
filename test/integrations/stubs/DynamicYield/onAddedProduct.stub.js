const onAddedProductStub = {
  in: {
    cart: {
      total: 100,
      currency: 'RUB',
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
    product: {
      id: '125'
    }
  },
  out: {
    name: 'Add to Cart',
    properties: {
      dyType: 'add-to-cart-v1',
      value: 100,
      currency: 'RUB',
      productId: '125',
      quantity: 2,
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
  onAddedProductStub
}
