import { redis } from "@/lib/redis";

const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24; // 24 hours

export async function getIdempotencyResult(
  key: string,
): Promise<{ status: number; body: unknown } | null> {
  try {
    const cached = await redis.get<{ status: number; body: unknown }>(
      `idempotency:${key}`,
    );
    return cached;
  } catch {
    return null; // Don't fail the request if Redis is unavailable
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
    // Don't fail the request if Redis is unavailable
  }
}
