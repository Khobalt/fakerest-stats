# Submission checklist

Tracked against the assignment's actual stated requirements, kept in the
repo as a record of what was verified and how, not just asserted.

## Calculations

- [x] #1 (required) — average age of all users per city
- [x] #2 (required) — average number of friends per city
- [x] #3 (extra credit) — user with most friends per city
- [x] #4 (extra credit) — most common first name across all cities
- [x] #5 (extra credit) — most common hobby of all friends across all users

## Output

- [x] JSON on stdout, verified piping cleanly through `jq`

## Requirements

- [x] Simple REST implementation done ourselves, native `fetch`, no REST-client library doing the work
- [x] Command-line only, no GUI
- [x] Endpoint accepted as a CLI parameter (`process.argv[2]`)
- [x] Actually queries the API over the network (verified live, repeatedly)
- [x] Runs repeatedly and handles changing data correctly, tested across response sizes from 30 users to 200,000+
- [x] Handles reasonable error conditions, retry-with-exponential-backoff on empty/invalid/error responses, clean non-zero exit + stderr message on no-argument and unreachable-host cases, both tested directly
- [x] Timeout behavior verified directly against a genuinely non-responsive host, not just assumed (fires correctly, CLI exits cleanly, worst case 55-80s across 5 retries)
- [x] Checked for rate-limit signals (none observed across ~70 requests), backoff is exponential regardless as the respectful default
- [x] All source code in a public GitHub repository — pushed to https://github.com/Khobalt/fakerest-stats, verified public via `gh repo view`
- [x] Built assuming they'll clone and test it personally (`npm install && npm run build`, nothing exotic)
- [x] Unix philosophy, does one thing, clean JSON out, composable with `jq`
- [x] README explains the work and how to use it
- [x] Security discussed in README (plain HTTP endpoint, no shell/eval of response data, unbounded response size named as a real gap, no secrets involved)
- [x] Scoped reasonably, not gold-plated
- [x] Automated tests, not just manual verification, 17 tests covering the parser against every response shape actually observed plus the stats calculations against fixture data (`npm test`)

## Submission package

- [x] README
- [x] Source code + usage instructions
- [x] AI agent instruction file (`CLAUDE.md`), what was actually installed/used
- [x] `PROMPTS.md` with the real, verbatim prompts, not a cleaned-up fiction

## Beyond the stated requirements

Not asked for, done anyway because it made the submission more honest or
more maintainable, not because more is automatically better:

- **17 automated tests**, not just manual verification, covering every
  response shape actually observed live (JSON array, compact/pretty
  NDJSON, empty body, plain-text error, embedded raw-HTTP-transcript
  error) plus all five stats calculations against known fixtures.
- **Timeout and retry behavior verified directly**, not assumed: fired a
  real request at a genuinely non-responsive host to confirm the abort
  actually triggers and the CLI still exits cleanly rather than hanging.
- **Checked for rate-limit signals** (`Retry-After`, `X-RateLimit-*`)
  across roughly 70 live requests, found none, switched retry backoff
  from linear to exponential anyway as the more respectful default for
  a client hitting an API it doesn't control.
- **Went back and specifically tried to break the earlier findings**,
  not just confirm them: a larger follow-up batch of live probes
  surfaced a response shape not seen before and disproved an overclaimed
  README statement ("always HTTP 200"), both were corrected rather than
  left standing.
- **Clean git history verified, not assumed**: caught that the repo
  initially carried BrightSign's own commit history (a different
  person's name, attached to a solo submission) and, separately, that a
  first attempt at removing accidentally-included internal process
  details only removed them from the latest commit, not from history,
  both fixed by rebuilding rather than papering over.
- **Inline comments added specifically for handoff clarity**: the
  parser's core scanning function had docstrings explaining what and why
  at the function level, but no explanation of the actual state machine.
  Added targeted comments on the genuinely non-obvious parts (why string
  content is tracked separately from structural brackets) rather than
  commenting every line.
- **A self-review pass built specifically to not be trusted blindly**:
  a private, gitignored file with the exact commands needed to
  independently re-verify every claim above, plus an honest list of what
  remains genuinely unknown (whether the flakiness is really intentional
  or just a good guess, whether every response shape has actually been
  seen, whether the design choices here match what the reviewers
  actually want) rather than presenting everything as settled.

## Still open

- Submit the repo URL through the application process
