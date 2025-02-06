import { load } from "cheerio";
import puppeteer, { type Browser } from "puppeteer";
import { config } from "./config";
import pLimit from "p-limit";
import { extractAdminDocs } from "./ai/extract-admin-docs";
import "dotenv/config";
import { db } from "@packages/db/client";
import { graphqlOperations, fieldInfo, examples } from "@packages/db/schema";
import { writeFile, mkdir } from "fs/promises";

const baseUrl = "https://shopify.dev";
const startUrl = `${baseUrl}/docs/api/admin-graphql/2025-01`;

// The sidebar contains links to the various graphql queries, mutations, and objects
const sidebarSelector = "#sidebar-collapse-content";

async function scrapeShopifyDev() {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(startUrl);

    try {
      console.log("Looking for sidebar element with all the navigation links");
      await page.waitForSelector(sidebarSelector, { timeout: 5000 });
      console.log("Sidebar element found");

      const html = await page.content();
      const $ = load(html);

      let results: { name: string; url: string }[] = [];
      const sidebar = $("#sidebar-collapse-content");

      // Within the sidebar, find all <ul> elements with the aria-label "GraphQL Admin API resources"
      sidebar.find('ul[aria-label="GraphQL Admin API resources"]').each((i: number, ul) => {
        $(ul)
          .find("a")
          .each((j: number, link) => {
            // Remove any <wbr> tags from within the link element
            $(link).find("wbr").remove();
            // Get the href attribute (the URL)
            let href = $(link).attr("href");
            // Extract the text content, which should now be free of any <wbr> tags.
            // Using .text() returns all the descendant text nodes joined together.
            const text = $(link).text().replace(/\s+/g, "");

            if (!href) {
              console.log("No href found for", text);
              return;
            }

            // check if the href starts with the baseUrl, if it doesn't add it.
            if (!href.startsWith(baseUrl)) {
              href = `${baseUrl}${href}`;
            }

            // Save the result as an object with name and url.
            results.push({
              name: text,
              url: href,
            });
          });
      });

      console.log("Found", results.length, "results");
      console.log("Processing results in parallel");

      if (config.limitRequests) {
        results = results.slice(0, config.limitRequests);
      }

      await scrapePages(browser, results);

      await writeFile("data.json", JSON.stringify(results, null, 2));
      console.log("Data has been written to data.json");
      return results;
    } finally {
      await browser.close();
      await db.$client.end();
      console.log("Database connection closed");
    }
  } catch (error) {
    console.error("Error:", error);
    await db.$client.end();
    throw error;
  }
}

async function scrapePages(browser: Browser, results: { name: string; url: string }[]) {
  const limit = pLimit(config.concurrentRequests);

  // Create the directory at the start
  await mkdir("admin-api-graphql", { recursive: true });

  const promises = results.map((result, index) => {
    return limit(async () => {
      try {
        console.log("Scraping", result.url);
        const page = await browser.newPage();

        try {
          await page.goto(result.url);
          await page.waitForSelector("#look-here-llms");

          const html = await page.content();
          const $ = load(html);

          const llms = $("#look-here-llms");
          const llmsHtml = llms.html();

          if (!llmsHtml) {
            console.log("No llmsHtml found for", result.url);
            return;
          }

          const adminDoc = await extractAdminDocs(llmsHtml);

          // Save files as before
          await writeFile(`admin-api-graphql/${result.name}.html`, llmsHtml);
          await writeFile(`admin-api-graphql/${result.name}.json`, JSON.stringify(adminDoc, null, 2));

          // Save to database
          if (adminDoc) {
            // Insert main operation
            const [operation] = await db
              .insert(graphqlOperations)
              .values({
                name: adminDoc.name || null,
                category: adminDoc.category || null,
                operationType: adminDoc.operationType || null,
                version: adminDoc.version || null,
                description: adminDoc.description || null,
                accessScopes: adminDoc.accessScopes || null,
              })
              .returning();

            // Insert arguments
            if (adminDoc.arguments) {
              await Promise.all(
                adminDoc.arguments.map(async (arg) => {
                  if (arg) {
                    await db.insert(fieldInfo).values({
                      operationId: operation.id,
                      fieldType: "argument",
                      name: arg.name || null,
                      type: arg.type || null,
                      description: arg.description || null,
                      docUrl: arg.docUrl || null,
                    });
                  }
                })
              );
            }

            // Insert return fields
            if (adminDoc.returns) {
              await Promise.all(
                adminDoc.returns.map(async (ret) => {
                  if (ret) {
                    await db.insert(fieldInfo).values({
                      operationId: operation.id,
                      fieldType: "return",
                      name: ret.name || null,
                      type: ret.type || null,
                      description: ret.description || null,
                      docUrl: ret.docUrl || null,
                    });
                  }
                })
              );
            }

            // Insert examples
            if (adminDoc.examples) {
              await Promise.all(
                adminDoc.examples.map(async (example) => {
                  if (example) {
                    await db.insert(examples).values({
                      operationId: operation.id,
                      description: example.description || null,
                      code: example.code || null,
                    });
                  }
                })
              );
            }

            console.log(`Saved ${adminDoc.name} to database`);
          }
        } finally {
          await page.close();
        }
      } catch (error) {
        console.error(`Error processing ${result.url}:`, error);
      }
    });
  });

  // Wait for all promises to resolve
  await Promise.all(promises);
  console.log("Finished scraping all pages");
  await db.$client.end();
  process.exit(0);
}

scrapeShopifyDev();
