import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const warehouses = await db.warehouse.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(warehouses);
}
