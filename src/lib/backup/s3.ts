// Intentionally not marked `server-only`: this module is shared by the
// Next.js API route and by the CLI scripts (export, preflight, drill), and
// `server-only` throws outside a Next build. Client bundling is prevented
// naturally by the node:crypto import below.
import { createHash, createHmac } from "node:crypto";

/**
 * Minimal AWS SigV4 PUT for S3-compatible object storage.
 *
 * Written by hand rather than pulling in the AWS SDK: the backup job makes
 * exactly one kind of request (PUT object), and this keeps the dependency
 * surface of a security-sensitive path small. Works against AWS S3,
 * Cloudflare R2, Backblaze B2 (S3 endpoint), and MinIO.
 */

export interface S3Target {
  /** Full endpoint origin, e.g. https://<account>.r2.cloudflarestorage.com */
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function sha256Hex(payload: string | Uint8Array): string {
  return createHash("sha256").update(payload).digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

/** RFC 3986 encoding, applied per path segment (slashes preserved). */
function encodeKey(key: string): string {
  return key
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/g,
        (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase(),
      ),
    )
    .join("/");
}

export function readS3TargetFromEnv(): S3Target | null {
  const endpoint = process.env.BACKUP_S3_ENDPOINT?.trim();
  const bucket = process.env.BACKUP_S3_BUCKET?.trim();
  const accessKeyId = process.env.BACKUP_S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.BACKUP_S3_SECRET_ACCESS_KEY?.trim();
  const region = process.env.BACKUP_S3_REGION?.trim() || "auto";

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }
  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}

/**
 * Uploads a single object. Returns the URL it was written to.
 * Throws with the provider's response body when the request is rejected, so
 * a misconfigured bucket surfaces a real error rather than a silent no-op.
 */
async function signedRequest(
  target: S3Target,
  method: "PUT" | "GET" | "DELETE",
  key: string,
  body?: string,
  contentType = "application/x-ndjson",
): Promise<{ ok: boolean; status: number; statusText: string; text: string; url: string }> {
  const url = new URL(`${target.endpoint.replace(/\/$/, "")}/${target.bucket}/${encodeKey(key)}`);
  const host = url.host;

  const payload = body === undefined ? Buffer.alloc(0) : Buffer.from(body, "utf8");
  const payloadHash = sha256Hex(payload);

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);

  // Content-Type is only signed when a body is sent; signing a header that is
  // not transmitted produces a signature mismatch.
  const hasBody = body !== undefined;
  const signedHeaders = hasBody
    ? "content-type;host;x-amz-content-sha256;x-amz-date"
    : "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders =
    (hasBody ? `content-type:${contentType}\n` : "") +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;

  const canonicalRequest = [
    method,
    url.pathname,
    "", // no query string
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  const scope = `${dateStamp}/${target.region}/s3/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${target.secretAccessKey}`, dateStamp), target.region), "s3"),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign, "utf8").digest("hex");

  const headers: Record<string, string> = {
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    Authorization:
      `AWS4-HMAC-SHA256 Credential=${target.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
  if (hasBody) {
    headers["Content-Type"] = contentType;
    headers["Content-Length"] = String(payload.byteLength);
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    ...(hasBody ? { body: payload } : {}),
  });

  const text = await response.text().catch(() => "");
  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    text,
    url: url.toString(),
  };
}

/**
 * Uploads a single object. Returns the URL it was written to.
 * Throws with the provider's response body when the request is rejected, so
 * a misconfigured bucket surfaces a real error rather than a silent no-op.
 */
export async function putObject(
  target: S3Target,
  key: string,
  body: string,
  contentType = "application/x-ndjson",
): Promise<string> {
  const result = await signedRequest(target, "PUT", key, body, contentType);
  if (!result.ok) {
    throw new Error(
      `Backup upload failed (${result.status} ${result.statusText}): ${result.text.slice(0, 500)}`,
    );
  }
  return result.url;
}

/** Reads an object back. Returns null when it does not exist. */
export async function getObject(target: S3Target, key: string): Promise<string | null> {
  const result = await signedRequest(target, "GET", key);
  if (result.status === 404) return null;
  if (!result.ok) {
    throw new Error(
      `Backup read failed (${result.status} ${result.statusText}): ${result.text.slice(0, 500)}`,
    );
  }
  return result.text;
}

/** Deletes an object. Succeeds whether or not it existed. */
export async function deleteObject(target: S3Target, key: string): Promise<void> {
  const result = await signedRequest(target, "DELETE", key);
  // S3 returns 204 for a successful delete, and 404 is equally fine here.
  if (!result.ok && result.status !== 404) {
    throw new Error(
      `Backup delete failed (${result.status} ${result.statusText}): ${result.text.slice(0, 500)}`,
    );
  }
}
