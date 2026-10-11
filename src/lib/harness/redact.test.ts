import { test } from "node:test";
import assert from "node:assert/strict";
import { redactEvidence } from "./redact";

test("browser evidence removes secrets from nested strings while retaining decision data", () => {
  const report = {
    accepted: false,
    steps: [
      {
        evidence: {
          sendError:
            "token private-token; mongodb+srv://user:password@example.test/db",
          eventId: "public-event-id",
        },
      },
    ],
  };
  const safe = redactEvidence(report, ["private-token"]);
  assert.equal(safe.accepted, false);
  assert.equal(safe.steps[0].evidence.eventId, "public-event-id");
  assert.equal(
    safe.steps[0].evidence.sendError,
    "token <redacted>; mongodb://<redacted>",
  );
  assert.ok(report.steps[0].evidence.sendError.includes("private-token"));
});
