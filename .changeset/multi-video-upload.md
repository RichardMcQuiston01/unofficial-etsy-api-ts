---
"@richardmcquiston01/etsy-api": minor
---

`listings.videos.upload()` takes an optional fourth argument for its query
parameters, so `{ is_multi_video: true }` links up to 2 videos to a listing
instead of Etsy's default single-video behaviour.

The vendored spec (`docs/3.0.0.json`) is refreshed to Etsy's current Open API
v3 spec, and the generated types follow it:

- Added: `is_multi_video` on `uploadListingVideo`; `supports_variations` and
  `supports_attributes` filters on `getPropertiesByTaxonomyId`; the EU
  commercial-guarantee (`ecgt_*`) fields on `createDraftListing`,
  `updateListing`, `ShopListing` and `ShopListingWithAssociations`; a
  `"removed"` listing state on `getListingsByShop` and listing responses; and
  `mime_type` on `TransactionVariations`.
- Removed, following Etsy: the deprecated `is_personalizable`,
  `personalization_is_required`, `personalization_char_count_max` and
  `personalization_instructions` request fields (Etsy retired them on
  9 April 2026; use the listing personalization endpoints), and
  `rich_description`, which Etsy's current spec no longer lists on listing
  responses.
