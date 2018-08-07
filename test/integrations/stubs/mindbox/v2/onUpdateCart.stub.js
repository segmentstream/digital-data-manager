const onUpdateCartSetCartStub = {
  operation: 'SetCart',
  data: {
    action: {
      personalOffers: [
        {
          productId: '123',
          count: 2,
          price: 2000,
        },
        {
          productId: '234',
          count: 1,
          price: 1000,
        },
      ],
    },
  },
};

export { onUpdateCartSetCartStub };
