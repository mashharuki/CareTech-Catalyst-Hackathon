import { describe, it, expect } from "vitest";
import { buildTestApp } from "./utils.js";

describe("audit integrity", () => {
  it("verifies chain ok", async () => {
    const app = buildTestApp();
    // generate at least one event via participants register
    const res1 = await app.request("/api/participants/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "operator" },
      body: JSON.stringify({
        id: "au-1",
        name: "AU1",
        organization: "Ops",
        email: "au1@example.com",
        trustLevel: "high",
      }),
    });
    expect(res1.status).toBe(201);
    const res2 = await app.request("/api/audit/verify", {
      method: "POST",
      headers: { "x-role": "auditor" },
    });
    expect(res2.status).toBe(200);
    const body = await res2.json();
    expect(body.ok).toBe(true);
  });
});

