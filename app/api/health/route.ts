import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkDbEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const env = checkDbEnv();

  if (!env.ok) {
    return NextResponse.json(
      { ok: false, db: "misconfigured", env },
      { status: 503 },
    );
  }

  try {
    await db.$queryRaw`SELECT 1`;
    const productCount = await db.product.count();
    return NextResponse.json({
      ok: true,
      db: "connected",
      productCount,
      env: { databaseUrl: true, directUrl: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown database error";
    console.error("[health] database check failed:", err);
    return NextResponse.json(
      {
        ok: false,
        db: "error",
        error: message,
        env,
        hints: [
          "Verify DATABASE_URL is the pooled URL (Supabase port 6543 + ?pgbouncer=true&connection_limit=1).",
          "Verify DIRECT_URL is the direct URL (port 5432).",
          "Run `npx prisma migrate deploy` and `npx prisma db seed` against the production database.",
          "After changing env vars on Vercel, redeploy (env vars are not applied to existing deployments).",
        ],
      },
      { status: 503 },
    );
  }
}
