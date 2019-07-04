const onAddedProductToWishlistStub = {
  in: {
    id: '123',
    name: 'Test Product',
    category: ['Category 1', 'Subcategory 1']
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
  onAddedProductToWishlistStub
}
