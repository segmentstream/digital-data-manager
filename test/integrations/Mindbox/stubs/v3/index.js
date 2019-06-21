import {
  onViewedPageSetCartUnauthorizedStub,
  onViewedPageSetCartAuthorizedStub,
  onViewedPageCartStub
} from './onViewedPage.stub'

import { onUpdateCartSetCartStub } from './onUpdateCart.stub'
import { onAddedProductMappedAddProductStub } from './onAddedProduct.stub'
import { onRemovedProductMappedRemoveProductStub } from './onRemovedProduct.stub'
import { onAddedProductToWishlistStub } from './onAddedProductToWishlistStub.stub'
import { onRemovedProductFromWishlistStub } from './onRemovedProductFromWishlistStub.stub'
import {
  onViewedProductDetailViewProductStub,
  onViewedProductDetailViewProductSkuStub,
  onViewedProductDetailViewedProductCustomStub
} from './onViewedProductDetail.stub'

import {
  onViewedProductListingCategoryViewStub,
  onViewedProductListingCategoryViewCustomStub
} from './onViewedProductListing.stub'

import {
  onCompletedTransactionTransactionStub,
  onCompletedTransactionTransactionVoucherStub,
  onCompletedTransactionTransactionSkuStub,

  onCompletedTransactionCheckoutOperationStub,
  onCompletedTransactionCheckoutCustomOperationStub,
  onCompletedTransactionCheckoutOperationVoucherStub
} from './onCompletedTransaction.stub'

import {
  onSubscribedEmailSubscribeStub,
  onSubscribedEmailSubscribeCustomStub,
  onSubscribedEmailSubscribeAlterCustomStub
} from './onSubscribed.stub'

import {
  onRegisteredUserStub,
  onRegisteredRegistrationStub,
  onRegisteredRegistrationCustomStub,
  onRegisteredRegistrationWithSubscriptionStub,
  onRegisteredRegistrationWithMassSubscriptionsStub
} from './onRegistered.stub'

import {
  onUpdatedProfileInfoSubscriptionsStub,
  onUpdatedProfileInfoStub
} from './onUpdatedProfileInfo.stub'

import { onLoggedInEnterWebsiteStub } from './onLoggedIn.stub'

export default {
  onViewedPageSetCartUnauthorizedStub,
  onViewedPageSetCartAuthorizedStub,
  onViewedPageCartStub,
  onUpdateCartSetCartStub,
  onAddedProductMappedAddProductStub,
  onRemovedProductMappedRemoveProductStub,
  onViewedProductDetailViewProductStub,
  onViewedProductDetailViewProductSkuStub,
  onViewedProductDetailViewedProductCustomStub,
  onViewedProductListingCategoryViewStub,
  onViewedProductListingCategoryViewCustomStub,

  onCompletedTransactionTransactionStub,
  onCompletedTransactionTransactionVoucherStub,
  onCompletedTransactionTransactionSkuStub,

  onCompletedTransactionCheckoutOperationStub,
  onCompletedTransactionCheckoutCustomOperationStub,
  onCompletedTransactionCheckoutOperationVoucherStub,

  onSubscribedEmailSubscribeStub,
  onSubscribedEmailSubscribeCustomStub,
  onSubscribedEmailSubscribeAlterCustomStub,

  onRegisteredUserStub,
  onRegisteredRegistrationStub,
  onRegisteredRegistrationCustomStub,
  onRegisteredRegistrationWithSubscriptionStub,
  onRegisteredRegistrationWithMassSubscriptionsStub,

  onUpdatedProfileInfoSubscriptionsStub,
  onUpdatedProfileInfoStub,

  onLoggedInEnterWebsiteStub,

  onAddedProductToWishlistStub,
  onRemovedProductFromWishlistStub
}
