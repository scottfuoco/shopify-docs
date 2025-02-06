import { pgTableHelper } from "./helpers";
import { integer, serial, text } from "drizzle-orm/pg-core";

export const graphqlOperations = pgTableHelper("graphql_operations", {
  id: serial("id").primaryKey(),
  name: text("name"),
  category: text("category"),
  operationType: text("operation_type"),
  version: text("version"),
  description: text("description"),
  accessScopes: text("access_scopes"),
});

export const fieldInfo = pgTableHelper("field_info", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => graphqlOperations.id),
  fieldType: text("field_type"),
  name: text("name"),
  type: text("type"),
  description: text("description"),
  docUrl: text("doc_url"),
});

export const examples = pgTableHelper("examples", {
  id: serial("id").primaryKey(),
  operationId: integer("operation_id").references(() => graphqlOperations.id),
  description: text("description"),
  code: text("code"),
});
