# Orders, transactions, payments & ledger

`etsy.commerce` — `Shop Receipt`, `Shop Receipt Transactions`, `Payment`,
`Ledger Entry`, `User`, `UserAddress`, plus the `Other` tag's two
apiKey-only utility operations (20 operations total). Everything except
`ping()`/`tokenScopes()` needs `oauth` — this is all private shop/user data.

> Etsy's OpenAPI spec marks nearly every response `*_id` field optional
> (`entry_id?: number`, etc.) even though it's always present on a
> successful response. Chaining an ID straight from a prior response into
> the next call — as the ledger example below does — needs a non-null
> assertion (`!`) to satisfy TypeScript's strict null checks.

## Receipts (orders)

A receipt is Etsy's unit of "an order" — one purchase, which may bundle
multiple listings' transactions.

`auth` below is an `EtsyOAuth` instance — see the README's OAuth2 + PKCE
quickstart for how to build one; every method in this cluster needs it.

```ts
import { createEtsyClient } from "@richardmcquiston01/etsy-api";

const etsy = createEtsyClient({ apiKey: "<keystring>", auth });

const { results: receipts } = await etsy.commerce.receipts.getAll(shopId, {
  limit: 25,
  sort_on: "created",
});
const receipt = await etsy.commerce.receipts.get(shopId, receiptId);

// Mark as shipped, add tracking.
await etsy.commerce.receipts.update(shopId, receiptId, { was_shipped: true });
await etsy.commerce.receipts.createShipment(shopId, receiptId, {
  tracking_code: "1Z999AA10123456784",
  carrier_name: "ups",
});
```

## Transactions (line items within a receipt)

```ts
const transaction = await etsy.commerce.transactions.get(shopId, transactionId);
const byReceipt = await etsy.commerce.transactions.getByReceipt(shopId, receiptId);
const byListing = await etsy.commerce.transactions.getByListing(shopId, listingId);
const byShop = await etsy.commerce.transactions.getByShop(shopId, { limit: 25 });
```

## Payments and ledger

```ts
// payment_ids is required and comma-joined for you.
const payments = await etsy.commerce.payments.getByShop(shopId, { payment_ids: [111, 222] });
const receiptPayments = await etsy.commerce.payments.getByReceipt(shopId, receiptId);

// Ledger entries record money moving in/out of the shop's Etsy Payments
// account (sales, fees, refunds). min_created/max_created are required.
const entries = await etsy.commerce.ledgerEntries.getAll(shopId, {
  min_created: Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60,
  max_created: Math.floor(Date.now() / 1000),
});
const entry = await etsy.commerce.ledgerEntries.get(shopId, ledgerEntryId);

// Payments tied to specific ledger entries — ledger_entry_ids is required
// and comma-joined for you.
const ledgerPayments = await etsy.commerce.payments.getLedgerEntryPayments(shopId, {
  ledger_entry_ids: [entry.entry_id!],
});
```

## The authenticated user

```ts
const me = await etsy.commerce.user.getMe();
const user = await etsy.commerce.user.get(userId);

const addresses = await etsy.commerce.user.addresses.getAll();
const address = await etsy.commerce.user.addresses.get(addressId);
await etsy.commerce.user.addresses.delete(addressId);
```

## Utility operations (`Other` tag — apiKey-only, no OAuth needed)

```ts
const anonEtsy = createEtsyClient({ apiKey: "<keystring>" }); // no auth needed for these two

await anonEtsy.commerce.ping(); // health check
const scopes = await anonEtsy.commerce.tokenScopes({ token: someAccessToken }); // introspect a token
```
