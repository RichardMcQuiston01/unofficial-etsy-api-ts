# Listings & media

`etsy.listings` — `ShopListing` plus the `File`/`Image`/`Video`/
`VariationImage`/`Translation`/`Personalization` sub-resources (37
operations). All writes need `auth` (OAuth2 + PKCE) on the client; reads are
a mix of `apiKey`-only and `oauth` — see each method's doc comment in
`src/resources/listings/index.ts` for which.

> Etsy's OpenAPI spec marks nearly every response `*_id` field optional
> (`listing_id?: number`, etc.) even though it's always present on a
> successful response. Chaining an ID straight from a just-created
> resource into the next call — as the examples below do — needs a
> non-null assertion (`!`) to satisfy TypeScript's strict null checks.

## CRUD

`auth` below is an `EtsyOAuth` instance — see the README's OAuth2 + PKCE
quickstart for how to build one; this guide picks up from there.

```ts
import { createEtsyClient } from "@richardmcquiston01/etsy-api";

const etsy = createEtsyClient({ apiKey: "<keystring>", auth });

// Create a draft listing.
const draft = await etsy.listings.create(shopId, {
  quantity: 1,
  title: "Hand-thrown ceramic mug",
  description: "Wheel-thrown, glazed in matte white.",
  price: 28,
  who_made: "i_did",
  when_made: "made_to_order",
  taxonomy_id: 1633, // from etsy.catalog.sellerTaxonomy.getNodes()
  shipping_profile_id: shippingProfileId, // from etsy.shop.shippingProfiles.getAll()
});

// Read (apiKey-only — no auth needed for a public listing).
const listing = await etsy.listings.get(draft.listing_id!, { includes: ["Images", "Shop"] });

// Update. Price/quantity aren't here — those live on inventory offerings,
// see docs/guides/catalog.md's Inventory section.
await etsy.listings.update(shopId, draft.listing_id!, { title: "Hand-thrown mug, glazed white" });

// Delete.
await etsy.listings.delete(draft.listing_id!);
```

## Finding listings

```ts
// Public search — no auth.
const { results } = await etsy.listings.findAllActive({ keywords: "ceramic mug", limit: 25 });

// A shop's own listings (any state) — needs auth.
const shopListings = await etsy.listings.getByShop(shopId, { state: "active" });

// Batch lookup by ID — apiKey-only, listing_ids is required and comma-joined for you.
const batch = await etsy.listings.getByListingIds({ listing_ids: [111, 222, 333] });

// Listings tied to a shop section, a receipt, or a return policy.
const bySection = await etsy.listings.getByShopSectionId(shopId, { shop_section_ids: [sectionId] });
const byReceipt = await etsy.listings.getByShopReceipt(shopId, receiptId);
const byPolicy = await etsy.listings.getByShopReturnPolicy(shopId, returnPolicyId);
```

## Media (files, images, videos)

Etsy's binary-upload fields (`file`/`image`/`video`) are typed as `string`
by the generated OpenAPI types (`openapi-typescript`'s default mapping for
`format: binary`) — the real wire value is a `Blob`, and `EtsyHttpClient`'s
multipart builder passes `Blob` instances through untouched. Cast at the
call site:

```ts
import type { UploadListingImageRequestBody } from "@richardmcquiston01/etsy-api";

const imageBlob = new Blob([fileBytes], { type: "image/jpeg" });

const image = await etsy.listings.images.upload(shopId, listingId, {
  image: imageBlob,
  rank: 1,
} as unknown as UploadListingImageRequestBody);

const allImages = await etsy.listings.images.getAll(listingId); // apiKey-only, no shop_id needed
await etsy.listings.images.delete(shopId, listingId, image.listing_image_id!);
```

`listings.files` (digital downloads) and `listings.videos` follow the same
`getAll`/`get`/`upload`/`delete` shape.

## Variations, translations, personalization

```ts
// Associate uploaded images with specific variations.
await etsy.listings.variationImages.update(shopId, listingId, {
  variation_images: [{ property_id: 200, value_id: 1, image_id: image.listing_image_id! }],
});

// Per-language title/description overrides.
await etsy.listings.translations.create(shopId, listingId, "fr", {
  title: "Tasse en céramique",
  description: "Tournée à la main.",
});
const french = await etsy.listings.translations.get(shopId, listingId, "fr"); // apiKey-only

// Buyer-facing personalization (e.g. "add a name for engraving").
await etsy.listings.personalization.update(
  shopId,
  listingId,
  {
    personalization_questions: [
      {
        question_text: "Name to engrave (max 20 characters)",
        question_type: "text_input",
        required: true,
      },
    ],
  },
  { supports_multiple_personalization_questions: false },
);
```

## Listing properties (variations metadata)

```ts
const properties = await etsy.listings.getProperties(shopId, listingId); // apiKey-only
await etsy.listings.updateProperty(shopId, listingId, propertyId, {
  value_ids: [1],
  values: ["Blue"],
});
await etsy.listings.deleteProperty(shopId, listingId, propertyId);
```
