const onViewedProductDetailStub = {
  in: {
    id: '123',
    name: 'Test Product',
    category: ['Category 1', 'Subcategory 1'],
    currency: 'USD',
    unitSalePrice: 10000
  },
  out: {
    content_ids: ['123'],
    content_type: 'product',
    content_name: 'Test Product',
    content_category: 'Category 1/Subcategory 1',
    paramExample: 'example'
  },
  outWithValue: {
    content_ids: ['123'],
    content_type: 'product',
    content_name: 'Test Product',
    content_category: 'Category 1/Subcategory 1',
    value: 10000,
    currency: 'USD',
    paramExample: 'example'
  }
}

const onViewedProductDetailStubLegacy = {
  in: {
    id: '123',
    name: 'Test Product',
    category: 'Category 1',
    currency: 'USD',
    unitSalePrice: 10000
  },
  out: {
    content_ids: ['123'],
    content_type: 'product',
    content_name: 'Test Product',
    content_category: 'Category 1',
    paramExample: 'example'
  }
}

const onViewedProductDetailStubLegacySubcategory = {
  in: {
    id: '123',
    name: 'Test Product',
    category: 'Category 1',
    subcategory: 'Subcategory 1',
    currency: 'USD',
    unitSalePrice: 10000
  },
  out: {
    content_ids: ['123'],
    content_type: 'product',
    content_name: 'Test Product',
    content_category: 'Category 1/Subcategory 1',
    paramExample: 'example'
  }
}

export {
  onViewedProductDetailStub,
  onViewedProductDetailStubLegacy,
  onViewedProductDetailStubLegacySubcategory
}
