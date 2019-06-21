const onRemovedProductRemoveProductStub = {
  operation: 'RemoveProduct',
  data: {
    action: {
      productId: '123',
      price: 2500
    }
  }
}

const onRemovedProductAddProductCustomStub = {
  operation: 'AddProductCustom',
  data: {
    action: {
      productId: '123',
      price: 2500
    }
  }
}

export { onRemovedProductRemoveProductStub, onRemovedProductAddProductCustomStub }
