import { describe, it, expect } from "vitest";
import { buildTestApp } from "./utils.js";

describe("requests judgment", () => {
  it("returns approved and rejected by consent rule", async () => {
    const app = buildTestApp();
    // seed participant and consent
    let res = await app.request("/api/participants/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "operator" },
      body: JSON.stringify({
        id: "req-1",
        name: "Req1",
        organization: "Req",
        email: "req1@example.com",
        trustLevel: "high",
      }),
    });
    expect(res.status).toBe(201);
    res = await app.request("/api/consents/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "operator" },
      body: JSON.stringify({
        id: "c-judge",
        ownerId: "p1",
        dataTypes: ["lab"],
        recipients: ["Req1"],
        purposes: ["research"],
        validFromMs: Date.now() - 1000,
        validToMs: Date.now() + 100000,
      }),
    });
    expect(res.status).toBe(201);

    res = await app.request("/api/requests/submit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "participant" },
      body: JSON.stringify({
        requesterId: "req-1",
        consentId: "c-judge",
        dataType: "lab",
        recipient: "Req1",
        purpose: "research",
      }),
    });
    expect(res.status).toBe(201);
    let body = await res.json();
    expect(body.status).toBe("approved");

    res = await app.request("/api/requests/submit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "participant" },
      body: JSON.stringify({
        requesterId: "req-1",
        consentId: "c-judge",
        dataType: "imaging",
        recipient: "Req1",
        purpose: "research",
      }),
    });
    expect(res.status).toBe(201);
    body = await res.json();
    expect(body.status).toBe("rejected");
  });
});
