const onAddedProductAddProductStub = {
  operation: 'AddProduct',
  data: {
    action: {
      productId: '123',
      price: 2500
    }
  }
}

const onAddedProductAddProductSkuStub = {
  operation: 'AddProduct',
  data: {
    action: {
      productId: '123',
      skuId: 'sku123',
      price: 2500
    }
  }
}

const onAddedProductAddProductCustomStub = {
  operation: 'AddProductCustom',
  data: {
    action: {
      productId: '123',
      price: 2500
    }
  }
}

export {
  onAddedProductAddProductStub,
  onAddedProductAddProductSkuStub,
  onAddedProductAddProductCustomStub
}
