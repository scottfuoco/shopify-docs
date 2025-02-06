export const config = {
  baseUrl: "https://shopify.dev",

  adminApiGraphqlDocsUrl: "/docs/api/admin-graphql/2025-01",
  storefrontApiGraphqlDocsUrl: "/docs/api/storefront-graphql/2025-01",

  limitRequests: 10, // used to prevent running out of openai api requests
  concurrentRequests: 5,
};
