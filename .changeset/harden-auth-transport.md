---
"@richardmcquiston01/etsy-api": minor
---

Security and reliability fixes: redirects are no longer followed (the `x-api-key` secret can't leak cross-origin); `baseUrl` must be https (http only for loopback); a blank OAuth `state` is rejected; refresh-token rotation is single-flight per store, validates token responses, and throws `TokenSaveError` (carrying the new tokens) if `TokenStore.save` fails; 429 retries re-read the access token and cancel the response body; a 401 on an OAuth call refreshes once and retries; timeout timers and abort listeners are cleaned up; `null` query values are omitted everywhere. Docs now warn against shipping the shared secret to a browser.
