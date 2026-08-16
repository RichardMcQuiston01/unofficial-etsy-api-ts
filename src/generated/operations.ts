/**
 * AUTO-GENERATED from docs/3.0.0.json by scripts/codegen.ts.
 * Do not edit operations.ts by hand — rerun `npm run codegen`.
 */

import type { operations } from "./openapi.js";

// 105 operations, keyed by operationId.

export type ConsolidateShopReturnPoliciesParams =
  operations["consolidateShopReturnPolicies"]["parameters"];
export type ConsolidateShopReturnPoliciesRequestBody = NonNullable<
  operations["consolidateShopReturnPolicies"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type ConsolidateShopReturnPoliciesResponse =
  operations["consolidateShopReturnPolicies"]["responses"]["200"]["content"]["application/json"];

export type CreateDraftListingParams = operations["createDraftListing"]["parameters"];
export type CreateDraftListingRequestBody = NonNullable<
  operations["createDraftListing"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateDraftListingResponse =
  operations["createDraftListing"]["responses"]["201"]["content"]["application/json"];

export type CreateListingTranslationParams = operations["createListingTranslation"]["parameters"];
export type CreateListingTranslationRequestBody = NonNullable<
  operations["createListingTranslation"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateListingTranslationResponse =
  operations["createListingTranslation"]["responses"]["200"]["content"]["application/json"];

export type CreateReceiptShipmentParams = operations["createReceiptShipment"]["parameters"];
export type CreateReceiptShipmentRequestBody = NonNullable<
  operations["createReceiptShipment"]["requestBody"]
>["content"]["application/json"];
export type CreateReceiptShipmentResponse =
  operations["createReceiptShipment"]["responses"]["200"]["content"]["application/json"];

export type CreateShopReadinessStateDefinitionParams =
  operations["createShopReadinessStateDefinition"]["parameters"];
export type CreateShopReadinessStateDefinitionRequestBody = NonNullable<
  operations["createShopReadinessStateDefinition"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateShopReadinessStateDefinitionResponse =
  operations["createShopReadinessStateDefinition"]["responses"]["201"]["content"]["application/json"];

export type CreateShopReturnPolicyParams = operations["createShopReturnPolicy"]["parameters"];
export type CreateShopReturnPolicyRequestBody = NonNullable<
  operations["createShopReturnPolicy"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateShopReturnPolicyResponse =
  operations["createShopReturnPolicy"]["responses"]["200"]["content"]["application/json"];

export type CreateShopSectionParams = operations["createShopSection"]["parameters"];
export type CreateShopSectionRequestBody = NonNullable<
  operations["createShopSection"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateShopSectionResponse =
  operations["createShopSection"]["responses"]["200"]["content"]["application/json"];

export type CreateShopShippingProfileParams = operations["createShopShippingProfile"]["parameters"];
export type CreateShopShippingProfileRequestBody = NonNullable<
  operations["createShopShippingProfile"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateShopShippingProfileResponse =
  operations["createShopShippingProfile"]["responses"]["200"]["content"]["application/json"];

export type CreateShopShippingProfileDestinationParams =
  operations["createShopShippingProfileDestination"]["parameters"];
export type CreateShopShippingProfileDestinationRequestBody = NonNullable<
  operations["createShopShippingProfileDestination"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateShopShippingProfileDestinationResponse =
  operations["createShopShippingProfileDestination"]["responses"]["201"]["content"]["application/json"];

export type CreateShopShippingProfileUpgradeParams =
  operations["createShopShippingProfileUpgrade"]["parameters"];
export type CreateShopShippingProfileUpgradeRequestBody = NonNullable<
  operations["createShopShippingProfileUpgrade"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type CreateShopShippingProfileUpgradeResponse =
  operations["createShopShippingProfileUpgrade"]["responses"]["200"]["content"]["application/json"];

export type DeleteListingParams = operations["deleteListing"]["parameters"];
export type DeleteListingResponse = void; // 204 No Content

export type DeleteListingFileParams = operations["deleteListingFile"]["parameters"];
export type DeleteListingFileResponse = void; // 204 No Content

export type DeleteListingImageParams = operations["deleteListingImage"]["parameters"];
export type DeleteListingImageResponse = void; // 204 No Content

export type DeleteListingPersonalizationParams =
  operations["deleteListingPersonalization"]["parameters"];
export type DeleteListingPersonalizationResponse = void; // 204 No Content

export type DeleteListingPropertyParams = operations["deleteListingProperty"]["parameters"];
export type DeleteListingPropertyResponse = void; // 204 No Content

export type DeleteListingVideoParams = operations["deleteListingVideo"]["parameters"];
export type DeleteListingVideoResponse = void; // 204 No Content

export type DeleteShopReadinessStateDefinitionParams =
  operations["deleteShopReadinessStateDefinition"]["parameters"];
export type DeleteShopReadinessStateDefinitionResponse = void; // 204 No Content

export type DeleteShopReturnPolicyParams = operations["deleteShopReturnPolicy"]["parameters"];
export type DeleteShopReturnPolicyResponse = void; // 204 No Content

export type DeleteShopSectionParams = operations["deleteShopSection"]["parameters"];
export type DeleteShopSectionResponse = void; // 204 No Content

export type DeleteShopShippingProfileParams = operations["deleteShopShippingProfile"]["parameters"];
export type DeleteShopShippingProfileResponse = void; // 204 No Content

export type DeleteShopShippingProfileDestinationParams =
  operations["deleteShopShippingProfileDestination"]["parameters"];
export type DeleteShopShippingProfileDestinationResponse = void; // 204 No Content

export type DeleteShopShippingProfileUpgradeParams =
  operations["deleteShopShippingProfileUpgrade"]["parameters"];
export type DeleteShopShippingProfileUpgradeResponse = void; // 204 No Content

export type DeleteUserAddressParams = operations["deleteUserAddress"]["parameters"];
export type DeleteUserAddressResponse = void; // 204 No Content

export type FindAllActiveListingsByShopParams =
  operations["findAllActiveListingsByShop"]["parameters"];
export type FindAllActiveListingsByShopResponse =
  operations["findAllActiveListingsByShop"]["responses"]["200"]["content"]["application/json"];

export type FindAllListingsActiveParams = operations["findAllListingsActive"]["parameters"];
export type FindAllListingsActiveResponse =
  operations["findAllListingsActive"]["responses"]["200"]["content"]["application/json"];

export type FindShopsParams = operations["findShops"]["parameters"];
export type FindShopsResponse =
  operations["findShops"]["responses"]["200"]["content"]["application/json"];

export type GetAllListingFilesParams = operations["getAllListingFiles"]["parameters"];
export type GetAllListingFilesResponse =
  operations["getAllListingFiles"]["responses"]["200"]["content"]["application/json"];

export type GetBuyerTaxonomyNodesResponse =
  operations["getBuyerTaxonomyNodes"]["responses"]["200"]["content"]["application/json"];

export type GetFeaturedListingsByShopParams = operations["getFeaturedListingsByShop"]["parameters"];
export type GetFeaturedListingsByShopResponse =
  operations["getFeaturedListingsByShop"]["responses"]["200"]["content"]["application/json"];

export type GetHolidayPreferencesParams = operations["getHolidayPreferences"]["parameters"];
export type GetHolidayPreferencesResponse =
  operations["getHolidayPreferences"]["responses"]["200"]["content"]["application/json"];

export type GetListingParams = operations["getListing"]["parameters"];
export type GetListingResponse =
  operations["getListing"]["responses"]["200"]["content"]["application/json"];

export type GetListingFileParams = operations["getListingFile"]["parameters"];
export type GetListingFileResponse =
  operations["getListingFile"]["responses"]["200"]["content"]["application/json"];

export type GetListingImageParams = operations["getListingImage"]["parameters"];
export type GetListingImageResponse =
  operations["getListingImage"]["responses"]["200"]["content"]["application/json"];

export type GetListingImagesParams = operations["getListingImages"]["parameters"];
export type GetListingImagesResponse =
  operations["getListingImages"]["responses"]["200"]["content"]["application/json"];

export type GetListingInventoryParams = operations["getListingInventory"]["parameters"];
export type GetListingInventoryResponse =
  operations["getListingInventory"]["responses"]["200"]["content"]["application/json"];

export type GetListingOfferingParams = operations["getListingOffering"]["parameters"];
export type GetListingOfferingResponse =
  operations["getListingOffering"]["responses"]["200"]["content"]["application/json"];

export type GetListingPersonalizationParams = operations["getListingPersonalization"]["parameters"];
export type GetListingPersonalizationResponse =
  operations["getListingPersonalization"]["responses"]["200"]["content"]["application/json"];

export type GetListingProductParams = operations["getListingProduct"]["parameters"];
export type GetListingProductResponse =
  operations["getListingProduct"]["responses"]["200"]["content"]["application/json"];

export type GetListingPropertiesParams = operations["getListingProperties"]["parameters"];
export type GetListingPropertiesResponse =
  operations["getListingProperties"]["responses"]["200"]["content"]["application/json"];

export type GetListingPropertyParams = operations["getListingProperty"]["parameters"];
export type GetListingPropertyResponse =
  operations["getListingProperty"]["responses"]["200"]["content"]["application/json"];

export type GetListingsByListingIdsParams = operations["getListingsByListingIds"]["parameters"];
export type GetListingsByListingIdsResponse =
  operations["getListingsByListingIds"]["responses"]["200"]["content"]["application/json"];

export type GetListingsByShopParams = operations["getListingsByShop"]["parameters"];
export type GetListingsByShopResponse =
  operations["getListingsByShop"]["responses"]["200"]["content"]["application/json"];

export type GetListingsByShopReceiptParams = operations["getListingsByShopReceipt"]["parameters"];
export type GetListingsByShopReceiptResponse =
  operations["getListingsByShopReceipt"]["responses"]["200"]["content"]["application/json"];

export type GetListingsByShopReturnPolicyParams =
  operations["getListingsByShopReturnPolicy"]["parameters"];
export type GetListingsByShopReturnPolicyResponse =
  operations["getListingsByShopReturnPolicy"]["responses"]["200"]["content"]["application/json"];

export type GetListingsByShopSectionIdParams =
  operations["getListingsByShopSectionId"]["parameters"];
export type GetListingsByShopSectionIdResponse =
  operations["getListingsByShopSectionId"]["responses"]["200"]["content"]["application/json"];

export type GetListingsInventoryByListingIdsParams =
  operations["getListingsInventoryByListingIds"]["parameters"];
export type GetListingsInventoryByListingIdsResponse =
  operations["getListingsInventoryByListingIds"]["responses"]["200"]["content"]["application/json"];

export type GetListingsShippingByListingIdsParams =
  operations["getListingsShippingByListingIds"]["parameters"];
export type GetListingsShippingByListingIdsResponse =
  operations["getListingsShippingByListingIds"]["responses"]["200"]["content"]["application/json"];

export type GetListingTranslationParams = operations["getListingTranslation"]["parameters"];
export type GetListingTranslationResponse =
  operations["getListingTranslation"]["responses"]["200"]["content"]["application/json"];

export type GetListingVariationImagesParams = operations["getListingVariationImages"]["parameters"];
export type GetListingVariationImagesResponse =
  operations["getListingVariationImages"]["responses"]["200"]["content"]["application/json"];

export type GetListingVideoParams = operations["getListingVideo"]["parameters"];
export type GetListingVideoResponse =
  operations["getListingVideo"]["responses"]["200"]["content"]["application/json"];

export type GetListingVideosParams = operations["getListingVideos"]["parameters"];
export type GetListingVideosResponse =
  operations["getListingVideos"]["responses"]["200"]["content"]["application/json"];

export type GetMeResponse = operations["getMe"]["responses"]["200"]["content"]["application/json"];

export type GetPaymentAccountLedgerEntryPaymentsParams =
  operations["getPaymentAccountLedgerEntryPayments"]["parameters"];
export type GetPaymentAccountLedgerEntryPaymentsResponse =
  operations["getPaymentAccountLedgerEntryPayments"]["responses"]["200"]["content"]["application/json"];

export type GetPaymentsParams = operations["getPayments"]["parameters"];
export type GetPaymentsResponse =
  operations["getPayments"]["responses"]["200"]["content"]["application/json"];

export type GetPropertiesByBuyerTaxonomyIdParams =
  operations["getPropertiesByBuyerTaxonomyId"]["parameters"];
export type GetPropertiesByBuyerTaxonomyIdResponse =
  operations["getPropertiesByBuyerTaxonomyId"]["responses"]["200"]["content"]["application/json"];

export type GetPropertiesByTaxonomyIdParams = operations["getPropertiesByTaxonomyId"]["parameters"];
export type GetPropertiesByTaxonomyIdResponse =
  operations["getPropertiesByTaxonomyId"]["responses"]["200"]["content"]["application/json"];

export type GetReviewsByListingParams = operations["getReviewsByListing"]["parameters"];
export type GetReviewsByListingResponse =
  operations["getReviewsByListing"]["responses"]["200"]["content"]["application/json"];

export type GetReviewsByShopParams = operations["getReviewsByShop"]["parameters"];
export type GetReviewsByShopResponse =
  operations["getReviewsByShop"]["responses"]["200"]["content"]["application/json"];

export type GetSellerTaxonomyNodesResponse =
  operations["getSellerTaxonomyNodes"]["responses"]["200"]["content"]["application/json"];

export type GetShippingCarriersParams = operations["getShippingCarriers"]["parameters"];
export type GetShippingCarriersResponse =
  operations["getShippingCarriers"]["responses"]["200"]["content"]["application/json"];

export type GetShopParams = operations["getShop"]["parameters"];
export type GetShopResponse =
  operations["getShop"]["responses"]["200"]["content"]["application/json"];

export type GetShopByOwnerUserIdParams = operations["getShopByOwnerUserId"]["parameters"];
export type GetShopByOwnerUserIdResponse =
  operations["getShopByOwnerUserId"]["responses"]["200"]["content"]["application/json"];

export type GetShopPaymentAccountLedgerEntriesParams =
  operations["getShopPaymentAccountLedgerEntries"]["parameters"];
export type GetShopPaymentAccountLedgerEntriesResponse =
  operations["getShopPaymentAccountLedgerEntries"]["responses"]["200"]["content"]["application/json"];

export type GetShopPaymentAccountLedgerEntryParams =
  operations["getShopPaymentAccountLedgerEntry"]["parameters"];
export type GetShopPaymentAccountLedgerEntryResponse =
  operations["getShopPaymentAccountLedgerEntry"]["responses"]["200"]["content"]["application/json"];

export type GetShopPaymentByReceiptIdParams = operations["getShopPaymentByReceiptId"]["parameters"];
export type GetShopPaymentByReceiptIdResponse =
  operations["getShopPaymentByReceiptId"]["responses"]["200"]["content"]["application/json"];

export type GetShopProductionPartnersParams = operations["getShopProductionPartners"]["parameters"];
export type GetShopProductionPartnersResponse =
  operations["getShopProductionPartners"]["responses"]["200"]["content"]["application/json"];

export type GetShopReadinessStateDefinitionParams =
  operations["getShopReadinessStateDefinition"]["parameters"];
export type GetShopReadinessStateDefinitionResponse =
  operations["getShopReadinessStateDefinition"]["responses"]["200"]["content"]["application/json"];

export type GetShopReadinessStateDefinitionsParams =
  operations["getShopReadinessStateDefinitions"]["parameters"];
export type GetShopReadinessStateDefinitionsResponse =
  operations["getShopReadinessStateDefinitions"]["responses"]["200"]["content"]["application/json"];

export type GetShopReceiptParams = operations["getShopReceipt"]["parameters"];
export type GetShopReceiptResponse =
  operations["getShopReceipt"]["responses"]["200"]["content"]["application/json"];

export type GetShopReceiptsParams = operations["getShopReceipts"]["parameters"];
export type GetShopReceiptsResponse =
  operations["getShopReceipts"]["responses"]["200"]["content"]["application/json"];

export type GetShopReceiptTransactionParams = operations["getShopReceiptTransaction"]["parameters"];
export type GetShopReceiptTransactionResponse =
  operations["getShopReceiptTransaction"]["responses"]["200"]["content"]["application/json"];

export type GetShopReceiptTransactionsByListingParams =
  operations["getShopReceiptTransactionsByListing"]["parameters"];
export type GetShopReceiptTransactionsByListingResponse =
  operations["getShopReceiptTransactionsByListing"]["responses"]["200"]["content"]["application/json"];

export type GetShopReceiptTransactionsByReceiptParams =
  operations["getShopReceiptTransactionsByReceipt"]["parameters"];
export type GetShopReceiptTransactionsByReceiptResponse =
  operations["getShopReceiptTransactionsByReceipt"]["responses"]["200"]["content"]["application/json"];

export type GetShopReceiptTransactionsByShopParams =
  operations["getShopReceiptTransactionsByShop"]["parameters"];
export type GetShopReceiptTransactionsByShopResponse =
  operations["getShopReceiptTransactionsByShop"]["responses"]["200"]["content"]["application/json"];

export type GetShopReturnPoliciesParams = operations["getShopReturnPolicies"]["parameters"];
export type GetShopReturnPoliciesResponse =
  operations["getShopReturnPolicies"]["responses"]["200"]["content"]["application/json"];

export type GetShopReturnPolicyParams = operations["getShopReturnPolicy"]["parameters"];
export type GetShopReturnPolicyResponse =
  operations["getShopReturnPolicy"]["responses"]["200"]["content"]["application/json"];

export type GetShopSectionParams = operations["getShopSection"]["parameters"];
export type GetShopSectionResponse =
  operations["getShopSection"]["responses"]["200"]["content"]["application/json"];

export type GetShopSectionsParams = operations["getShopSections"]["parameters"];
export type GetShopSectionsResponse =
  operations["getShopSections"]["responses"]["200"]["content"]["application/json"];

export type GetShopShippingProfileParams = operations["getShopShippingProfile"]["parameters"];
export type GetShopShippingProfileResponse =
  operations["getShopShippingProfile"]["responses"]["200"]["content"]["application/json"];

export type GetShopShippingProfileDestinationsByShippingProfileParams =
  operations["getShopShippingProfileDestinationsByShippingProfile"]["parameters"];
export type GetShopShippingProfileDestinationsByShippingProfileResponse =
  operations["getShopShippingProfileDestinationsByShippingProfile"]["responses"]["200"]["content"]["application/json"];

export type GetShopShippingProfilesParams = operations["getShopShippingProfiles"]["parameters"];
export type GetShopShippingProfilesResponse =
  operations["getShopShippingProfiles"]["responses"]["200"]["content"]["application/json"];

export type GetShopShippingProfileUpgradesParams =
  operations["getShopShippingProfileUpgrades"]["parameters"];
export type GetShopShippingProfileUpgradesResponse =
  operations["getShopShippingProfileUpgrades"]["responses"]["200"]["content"]["application/json"];

export type GetUserParams = operations["getUser"]["parameters"];
export type GetUserResponse =
  operations["getUser"]["responses"]["200"]["content"]["application/json"];

export type GetUserAddressParams = operations["getUserAddress"]["parameters"];
export type GetUserAddressResponse =
  operations["getUserAddress"]["responses"]["200"]["content"]["application/json"];

export type GetUserAddressesParams = operations["getUserAddresses"]["parameters"];
export type GetUserAddressesResponse =
  operations["getUserAddresses"]["responses"]["200"]["content"]["application/json"];

export type PingResponse = operations["ping"]["responses"]["200"]["content"]["application/json"];

export type TokenScopesRequestBody = NonNullable<
  operations["tokenScopes"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type TokenScopesResponse =
  operations["tokenScopes"]["responses"]["200"]["content"]["application/json"];

export type UpdateHolidayPreferencesParams = operations["updateHolidayPreferences"]["parameters"];
export type UpdateHolidayPreferencesRequestBody = NonNullable<
  operations["updateHolidayPreferences"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateHolidayPreferencesResponse =
  operations["updateHolidayPreferences"]["responses"]["200"]["content"]["application/json"];

export type UpdateListingParams = operations["updateListing"]["parameters"];
export type UpdateListingRequestBody = NonNullable<
  operations["updateListing"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateListingResponse =
  operations["updateListing"]["responses"]["200"]["content"]["application/json"];

export type UpdateListingInventoryParams = operations["updateListingInventory"]["parameters"];
export type UpdateListingInventoryRequestBody = NonNullable<
  operations["updateListingInventory"]["requestBody"]
>["content"]["application/json"];
export type UpdateListingInventoryResponse =
  operations["updateListingInventory"]["responses"]["200"]["content"]["application/json"];

export type UpdateListingPersonalizationParams =
  operations["updateListingPersonalization"]["parameters"];
export type UpdateListingPersonalizationRequestBody = NonNullable<
  operations["updateListingPersonalization"]["requestBody"]
>["content"]["application/json"];
export type UpdateListingPersonalizationResponse =
  operations["updateListingPersonalization"]["responses"]["201"]["content"]["application/json"];

export type UpdateListingPropertyParams = operations["updateListingProperty"]["parameters"];
export type UpdateListingPropertyRequestBody = NonNullable<
  operations["updateListingProperty"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateListingPropertyResponse =
  operations["updateListingProperty"]["responses"]["200"]["content"]["application/json"];

export type UpdateListingTranslationParams = operations["updateListingTranslation"]["parameters"];
export type UpdateListingTranslationRequestBody = NonNullable<
  operations["updateListingTranslation"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateListingTranslationResponse =
  operations["updateListingTranslation"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopParams = operations["updateShop"]["parameters"];
export type UpdateShopRequestBody = NonNullable<
  operations["updateShop"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopResponse =
  operations["updateShop"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopReadinessStateDefinitionParams =
  operations["updateShopReadinessStateDefinition"]["parameters"];
export type UpdateShopReadinessStateDefinitionRequestBody = NonNullable<
  operations["updateShopReadinessStateDefinition"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopReadinessStateDefinitionResponse =
  operations["updateShopReadinessStateDefinition"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopReceiptParams = operations["updateShopReceipt"]["parameters"];
export type UpdateShopReceiptRequestBody = NonNullable<
  operations["updateShopReceipt"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopReceiptResponse =
  operations["updateShopReceipt"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopReturnPolicyParams = operations["updateShopReturnPolicy"]["parameters"];
export type UpdateShopReturnPolicyRequestBody = NonNullable<
  operations["updateShopReturnPolicy"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopReturnPolicyResponse =
  operations["updateShopReturnPolicy"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopSectionParams = operations["updateShopSection"]["parameters"];
export type UpdateShopSectionRequestBody = NonNullable<
  operations["updateShopSection"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopSectionResponse =
  operations["updateShopSection"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopShippingProfileParams = operations["updateShopShippingProfile"]["parameters"];
export type UpdateShopShippingProfileRequestBody = NonNullable<
  operations["updateShopShippingProfile"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopShippingProfileResponse =
  operations["updateShopShippingProfile"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopShippingProfileDestinationParams =
  operations["updateShopShippingProfileDestination"]["parameters"];
export type UpdateShopShippingProfileDestinationRequestBody = NonNullable<
  operations["updateShopShippingProfileDestination"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopShippingProfileDestinationResponse =
  operations["updateShopShippingProfileDestination"]["responses"]["200"]["content"]["application/json"];

export type UpdateShopShippingProfileUpgradeParams =
  operations["updateShopShippingProfileUpgrade"]["parameters"];
export type UpdateShopShippingProfileUpgradeRequestBody = NonNullable<
  operations["updateShopShippingProfileUpgrade"]["requestBody"]
>["content"]["application/x-www-form-urlencoded"];
export type UpdateShopShippingProfileUpgradeResponse =
  operations["updateShopShippingProfileUpgrade"]["responses"]["200"]["content"]["application/json"];

export type UpdateVariationImagesParams = operations["updateVariationImages"]["parameters"];
export type UpdateVariationImagesRequestBody = NonNullable<
  operations["updateVariationImages"]["requestBody"]
>["content"]["application/json"];
export type UpdateVariationImagesResponse =
  operations["updateVariationImages"]["responses"]["200"]["content"]["application/json"];

export type UploadListingFileParams = operations["uploadListingFile"]["parameters"];
export type UploadListingFileRequestBody = NonNullable<
  operations["uploadListingFile"]["requestBody"]
>["content"]["multipart/form-data"];
export type UploadListingFileResponse =
  operations["uploadListingFile"]["responses"]["201"]["content"]["application/json"];

export type UploadListingImageParams = operations["uploadListingImage"]["parameters"];
export type UploadListingImageRequestBody = NonNullable<
  operations["uploadListingImage"]["requestBody"]
>["content"]["multipart/form-data"];
export type UploadListingImageResponse =
  operations["uploadListingImage"]["responses"]["201"]["content"]["application/json"];

export type UploadListingVideoParams = operations["uploadListingVideo"]["parameters"];
export type UploadListingVideoRequestBody = NonNullable<
  operations["uploadListingVideo"]["requestBody"]
>["content"]["multipart/form-data"];
export type UploadListingVideoResponse =
  operations["uploadListingVideo"]["responses"]["201"]["content"]["application/json"];
