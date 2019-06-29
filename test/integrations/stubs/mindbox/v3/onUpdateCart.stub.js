const onUpdateCartSetCartStub = {
  operation: 'SetCart',
  data: {
    productList: [
      {
        product: {
          ids: {
            exampleId: '123'
          },
          sku: {
            ids: {
              exampleSku: 'sku123'
            }
          }
        },
        count: 2,
        price: 2000
      },
      {
        product: {
          ids: {
            exampleId: '234'
          },
          sku: {
            ids: {
              exampleSku: 'sku234'
            }
          }
        },
        count: 1,
        price: 1000
      }
    ]
  }
}

export { onUpdateCartSetCartStub }
