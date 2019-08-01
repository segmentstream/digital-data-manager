const onAddedProductStub = {
  in: {
    id: '123',
    categoryId: '1',
    unitSalePrice: 100,
    manufacturer: 'DB'
  },
  out: {
    item: {
      id: '123',
      price: 100,
      count: 2,
      brand: 'DB',
      categoryId: '1'
    }
  }
}

export {
  onAddedProductStub
}
