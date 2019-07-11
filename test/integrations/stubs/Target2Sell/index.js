const productStub = {
  in: {
    id: '123',
    skuCode: '1234'
  },
  out: '123',
  outGroupedFeed: '1234'
}

const lineItemsStub = {
  in: [
    {
      product: {
        id: '123',
        skuCode: '1234'
      },
      subtotal: 400,
      quantity: 1
    },
    {
      product: {
        id: '124',
        skuCode: '1245'
      },
      subtotal: 600,
      quantity: 2
    }
  ],
  out: '123|124',
  outGroupedFeed: '1234|1245',
  outSubtotals: '400|600',
  outQuantities: '1|2'
}

const listingItemsStub = {
  in: [
    {
      id: '123',
      skuCode: '1234'
    },
    {
      id: '124',
      skuCode: '1245'
    },
    {
      id: '125',
      skuCode: '1256'
    }
  ],
  out: '123|124|125',
  outGroupedFeed: '1234|1245|1256'
}

export default {
  productStub,
  lineItemsStub,
  listingItemsStub
}
