import { describe, expect, it } from "vitest";
import { buildTestApp } from "./utils.js";

describe("participants", () => {
  it("registers and updates participant", async () => {
    const app = buildTestApp();
    let res = await app.request("/api/participants/register", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "operator",
        "x-scopes": "participant:register participant:update request:read audit:read",
      },
      body: JSON.stringify({
        id: "org-1",
        name: "Org1",
        organization: "Org",
        email: "org1@example.com",
        trustLevel: "medium",
      }),
    });
    expect(res.status).toBe(201);
    res = await app.request("/api/participants/org-1/state", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-role": "operator",
        "x-scopes": "participant:update request:read audit:read",
      },
      body: JSON.stringify({
        action: "suspend",
        reason: "policy",
      }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.participant.status).toBe("suspended");
  });
});
