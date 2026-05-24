export type DbEnvCheck = {
  ok: boolean;
  databaseUrl: boolean;
  directUrl: boolean;
  hints: string[];
};

export function checkDbEnv(): DbEnvCheck {
  const hints: string[] = [];
  const databaseUrl = Boolean(process.env.DATABASE_URL?.trim());
  const directUrl = Boolean(process.env.DIRECT_URL?.trim());

  if (!databaseUrl) {
    hints.push("DATABASE_URL is missing. Set it in Vercel → Settings → Environment Variables, then redeploy.");
  }
  if (!directUrl) {
    hints.push("DIRECT_URL is missing. Required for prisma migrate deploy at build time.");
  }

  const url = process.env.DATABASE_URL ?? "";
  if (databaseUrl && url.includes(":5432") && !url.includes("pgbouncer=true")) {
    hints.push(
      "DATABASE_URL uses port 5432 without ?pgbouncer=true. On Vercel, use the pooled URL (port 6543 for Supabase) with ?pgbouncer=true&connection_limit=1.",
    );
  }

  return { ok: databaseUrl && directUrl, databaseUrl, directUrl, hints };
}
