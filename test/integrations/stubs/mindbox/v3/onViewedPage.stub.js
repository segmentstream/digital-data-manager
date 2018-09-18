const onViewedPageCartStub = {
  lineItems: [
    {
      product: {
        id: '123',
        unitSalePrice: 1000,
        skuCode: 'sku123',
      },
      quantity: 2,
    },
    {
      product: {
        id: '234',
        unitSalePrice: 1000,
        skuCode: 'sku234',
      },
      quantity: 1,
    },
  ],
};

const productList = [
  {
    product: {
      ids: {
        bitrixId: '123',
      },
      sku: {
        ids: {
          bitrixId: 'sku123',
        },
      },
    },
    count: 2,
    price: 2*1000,
  },
  {
    product: {
      ids: {
        bitrixId: '234',
      },
      sku: {
        ids: {
          bitrixId: 'sku234',
        },
      },
    },
    count: 1,
    price: 1000,

  },
];

const onViewedPageSetCartUnauthorizedStub = {
  operation: 'SetCart',
  data: {
    productList,
  },
};

const onViewedPageSetCartAuthorizedStub = {
  operation: 'SetCart',
  data: {
    customer: {
      ids: {
        bitrixId: 'user123',
      },
    },
    productList,
  },
};

export {
  onViewedPageSetCartUnauthorizedStub,
  onViewedPageSetCartAuthorizedStub,
  onViewedPageCartStub,
};
