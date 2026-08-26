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
- [x] Handles reasonable error conditions, retry-with-backoff on empty/invalid/error responses, clean non-zero exit + stderr message on no-argument and unreachable-host cases, both tested directly
- [ ] **All source code in a public GitHub repository, not done yet, waiting on go-ahead to push**
- [x] Built assuming they'll clone and test it personally (`npm install && npm run build`, nothing exotic)
- [x] Unix philosophy, does one thing, clean JSON out, composable with `jq`
- [x] README explains the work and how to use it
- [x] Security discussed in README (plain HTTP endpoint, no shell/eval of response data, unbounded response size named as a real gap, no secrets involved)
- [x] Scoped reasonably, not gold-plated
- [x] Automated tests, not just manual verification, 16 tests covering the parser against every response shape actually observed plus the stats calculations against fixture data (`npm test`)

## Submission package

- [x] README
- [x] Source code + usage instructions
- [x] AI agent instruction file (`CLAUDE.md`), what was actually installed/used
- [x] `PROMPTS.md` with the real, verbatim prompts, not a cleaned-up fiction

## Still open

- Create the public GitHub repo and push
- Submit the repo URL through the application process
