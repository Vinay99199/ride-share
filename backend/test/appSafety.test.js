import assert from "node:assert/strict";
import test from "node:test";
import app from "../src/app.js";

test("API responses include security headers, bounded body parsing, health, and JSON errors", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    const rootResponse = await fetch(`${baseUrl}/`);
    assert.equal(rootResponse.headers.get("x-powered-by"), null);
    assert.equal(rootResponse.headers.get("x-content-type-options"), "nosniff");

    const healthResponse = await fetch(`${baseUrl}/healthz`);
    assert.ok([200, 503].includes(healthResponse.status));
    const health = await healthResponse.json();
    assert.ok(["ok", "unavailable"].includes(health.status));

    const missingResponse = await fetch(`${baseUrl}/api/not-a-route`);
    assert.equal(missingResponse.status, 404);
    assert.deepEqual(await missingResponse.json(), {
      success: false,
      message: "API endpoint not found",
    });

    const malformedResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{invalid",
    });
    assert.equal(malformedResponse.status, 400);
    assert.deepEqual(await malformedResponse.json(), {
      success: false,
      message: "Invalid request body",
    });

    const registrationResponses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      registrationResponses.push(
        await fetch(`${baseUrl}/api/auth/register`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        })
      );
    }
    assert.deepEqual(
      registrationResponses.map((response) => response.status),
      [400, 400, 400, 400, 400, 429]
    );

    const otpResponses = [];
    for (let attempt = 0; attempt < 6; attempt += 1) {
      otpResponses.push(
        await fetch(`${baseUrl}/api/auth/verify-email`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        })
      );
    }
    assert.deepEqual(
      otpResponses.map((response) => response.status),
      [400, 400, 400, 400, 400, 429]
    );

    const oversizedResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ payload: "x".repeat(1024 * 1024) }),
    });
    assert.equal(oversizedResponse.status, 413);
    assert.deepEqual(await oversizedResponse.json(), {
      success: false,
      message: "Request body exceeds the 1 MB limit",
    });

    const rejectedOrigin = await fetch(`${baseUrl}/api/not-a-route`, {
      headers: { origin: "https://untrusted.example" },
    });
    assert.equal(rejectedOrigin.status, 403);
    assert.equal(rejectedOrigin.headers.get("access-control-allow-origin"), null);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
