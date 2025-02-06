import { $ } from "zx";
import { mkdir } from "fs/promises";
import { dirname } from "path";

const SHOPIFY_ADMIN_API = {
  graphqlEndpoint: "https://shopify.dev/admin-graphql-direct-proxy/2025-01",
  output: "./graphql/schema/shopify-admin-api.json",
};

const SHOPIFY_STOREFRONT_API = {
  graphqlEndpoint: "https://shopify.dev/storefront-graphql-direct-proxy/2025-01",
  output: "./graphql/schema/shopify-storefront-api.json",
};

async function ensureDirectoryExists(filePath: string) {
  const directory = dirname(filePath);
  await mkdir(directory, { recursive: true });
}

async function fetchSchema(endpoint: string, outputPath: string) {
  try {
    console.log(`Fetching schema from ${endpoint}...`);

    // Ensure the output directory exists before saving
    await ensureDirectoryExists(outputPath);

    await $`NODE_OPTIONS=--no-warnings npx graphql-inspector introspect ${endpoint} -w ${outputPath}`;

    console.log(`✅ GraphQL Introspection schema saved as ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error fetching schema from ${endpoint}:`, error);
    throw error;
  }
}

async function main() {
  try {
    await fetchSchema(SHOPIFY_ADMIN_API.graphqlEndpoint, SHOPIFY_ADMIN_API.output);
    await fetchSchema(SHOPIFY_STOREFRONT_API.graphqlEndpoint, SHOPIFY_STOREFRONT_API.output);
    console.log("✨ All schemas downloaded successfully!");
  } catch (error) {
    console.error("Failed to download all schemas:", error);
    process.exit(1);
  }
}

main();
