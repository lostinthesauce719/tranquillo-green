import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { securityHeaders } from "@/lib/api-helpers";
import { buildSnapshot, runBackup } from "@/lib/backup/run-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Off-site backup endpoint.
 *
 * This route can read every tenant's records, so it is deliberately NOT
 * behind the normal user session. It authenticates only against BACKUP_SECRET
 * and refuses all requests when that is unset — no fallback, no open state.
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; a manual run can use
 * the same header.
 */
function authorize(request: NextRequest): { ok: true } | { ok: false; response: NextResponse } {
  const expected = process.env.BACKUP_SECRET;

  if (!expected) {
    return {
      ok: false,
      response: securityHeaders(
        NextResponse.json(
          { ok: false, message: "Backup is not configured on this deployment." },
          { status: 503 },
        ),
      ),
    };
  }

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : header;

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const authorized = a.length === b.length && timingSafeEqual(a, b);

  if (!authorized) {
    return {
      ok: false,
      response: securityHeaders(
        NextResponse.json({ ok: false, message: "Unauthorized." }, { status: 401 }),
      ),
    };
  }

  return { ok: true };
}

/** POST — run the backup and push it to configured off-site storage. */
export async function POST(request: NextRequest) {
  const auth = authorize(request);
  if (auth.ok === false) return auth.response;

  try {
    const result = await runBackup();

    if (!result.destination) {
      return securityHeaders(
        NextResponse.json({
          ok: true,
          uploaded: false,
          message:
            "Snapshot built successfully but no off-site storage is configured. Set BACKUP_S3_* to upload.",
          ...result,
        }),
      );
    }

    return securityHeaders(NextResponse.json({ ok: true, uploaded: true, ...result }));
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Backup failed." },
        { status: 500 },
      ),
    );
  }
}

/** GET — download the snapshot directly, for manual/off-cycle copies. */
export async function GET(request: NextRequest) {
  const auth = authorize(request);
  if (auth.ok === false) return auth.response;

  try {
    const { body } = await buildSnapshot();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Content-Disposition": `attachment; filename="tranquillo-green-snapshot-${stamp}.ndjson"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return securityHeaders(
      NextResponse.json(
        { ok: false, message: error instanceof Error ? error.message : "Backup failed." },
        { status: 500 },
      ),
    );
  }
}
