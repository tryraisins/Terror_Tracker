import assert from "node:assert/strict";
import { incidentDateIntervalsOverlap, normalizeIncidentDate } from "../src/lib/incident-date";
import { screenIncidentCandidate } from "../src/lib/incident-scope";

assert.equal(screenIncidentCandidate({
  title: "Political thugs torch party office in Rivers",
  description: "A coordinated group of political thugs set the party secretariat ablaze after arriving in several vehicles.",
}), null);

assert.equal(screenIncidentCandidate({
  title: "Party supporters attack campaign convoy in Kogi",
  description: "Organized party supporters assaulted campaign workers and damaged their vehicles.",
}), null);

assert.notEqual(screenIncidentCandidate({
  title: "Man vandalizes billboard in Lagos",
  description: "Police arrested one person over isolated damage to a billboard.",
}), null);

assert.notEqual(screenIncidentCandidate({
  title: "Group damages shops after argument",
  description: "A crowd damaged two shops during a sudden argument.",
}), null);

assert.notEqual(screenIncidentCandidate({
  title: "Party threatens protest over election result",
  description: "The party issued a statement but no attack occurred.",
}), null);

const month = normalizeIncidentDate({ date: "2026-04-19T00:00:00.000Z", datePrecision: "month_only" });
assert(month);
assert.equal(month.date.toISOString(), "2026-04-01T00:00:00.000Z");
assert.equal(month.dateRange?.end.toISOString(), "2026-04-30T23:59:59.999Z");

const range = normalizeIncidentDate({
  datePrecision: "date_range",
  dateRange: { start: "2026-04-28T00:00:00.000Z", end: "2026-05-02T00:00:00.000Z" },
});
assert(range);
assert(incidentDateIntervalsOverlap(month, range));

assert.equal(normalizeIncidentDate({ datePrecision: "unknown", date: "2026-04-01T00:00:00.000Z" }), null);
assert.equal(normalizeIncidentDate({ datePrecision: "date_range", dateRange: { start: "2026-05-02", end: "2026-04-28" } }), null);

console.log("Incident eligibility and date uncertainty policy checks passed.");
