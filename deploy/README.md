# Deploying Terror Tracker on the Contabo host

The app is one Next.js container behind Caddy, with Cloudflare proxying in front.
The scheduled scan runs as a second container from the same image, driven by a
systemd timer. Nothing in `deploy/` runs on a developer machine except the
verification steps at the bottom.

## Host layout

```
/srv/terror-tracker/
  compose.yaml          this directory
  .env.deploy           IMAGE_TAG, written by deploy.sh
  .current-tag          last known-good tag, written by deploy.sh
  deploy.sh
  run-scan.sh
  scan-alert.sh
  scan-deadman.sh
  search-lane-alert.sh
/etc/terror-tracker/
  app.env               600 root:root
  scan.env              600 root:root
/var/log/terror-tracker/
  reports/              latest.json plus a 30-day scan-<timestamp>.json archive
```

The report directory must be owned by the container user so the scan can write
and the app can read:

```bash
install -d -o 1000 -g 1000 /var/log/terror-tracker/reports
chown -R 1000:1000 /var/log/terror-tracker
```

## Install order

1. **Cloudflare.** Create the Origin Certificate covering
   `terrortracker.tryraisins.dev` and `new.tryraisins.dev`. Add both as proxied
   (orange cloud) A records to `185.216.203.128`. Set SSL/TLS mode to
   Full (strict). Add a Cache Rule: bypass cache for everything except
   `/_next/static/*`. Skip Bot Fight Mode on `/api/*`.
2. **Firewall.** Allow 80/443 from Cloudflare ranges only, so the origin cannot
   be reached directly and bypass the WAF. Keep 22 reachable.
3. **Caddy.** Merge `Caddyfile.snippet` into `/etc/caddy/Caddyfile` and reload.
4. **Secrets.** Create the two env files from `env/*.example`, mode 600, using
   values from the Netlify dashboard. `TURNSTILE_ALLOWED_HOSTNAMES` must list
   both hostnames. Verify the three `TURNSTILE_*` keys exist: `netlify env:list`
   does not show them, and without them admin login returns 503.
5. **Files.** Copy `compose.yaml`, `deploy.sh`, `run-scan.sh`, `scan-alert.sh`,
   `scan-deadman.sh`, `search-lane-alert.sh` into `/srv/terror-tracker/` and `chmod 755` the `.sh` files.
6. **First deploy.** `docker login ghcr.io` once, then
   `/srv/terror-tracker/deploy.sh <sha>`.
7. **Timers.** Copy `systemd/*` into `/etc/systemd/system/`, then:

```bash
systemctl daemon-reload
systemctl enable --now terror-scan.timer terror-scan-weekly.timer scan-deadman.timer
systemctl list-timers 'terror-*' 'scan-*'
```

8. **Only after the timers are live**, strip the `schedule:` block from
   `.github/workflows/daily-scan.yml`. Both schedules firing means two scans per
   slot; the dedup gate absorbs it, but it doubles Brave spend.

## Why the weekly window is a separate unit

The workflow computed a 336-hour lookback and `SEARCH_FRESHNESS=month` for the
Sunday catch-up slot (now 14:00 UTC, clear of the 08:00 and 20:00 UTC daily
slots). `run-scan.sh --weekly` passes those three values through `-e` so the
weekly catch-up behaves exactly as before. The two daily slots use the values in
`scan.env`.

## Alerts

| Unit | Sends through Resend | Arms a retry |
| --- | --- | --- |
| `terror-scan-alert.service` | yes | yes, 20 minutes |
| `terror-scan-alert-final.service` | yes | no, so no loop |
| `scan-deadman.service` | yes, if no report for 18h | n/a |

Both scripts read `/var/log/terror-tracker/reports/latest.json` and fall back to a
generic message when a run died before writing a report.

## Rollback

```bash
/srv/terror-tracker/deploy.sh <previous-sha>   # in .current-tag history
```

`deploy.sh` already reverts automatically when the readiness probe fails.

## Verification

```bash
# unit syntax
systemd-analyze verify /etc/systemd/system/terror-scan.service /etc/systemd/system/terror-scan.timer

# compose resolves with the real env files
cd /srv/terror-tracker && docker compose --env-file .env.deploy config >/dev/null

# app answers through the loopback port
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3001/api/attacks?limit=1

# nothing is publicly reachable except through Cloudflare
curl -s -o /dev/null -w '%{http_code}\n' --max-time 8 https://terrortracker.tryraisins.dev
```
