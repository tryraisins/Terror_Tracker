# Source access policy

The collector and scheduled discovery audit use an adaptive source policy. A publisher is not part of the active collection set merely because it is reputable or named in a discovery list.

## Active sources

`src/lib/news-source-registry.ts` contains the feeds that passed the 2026-09-07 direct-access audit. The runtime collector checks only those feeds, and `SourceHealth` acts as a circuit breaker: a failed request is recorded as `PAUSED` and is not retried on later runs until the source is deliberately revalidated and re-enabled.

The registry is evidence-dated. A later audit must replace or extend it only after a direct canary proves that the source is accessible and its publication window can be covered. HTTP 200 alone is not enough for scheduled-audit `PASS`.

## Suppressed sources

The registry also records hosts that were `FAILED_CHECK` or `UNRESOLVED` in the latest audit. The direct-source resolver returns `BLOCKED` without making another request for those hosts. This preserves the unresolved evidence boundary while avoiding repeated requests to surfaces that are currently refusing, rate-limiting, or not proving complete coverage.

## Expansion

New publishers are tested as one-request canaries, in small batches, after the verified set completes. A canary that fails, rate-limits, times out, or cannot prove complete coverage is logged and suppressed; it is not placed into the active feed set and is not retried in the same run. A canary becomes active only after a later direct check passes.

Search engines, social posts, trackers, and copied summaries remain lead sources only. They never bypass the direct-source access gate or create an incident record by themselves.
