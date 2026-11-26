/** Vercel names the Blob token BLOB_READ_WRITE_TOKEN by default, but a custom
 *  prefix at connect time changes it. Accept any *_READ_WRITE_TOKEN. */
export function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  const k = Object.keys(process.env).find((n) => n.endsWith("_READ_WRITE_TOKEN") && process.env[n]?.startsWith("vercel_blob_"));
  return k ? process.env[k] : undefined;
}
