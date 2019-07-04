const onAddedProductStub = {
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
  }
}

const onAddedProductStubLegacy = {
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

const onAddedProductStubLegacySubcategory = {
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
  onAddedProductStub,
  onAddedProductStubLegacy,
  onAddedProductStubLegacySubcategory
}
