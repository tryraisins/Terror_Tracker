[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [string]$RunId = "google-resolution-$(Get-Date -Format 'yyyyMMddTHHmmssZ')",

  [ValidateSet("auto", "duckduckgo", "brave", "none")]
  [string]$SearchProvider = "duckduckgo",

  [int]$Concurrency = 12,
  [int]$TimeoutMs = 8000,
  [int]$SearchDelayMs = 350,
  [int]$Limit = 0,
  [switch]$TitleSearch,
  [switch]$OnlyUnresolved,
  [switch]$Apply
)

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$inputFullPath = (Resolve-Path (Join-Path $repoRoot $InputPath)).Path
$runDirectory = Join-Path $repoRoot (Join-Path "audit-2026\google-resolution-write" $RunId)
$resolvedPath = Join-Path $runDirectory "resolved-candidates.jsonl"
$resolutionLedgerPath = Join-Path $runDirectory "resolution-ledger.jsonl"
$resolutionSummaryPath = Join-Path $runDirectory "resolution-summary.json"
$manifestPath = Join-Path $runDirectory "promotion-manifest.json"

New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null

$resolverArguments = @(
  "run", "audit:resolve-google", "--",
  "--input=$inputFullPath",
  "--out=$resolvedPath",
  "--resolution-ledger=$resolutionLedgerPath",
  "--summary=$resolutionSummaryPath",
  "--concurrency=$Concurrency",
  "--timeout-ms=$TimeoutMs",
  "--search-delay-ms=$SearchDelayMs",
  "--search-provider=$SearchProvider"
)
if ($TitleSearch) {
  $resolverArguments += "--title-search"
} else {
  $resolverArguments += "--no-title-search"
}
if ($OnlyUnresolved) {
  $resolverArguments += "--only-unresolved"
}
if ($Limit -gt 0) {
  $resolverArguments += "--limit=$Limit"
}

Push-Location $repoRoot
try {
  & npm.cmd $resolverArguments
  if ($LASTEXITCODE -ne 0) { throw "Google source resolution failed with exit code $LASTEXITCODE." }

  & npm.cmd run audit:apply-google-resolution -- --input $resolvedPath --manifest $manifestPath --run-id $RunId
  if ($LASTEXITCODE -ne 0) { throw "Google source-resolution dry run failed with exit code $LASTEXITCODE." }

  if ($Apply) {
    & npm.cmd run audit:apply-google-resolution -- --input $resolvedPath --manifest $manifestPath --run-id $RunId --apply
    if ($LASTEXITCODE -ne 0) { throw "Google source-resolution apply failed with exit code $LASTEXITCODE." }

    & npm.cmd run audit:apply-google-resolution -- --input $resolvedPath --manifest $manifestPath --run-id $RunId --apply --idempotency-pass
    if ($LASTEXITCODE -ne 0) { throw "Google source-resolution idempotency pass failed with exit code $LASTEXITCODE." }
  }
} finally {
  Pop-Location
}

[pscustomobject]@{
  status = if ($Apply) { "applied-and-verified" } else { "dry-run-complete" }
  input = $inputFullPath
  resolved = $resolvedPath
  manifest = $manifestPath
  applyRequested = [bool]$Apply
} | ConvertTo-Json
