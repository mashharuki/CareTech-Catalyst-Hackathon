import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const BASE =
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://localhost:3001";
  const res = await fetch(
    `${BASE}/api/outbox/jobs/${encodeURIComponent(id)}/retry`,
    {
      method: "POST",
      headers: {
        "x-role": "operator",
        "x-scopes": "ops:invoke",
      },
      cache: "no-store",
    },
  );
  const data = await res.json();
  return Response.json(data, { status: res.status });
}
