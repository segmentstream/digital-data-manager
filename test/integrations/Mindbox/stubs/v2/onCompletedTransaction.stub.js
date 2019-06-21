function getCompletedOrderStub () {
  return {
    operation: 'CompletedOrder',
    identificator: {
      provider: 'TestWebsiteId',
      identity: 'user123'
    },
    data: {
      order: {
        webSiteId: '123',
        price: 5000,
        deliveryType: 'Courier',
        paymentType: 'Visa',
        items: [
          {
            productId: '123',
            skuId: 'sku123',
            quantity: 1,
            price: 100
          },
          {
            productId: '234',
            skuId: 'sku234',
            quantity: 2,
            price: 150
          }
        ]
      }
    }
  }
}

const onCompletedTransactionCompletedOrderStub = getCompletedOrderStub()

const onCompletedTransactionCompletedOrderCustomStub = getCompletedOrderStub()
onCompletedTransactionCompletedOrderCustomStub.operation = 'CompletedOrderCustom'

export { onCompletedTransactionCompletedOrderStub, onCompletedTransactionCompletedOrderCustomStub }
