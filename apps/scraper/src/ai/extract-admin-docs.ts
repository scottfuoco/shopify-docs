import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const model = openai("gpt-4o-mini");

const fieldInfoSchema = z
  .object({
    name: z.string().nullable().describe("The name of the field"),
    type: z.string().nullable().describe("The GraphQL type of the field"),
    description: z.string().nullable().describe("Detailed description of the field's purpose"),
    docUrl: z.string().nullable().describe("URL to the field's documentation"),
  })
  .nullable();

const exampleSchema = z
  .object({
    description: z.string().nullable(),
    code: z.string().nullable(),
  })
  .optional()
  .nullable();

const schema = z.object({
  name: z.string().nullable().describe("The name of the GraphQL operation"),
  category: z.enum(["admin-graphql", "storefront-graphql"]).nullable().describe("The API category this operation belongs to"),
  operationType: z.enum(["QUERY", "MUTATION", "OBJECT"]).nullable().describe("The type of GraphQL operation: QUERY, MUTATION, or OBJECT"),
  version: z.string().nullable().describe("API version in YYYY-MM format"),
  description: z.string().nullable().describe("Detailed description of the operation's purpose"),
  accessScopes: z.string().nullable().describe("Required access scopes to use this operation"),
  arguments: z.array(fieldInfoSchema).nullable().describe("List of input arguments for the operation"),
  returns: z.array(fieldInfoSchema).nullable().describe("List of fields that the operation returns"),
  examples: z.array(exampleSchema).nullable().describe("GraphQL usage examples"),
});

export type AdminDoc = z.infer<typeof schema>;

async function extractAdminDocs(html: string) {
  const { object } = await generateObject({
    model,
    system: `You are a helpful assistant that extracts GraphQL operation documentation from HTML into structured data.`,
    prompt: `Extract the GraphQL operation documentation from this HTML:\n\n${html}`,
    schema,
  });

  return schema.parse(object);
}

export { extractAdminDocs };
