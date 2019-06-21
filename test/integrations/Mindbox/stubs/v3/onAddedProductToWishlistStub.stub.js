const onAddedProductToWishlistStub = {
  operation: 'AddProductToWishlist',
  data: {
    addProductToList: {
      product: {
        ids: {
          testId: '123'
        },
        sku: {
          ids: {
            testSku: 'sku123'
          }
        }
      },
      price: 2500
    }
  }
}

export { onAddedProductToWishlistStub }
