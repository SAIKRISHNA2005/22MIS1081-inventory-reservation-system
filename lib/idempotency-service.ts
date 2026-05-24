import { redis } from "@/lib/redis";

// Idempotency is best-effort: if Redis is unavailable, requests still proceed normally.
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24;

export async function getIdempotencyResult(
  key: string,
): Promise<{ status: number; body: unknown } | null> {
  try {
    const cached = await redis.get<{ status: number; body: unknown }>(
      `idempotency:${key}`,
    );
    return cached;
  } catch {
    return null;
  }
}

export async function saveIdempotencyResult(
  key: string,
  status: number,
  body: unknown,
): Promise<void> {
  try {
    await redis.set(`idempotency:${key}`, { status, body }, { ex: IDEMPOTENCY_TTL_SECONDS });
  } catch {
  }
}
