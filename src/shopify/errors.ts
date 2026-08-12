export interface UserError {
  field: string[] | null;
  message: string;
}

export class ShopifyGraphqlError extends Error {
  constructor(
    readonly messages: string[],
    readonly codes: string[],
  ) {
    super(`Shopify GraphQL: ${messages.join("; ")}`);
    this.name = "ShopifyGraphqlError";
  }
}

export class ShopifyUserError extends Error {
  constructor(operation: string, readonly userErrors: UserError[]) {
    super(`${operation} rejected: ${userErrors.map((e) => e.message).join("; ")}`);
    this.name = "ShopifyUserError";
  }
}
