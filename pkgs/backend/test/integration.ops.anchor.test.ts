import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";
import { buildOpsRouter } from "../src/metrics.js";

vi.mock("../src/anchor.js", () => ({
  performAnchor: vi.fn().mockResolvedValue({
    txId: "a".repeat(64),
    blockHeight: 123n,
    lastAnchor: 0x1234n,
  }),
}));

describe("POST /api/ops/anchor", () => {
  let app: Hono;
  beforeEach(() => {
    app = new Hono();
    app.route("/api/ops", buildOpsRouter());
  });

  it("accepts valid request with role header and returns result", async () => {
    const res = await app.request("http://localhost/api/ops/anchor", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "system",
      },
      body: JSON.stringify({
        contractAddress: "0".repeat(64),
        hashHex: "0x1234",
      }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.ok).toBe(true);
    expect(json.result.txId).toMatch(/^[a-f0-9]{64}$/);
  });
});

