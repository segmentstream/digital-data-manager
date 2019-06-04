// --------------------------------------------------------------------------------
// Transactions
// --------------------------------------------------------------------------------

function getCompletedTransactionStub() {
  return {
    orderId: '123',
    sapOrderId: 'sap123',
    subtotal: 340,
    total: 420,
    tax: 80,
    shippingCost: 50,
    currency: 'RUB',
    lineItems: [
      {
        product: {
          id: 'product123',
          unitSalePrice: 100,
          unitPrice: 100,
        },
        quantity: 1,
      },
      {
        product: {
          id: 'product567',
          unitSalePrice: 120,
          unitPrice: 150,
        },
        quantity: 2,
      },
    ],
    shippingMethod: 'Courier',
    paymentMethod: 'Card',
    customField: 'test',
  };
}

const onCompletedTransactionTransactionStub = getCompletedTransactionStub();

const onCompletedTransactionTransactionVoucherStub = getCompletedTransactionStub();
onCompletedTransactionTransactionVoucherStub.vouchers = ['coupon'];
const discountedValue = 44;
onCompletedTransactionTransactionVoucherStub.voucherDiscount = discountedValue;
onCompletedTransactionTransactionVoucherStub.total -= discountedValue;


const onCompletedTransactionTransactionSkuStub = getCompletedTransactionStub();
onCompletedTransactionTransactionSkuStub.lineItems[0].product.skuCode = 'sku123';
onCompletedTransactionTransactionSkuStub.lineItems[1].product.skuCode = 'sku234';

// --------------------------------------------------------------------------------
// order checkout objects
// --------------------------------------------------------------------------------
function getCheckoutObjectStub() {
  return {
    operation: 'CompletedOrder',
    data: {
      customer: {
        ids: {
          bitrixId: 'user123',
        },
        email: 'test@driveback.ru',
        mobilePhone: '+70000000000',
      },
      order: {
        deliveryCost: onCompletedTransactionTransactionStub.shippingCost,
        totalPrice: onCompletedTransactionTransactionStub.total,

        lines: [
          {
            product: {
              ids: {
                bitrixId: 'product123',
              },
            },
            quantity: 1,
            basePricePerItem: 100,
          },
          {
            product: {
              ids: {
                bitrixId: 'product567',
              },
            },
            quantity: 2,
            basePricePerItem: 150,
          },
        ],

        payments: [
          {
            type: onCompletedTransactionTransactionStub.paymentMethod,
            amount: onCompletedTransactionTransactionStub.total,
          },
        ],
        area: {
          ids: {
            externalId: 'region123',
          },
        },
        ids: {
          bitrixId: onCompletedTransactionTransactionStub.orderId,
          sapId: onCompletedTransactionTransactionStub.sapOrderId,
        },
        customFields: {
          oneMoreField: 'test',
        },
      },
    },
  };
}


const onCompletedTransactionCheckoutOperationStub = getCheckoutObjectStub();

const onCompletedTransactionCheckoutOperationVoucherStub = getCheckoutObjectStub();

const onCompletedTransactionCheckoutCustomOperationStub = getCheckoutObjectStub();
onCompletedTransactionCheckoutCustomOperationStub.operation = 'CompletedOrderCustom';
onCompletedTransactionCheckoutCustomOperationStub.data.order.lines[0].product.sku = {
  ids: {
    bitrixId: 'sku123',
  },
};
onCompletedTransactionCheckoutCustomOperationStub.data.order.lines[1].product.sku = {
  ids: {
    bitrixId: 'sku234',
  },
};
onCompletedTransactionCheckoutCustomOperationStub.data.customer = {
  ids: onCompletedTransactionCheckoutOperationStub.data.customer.ids,
};

export {
  onCompletedTransactionTransactionStub,
  onCompletedTransactionTransactionVoucherStub,
  onCompletedTransactionTransactionSkuStub,

  onCompletedTransactionCheckoutOperationStub,
  onCompletedTransactionCheckoutCustomOperationStub,
  onCompletedTransactionCheckoutOperationVoucherStub,
};
