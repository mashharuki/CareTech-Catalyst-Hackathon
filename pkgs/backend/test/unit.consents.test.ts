import { describe, it, expect } from "vitest";
import { buildTestApp } from "./utils.js";

describe("consents evaluate", () => {
  it("rejects when consent not found, allows when matches", async () => {
    const app = buildTestApp();
    let res = await app.request("/api/consents/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "participant" },
      body: JSON.stringify({
        consentId: "missing",
        dataType: "lab",
        recipient: "X",
        purpose: "research",
      }),
    });
    expect(res.status).toBe(404);

    res = await app.request("/api/consents/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "operator" },
      body: JSON.stringify({
        id: "c-1",
        ownerId: "p1",
        dataTypes: ["lab"],
        recipients: ["Org"],
        purposes: ["research"],
        validFromMs: Date.now() - 1000,
        validToMs: Date.now() + 100000,
      }),
    });
    expect(res.status).toBe(201);

    res = await app.request("/api/consents/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "participant" },
      body: JSON.stringify({
        consentId: "c-1",
        dataType: "lab",
        recipient: "Org",
        purpose: "research",
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.allowed).toBe(true);
  });
});
