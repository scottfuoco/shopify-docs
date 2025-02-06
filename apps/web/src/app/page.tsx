import { db } from "@packages/db/client";
import { graphqlOperations, fieldInfo, examples } from "@packages/db/schema";
import { eq } from "drizzle-orm";

function formatCode(code: string) {
  if (!code) return "";

  return code
    .replace(/\\n/g, "\n") // Replace \n string with actual newlines
    .replace(/\\/g, ""); // Remove remaining backslashes
}

export default async function Home() {
  // Get operations with related field info and examples
  const operations = await db
    .select()
    .from(graphqlOperations)
    .leftJoin(fieldInfo, eq(fieldInfo.operationId, graphqlOperations.id))
    .leftJoin(examples, eq(examples.operationId, graphqlOperations.id));

  // Group the joined data by operation
  const groupedOperations = operations.reduce(
    (acc, row) => {
      const operation = row.graphql_operations;
      if (!acc[operation.id]) {
        acc[operation.id] = {
          ...operation,
          fields: [],
          examples: [],
        };
      }

      if (row.field_info) {
        if (!acc[operation.id].fields.find((f: { id: number }) => f.id === row.field_info?.id)) {
          acc[operation.id].fields.push(row.field_info);
        }
      }

      if (row.examples) {
        if (!acc[operation.id].examples.find((e: { id: number }) => e.id === row.examples?.id)) {
          acc[operation.id].examples.push(row.examples);
        }
      }

      return acc;
    },
    {} as Record<number, any>
  );

  return (
    <div className="min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {Object.values(groupedOperations).map((operation) => (
        <section key={operation.id} className="mb-12 border-b pb-8">
          <h2 className="text-2xl font-bold mb-4">{operation.name}</h2>

          <div className="mb-4">
            <p>
              <strong>Category:</strong> {operation.category}
            </p>
            <p>
              <strong>Operation Type:</strong> {operation.operationType}
            </p>
            <p>
              <strong>Version:</strong> {operation.version}
            </p>
            <p>
              <strong>Description:</strong> {operation.description}
            </p>
            <p>
              <strong>Access Scopes:</strong> {operation.accessScopes}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-2">Fields</h3>
            <div className="grid grid-cols-1 gap-2">
              {operation.fields.map((field: { id: number; name: string; type: string; fieldType: string; description: string; docUrl: string }) => (
                <div key={field.id} className="border p-4 rounded">
                  <p>
                    <strong>Name:</strong> {field.name}
                  </p>
                  <p>
                    <strong>Type:</strong> {field.type}
                  </p>
                  <p>
                    <strong>Field Type:</strong> {field.fieldType}
                  </p>
                  <p>
                    <strong>Description:</strong> {field.description}
                  </p>
                  {field.docUrl && (
                    <p>
                      <strong>Documentation:</strong>{" "}
                      <a href={field.docUrl} className="text-blue-500 hover:underline">
                        {field.docUrl}
                      </a>
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {operation.examples.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2">Examples</h3>
              <div className="grid grid-cols-1 gap-2">
                {operation.examples.map((example: { id: number; description: string; code: string }) => (
                  <div key={example.id} className="border p-4 rounded">
                    <p>
                      <strong>Description:</strong> {example.description}
                    </p>
                    <pre className="bg-gray-700 text-white p-4 rounded mt-2 overflow-x-auto">
                      <code>{formatCode(example.code)}</code>
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
