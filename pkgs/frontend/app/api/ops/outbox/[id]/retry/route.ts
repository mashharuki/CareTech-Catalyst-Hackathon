import { NextRequest } from "next/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const res = await fetch(
    `http://localhost:3001/api/outbox/jobs/${encodeURIComponent(id)}/retry`,
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
