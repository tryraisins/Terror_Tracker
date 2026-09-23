import assert from "node:assert/strict";
import {
  isPublishedWithinDiscoveryHorizon,
  isTransientArticleFetchStatus,
} from "../src/lib/search-led-discovery";

const now = new Date("2026-09-23T12:00:00.000Z").getTime();
const recentWindowStart = now - 96 * 60 * 60 * 1000;

assert.equal(
  isPublishedWithinDiscoveryHorizon(new Date("2026-09-18T12:00:00.000Z"), now),
  true,
  "a week-old article may still report an incident inside the event-date window",
);
assert.equal(
  isPublishedWithinDiscoveryHorizon(new Date("2026-09-15T11:59:59.000Z"), now),
  false,
  "articles older than the publication horizon must be rejected",
);
assert.equal(
  isPublishedWithinDiscoveryHorizon(new Date("2026-09-24T00:00:00.000Z"), now),
  false,
  "future publication dates must be rejected",
);
assert.equal(
  isPublishedWithinDiscoveryHorizon(new Date("invalid"), now),
  false,
  "invalid publication dates must be rejected",
);
assert.ok(recentWindowStart < now, "fixture event window is valid");

assert.equal(isTransientArticleFetchStatus(408), true);
assert.equal(isTransientArticleFetchStatus(429), true);
assert.equal(isTransientArticleFetchStatus(503), true);
assert.equal(isTransientArticleFetchStatus(403), false);
assert.equal(isTransientArticleFetchStatus(404), false);

console.log("Search-led retry/window policy checks passed.");
