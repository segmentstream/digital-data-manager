const onRemovedProductFromWishlistStub = {
  operation: 'RemoveProductFromWishlist',
  data: {
    removeProductFromList: {
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

export { onRemovedProductFromWishlistStub }
