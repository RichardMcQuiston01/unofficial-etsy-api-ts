# Catalog & inventory

`etsy.catalog` — `ShopListing Inventory`/`Product`/`Offering`,
`SellerTaxonomy`, `BuyerTaxonomy`, `Review` (11 operations). Mostly
`apiKey`-only reads; inventory writes need `oauth`.

## Taxonomy

Taxonomy nodes are how Etsy categorizes listings — you need a
`taxonomy_id` to create a listing (see `docs/guides/listings.md`).

```ts
import { createEtsyClient } from "@richardmcquiston01/etsy-api";

const etsy = createEtsyClient({ apiKey: "<keystring>", apiKeySecret: "<shared secret>" }); // apiKey-only, no auth needed

const sellerNodes = await etsy.catalog.sellerTaxonomy.getNodes();
const properties = await etsy.catalog.sellerTaxonomy.getProperties(taxonomyId);

// The buyer-facing taxonomy (Etsy's category tree as shown to shoppers)
// is a separate, coarser tree — same shape, different endpoint.
const buyerNodes = await etsy.catalog.buyerTaxonomy.getNodes();
```

## Inventory (variations, prices, quantities per listing)

```ts
const inventory = await etsy.catalog.inventory.get(listingId); // apiKey-only

// Batch lookup across listings.
const batch = await etsy.catalog.inventory.getByListingIds({ listing_ids: [111, 222] });

// Updating inventory needs auth — this is a JSON body, unlike most writes
// elsewhere in the package (per the OpenAPI spec for this one operation).
await etsy.catalog.inventory.update(listingId, {
  products: [
    {
      sku: "MUG-BLUE-M",
      offerings: [{ price: 28, quantity: 10, is_enabled: true, readiness_state_id: null }],
    },
  ],
});
```

## Products and offerings

`ShopListing Product` and `ShopListing Offering` each have exactly one
operation, so they live directly on `CatalogResource` rather than a
sub-resource:

```ts
const product = await etsy.catalog.getProduct(listingId, productId); // oauth
const offering = await etsy.catalog.getOffering(listingId, productId, offeringId); // apiKey-only
```

## Reviews

```ts
const listingReviews = await etsy.catalog.reviews.getByListing(listingId, { limit: 25 });
const shopReviews = await etsy.catalog.reviews.getByShop(shopId);
```
