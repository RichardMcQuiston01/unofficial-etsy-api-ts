# Shop setup

`etsy.shop` — `Shop`, `Shop Section`, `Shop ShippingProfile`,
`Shop Return Policy`, `Shop ProcessingProfiles`, `Shop HolidayPreferences`,
`Shop ProductionPartner` (37 operations). All writes need `oauth`; reads are
a mix of `apiKey`-only and `oauth` (processing profiles, holiday
preferences, and production partners are `oauth` even for reads, since
they're shop-management data — see each method's doc comment for which).

> Etsy's OpenAPI spec marks nearly every response `*_id` field optional
> (`shop_section_id?: number`, etc.) even though it's always present on a
> successful response. Chaining an ID straight from a just-created resource
> into the next call — as some examples below do — needs a non-null
> assertion (`!`) to satisfy TypeScript's strict null checks.

## The shop itself

```ts
import { createEtsyClient } from "@richardmcquiston01/etsy-api";

const etsy = createEtsyClient({ apiKey: "<keystring>", auth /* for writes; see README */ });

const shop = await etsy.shop.get(shopId); // apiKey-only
const byOwner = await etsy.shop.getByOwnerUserId(userId); // apiKey-only
const { results } = await etsy.shop.find({ shop_name: "candles", limit: 10 }); // apiKey-only

await etsy.shop.update(shopId, { title: "New shop title" }); // oauth
```

## Sections (organizing listings into storefront categories)

```ts
const section = await etsy.shop.sections.create(shopId, { title: "Home Decor" });
const sections = await etsy.shop.sections.getAll(shopId); // apiKey-only
await etsy.shop.sections.update(shopId, section.shop_section_id!, { title: "Living Room" });
await etsy.shop.sections.delete(shopId, section.shop_section_id!);
```

## Shipping profiles

A listing needs a `shipping_profile_id` at creation time (see
`docs/guides/listings.md`). Profiles nest **destinations** (per-country/
region rates) and **upgrades** (e.g. expedited shipping add-ons).

```ts
const profile = await etsy.shop.shippingProfiles.create(shopId, {
  title: "Standard domestic",
  origin_country_iso: "US",
  primary_cost: 5,
  secondary_cost: 2,
  min_processing_time: 1,
  max_processing_time: 3,
});

const profiles = await etsy.shop.shippingProfiles.getAll(shopId); // oauth

// Not shop-scoped, despite living under this tag in the OpenAPI spec.
const carriers = await etsy.shop.shippingProfiles.getCarriers({ origin_country_iso: "US" });

await etsy.shop.shippingProfiles.destinations.create(shopId, profile.shipping_profile_id!, {
  primary_cost: 5,
  secondary_cost: 2,
  destination_country_iso: "CA",
});

await etsy.shop.shippingProfiles.upgrades.create(shopId, profile.shipping_profile_id!, {
  type: 0, // 0 = domestic, 1 = international
  upgrade_name: "Priority",
  price: 8,
  secondary_price: 3,
});
```

## Return policies

```ts
const policy = await etsy.shop.returnPolicies.create(shopId, {
  accepts_returns: true,
  accepts_exchanges: true,
  return_deadline: 30,
});
const policies = await etsy.shop.returnPolicies.getAll(shopId); // apiKey-only

// Merge a duplicate policy into another (Etsy's dedup endpoint).
await etsy.shop.returnPolicies.consolidate(shopId, {
  source_return_policy_id: duplicateId,
  destination_return_policy_id: policy.return_policy_id!,
});
```

## Processing profiles ("readiness state definitions")

Etsy's API calls this endpoint family `readiness-state-definitions`
(the OpenAPI tag is `Shop ProcessingProfiles`) — how long a shop needs to
prepare an order before shipping.

```ts
const processingProfile = await etsy.shop.processingProfiles.create(shopId, {
  readiness_state: "ready_to_ship",
  min_processing_time: 1,
  max_processing_time: 3,
});
const processingProfiles = await etsy.shop.processingProfiles.getAll(shopId);
```

## Holiday preferences and production partners

```ts
// Whether the shop operates on a given Etsy-defined holiday.
await etsy.shop.holidayPreferences.update(shopId, holidayId, { is_working: false });
const holidayPreferences = await etsy.shop.holidayPreferences.getAll(shopId);

// Manufacturers/print shops credited on listings made with outside help.
const partners = await etsy.shop.productionPartners.getAll(shopId);
```
