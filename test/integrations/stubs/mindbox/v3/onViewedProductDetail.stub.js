const onViewedProductDetailViewProductStub = {
  operation: 'ViewProduct',
  data: {
    product: {
      ids: {
        bitrixId: '123',
      },
    },
  },
};

const onViewedProductDetailViewProductSkuStub = {
  operation: 'ViewProduct',
  data: {
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
  },
};

const onViewedProductDetailViewedProductCustomStub = {
  operation: 'ViewedProductCustom',
  data: {
    product: {
      ids: {
        bitrixId: '123',
      },
    },
  },
};

export {
  onViewedProductDetailViewProductStub,
  onViewedProductDetailViewProductSkuStub,
  onViewedProductDetailViewedProductCustomStub,
};
