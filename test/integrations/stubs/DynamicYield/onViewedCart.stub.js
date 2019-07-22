const onViewedCartStub = {
  in: {
    lineItems: [
      {
        product: {
          id: '123'
        }
      },
      {
        product: {
          id: '124'
        }
      }
    ]
  },
  out: ['123', '124']
}

export {
  onViewedCartStub
}
