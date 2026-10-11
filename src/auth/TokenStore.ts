export type EtsyScope =
  | "address_r"
  | "address_w"
  | "email_r"
  | "listings_d"
  | "listings_r"
  | "listings_w"
  | "profile_r"
  | "profile_w"
  | "shops_r"
  | "shops_w"
  | "transactions_r"
  | "transactions_w";

export interface TokenSet {
  accessToken: string;
  /** Rotates on every refresh — always persist the value returned from refresh(). */
  refreshToken: string;
  /** Epoch ms. Access tokens live 1 hour from issuance. */
  expiresAt: number;
  scope: EtsyScope[];
}

export interface TokenStore {
  load(): Promise<TokenSet | null> | TokenSet | null;
  save(tokens: TokenSet): Promise<void> | void;
}

function copyTokens(tokens: TokenSet): TokenSet {
  return { ...tokens, scope: [...tokens.scope] };
}

/**
 * Default TokenStore. No persistence across process restarts by design —
 * consumers needing durability (disk, DB, KV) provide their own TokenStore.
 */
export class InMemoryTokenStore implements TokenStore {
  #tokens: TokenSet | null = null;

  /** Returns a copy, so callers mutating the result can't corrupt the store. */
  load(): TokenSet | null {
    return this.#tokens ? copyTokens(this.#tokens) : null;
  }

  save(tokens: TokenSet): void {
    this.#tokens = copyTokens(tokens);
  }
}
