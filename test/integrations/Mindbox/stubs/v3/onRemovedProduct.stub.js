const onRemovedProductMappedRemoveProductStub = {
  operation: 'RemoveProduct',
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
      price: 1000
    }
  }
}

export {
  onRemovedProductMappedRemoveProductStub
}
