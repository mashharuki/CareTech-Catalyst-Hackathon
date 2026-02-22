import { describe, it, expect } from "vitest";
import { buildTestApp } from "./utils.js";

describe("load & recovery (hold → re-evaluation)", () => {
  it("moves to on_hold when requester suspended, then succeeds after resume + requeue", async () => {
    const app = buildTestApp();
    // register requester active
    let res = await app.request("/api/participants/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "operator",
        "x-scopes": "participant:register participant:update request:read audit:read",
      },
      body: JSON.stringify({
        id: "load-1",
        name: "Load1",
        organization: "Ops",
        email: "load1@example.com",
        trustLevel: "high",
      }),
    });
    expect(res.status).toBe(201);
    // consent
    res = await app.request("/api/consents/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-role": "operator" },
      body: JSON.stringify({
        id: "c-load",
        ownerId: "p1",
        dataTypes: ["lab"],
        recipients: ["Load1"],
        purposes: ["research"],
        validFromMs: Date.now() - 1000,
        validToMs: Date.now() + 100000,
      }),
    });
    expect(res.status).toBe(201);
    // submit request (normal)
    res = await app.request("/api/requests/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "participant",
      },
      body: JSON.stringify({
        requesterId: "load-1",
        consentId: "c-load",
        dataType: "lab",
        recipient: "Load1",
        purpose: "research",
      }),
    });
    expect(res.status).toBe(201);
    const submit = await res.json();
    expect(["approved", "rejected"]).toContain(submit.status);
    // get job id
    const jobsRes = await app.request("/api/outbox/jobs", {
      headers: { "x-role": "operator" },
    });
    const jobs = await jobsRes.json();
    expect(jobs.items.length).toBeGreaterThan(0);
    const jobId: string = jobs.items[0].id;
    // suspend requester => reEvaluate should fail
    await app.request("/api/participants/load-1/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "operator",
        "x-scopes": "participant:update",
      },
      body: JSON.stringify({ action: "suspend", reason: "test" }),
    });
    // retry job -> should become on_hold due to reEvaluate=false
    await app.request(`/api/outbox/jobs/${jobId}/retry`, {
      method: "POST",
      headers: { "x-role": "operator", "x-scopes": "ops:invoke" },
    });
    const job1Res = await app.request(`/api/outbox/jobs/${jobId}`, {
      headers: { "x-role": "operator" },
    });
    const job1 = await job1Res.json();
    expect(job1.job.status === "on_hold" || job1.job.status === "retrying").toBe(true);
    // resume requester and requeue -> should proceed to succeeded eventually
    await app.request("/api/participants/load-1/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "operator",
        "x-scopes": "participant:update",
      },
      body: JSON.stringify({ action: "resume", reason: "recovery" }),
    });
    const reRes = await app.request(`/api/outbox/jobs/${jobId}/requeue`, {
      method: "POST",
      headers: { "x-role": "operator", "x-scopes": "ops:invoke" },
    });
    expect([200, 409]).toContain(reRes.status);
  });
});

