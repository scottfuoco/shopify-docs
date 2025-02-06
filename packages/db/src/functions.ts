export function getDbUrl() {
  const dbUrl = process.env.POSTGRES_URL;

  if (!dbUrl) {
    throw new Error("No database url found");
  }

  if (dbUrl) {
    return dbUrl;
  }
}
