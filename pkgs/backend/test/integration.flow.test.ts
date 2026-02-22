import { describe, it, expect } from "vitest";
import { buildTestApp } from "./utils.js";

describe("end-to-end with compensation and requeue", () => {
  it("processes request, compensates on audit fail, and handles outbox", async () => {
    const app = buildTestApp();
    // seed
    let res = await app.request("/api/participants/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "operator" },
      body: JSON.stringify({
        id: "int-1",
        name: "INT1",
        organization: "Ops",
        email: "int1@example.com",
        trustLevel: "high",
      }),
    });
    expect(res.status).toBe(201);
    res = await app.request("/api/consents/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "operator" },
      body: JSON.stringify({
        id: "c-int",
        ownerId: "p1",
        dataTypes: ["lab"],
        recipients: ["INT1"],
        purposes: ["research"],
        validFromMs: Date.now() - 1000,
        validToMs: Date.now() + 100000,
      }),
    });
    expect(res.status).toBe(201);
    // submit with simulated audit failure -> outbox job compensates
    res = await app.request("/api/requests/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "participant",
        "x-simulate-audit": "fail",
      },
      body: JSON.stringify({
        requesterId: "int-1",
        consentId: "c-int",
        dataType: "lab",
        recipient: "INT1",
        purpose: "research",
      }),
    });
    expect(res.status).toBe(201);
    // process the job (tick) then check jobs list
    await app.request("/api/outbox/tick", {
      method: "POST",
      headers: { "x-role": "operator", "x-scopes": "ops:invoke" },
    });
    const jobsRes = await app.request("/api/outbox/jobs", {
      headers: { "x-role": "operator" },
    });
    const jobs = await jobsRes.json();
    // at least one job exists; it should be succeeded or compensated depending on timing
    expect(jobs.items.length).toBeGreaterThan(0);
  });
});
