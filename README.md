# fakerest-stats

A command-line REST client that queries the BrightSign take-home test endpoint,
parses the (inconsistently formatted) user data it returns, and reports
per-city statistics as JSON.

```
npm install
npm run build
node dist/index.js http://test.brightsign.io:3000
```

Or during development, skip the build step:

```
npm run dev -- http://test.brightsign.io:3000
```

## Tests

```
npm test
```

Covers the parser against every response shape actually observed from the
live endpoint (standard array, compact and pretty-printed newline-delimited
JSON, empty body, plain-text error, mixed valid/invalid records), plus the
stats calculations against known fixture data. Deliberately not testing
against the live endpoint directly, its responses aren't reproducible on
demand, which is exactly why the parser behavior needed to be locked in with
fixtures rather than relying on manual runs happening to hit each case.

## What it calculates

- Average age of all users, per city (required)
- Average number of friends, per city (required)
- The user with the most friends, per city (extra credit)
- The single most common first name across all users, all cities (extra credit)
- The single most common hobby among all friends of all users, all cities (extra credit)

Output is a single JSON object on stdout, meant to be piped into `jq`:

```
node dist/index.js http://test.brightsign.io:3000 | jq '.averageAgePerCity'
```

## Findings about the data (undocumented, reverse-engineered)

The endpoint returns an array of user objects:

```json
{
  "id": 12345,
  "name": "Nora",
  "city": "San Francisco",
  "age": 39,
  "friends": [
    { "name": "Grace", "hobbies": ["Golf", "Fishing"] }
  ]
}
```

`friends` entries have a name and a list of hobbies only, no age or city of
their own.

**The wire format is not consistent between calls.** Across roughly 70
probe requests total, the same endpoint returned all of the following:

- A standard JSON array, pretty-printed (`[\n  {\n    "id": ...`) or compact
- Newline-delimited JSON objects with no enclosing array and no commas
  between them, both compact (one object per line) and pretty-printed
  (each object spanning several lines)
- An empty response body
- A plain-text, non-JSON error string: `500 - Something bad happened!`
- A raw, embedded transcript of an unrelated HTTP error response (nginx
  headers plus an HTML 400 page, as literal text inside the body)

**Status codes are not reliable either, in either direction.** Most of the
malformed responses above (empty body, the plain-text error string, the
embedded-transcript case) came back with a 200 status, so status alone
doesn't mean the body is usable. But the plain-text error string was also
observed once with a genuine HTTP 500, so a non-200 status can't be
assumed to always carry a human-readable explanation either. The body has
to be inspected regardless of what the status code says, and a non-2xx
status has to be treated as a failure regardless of what the body contains.

Response size also varies enormously, from empty to 100,000+ user records
in a single call (and, under repeated rapid requests, response times
increase noticeably, worth knowing if hammering the endpoint quickly),
and the record count is different on every successful call.

## How the client handles this

`src/parser.ts` scans the raw response text once, tracking brace/bracket
depth and JSON string state, and extracts every top-level JSON value it
finds, whether that's one big array or a run of individual objects with no
separators. Each extracted value is parsed and, if it's an array, expanded;
if it's a single object, used directly. Anything that isn't valid JSON, or
parses but doesn't look like a user record, is skipped rather than crashing
the run.

If a request comes back with zero usable user records (empty body, error
text, or a response that parsed but contained nothing recognizable), the
client treats that as a failed attempt and retries with exponential
backoff, up to 5 attempts, before giving up and exiting non-zero with a
message on stderr. In practice this was needed, the endpoint fails often
enough that a single naive request regularly returns nothing useful.
Each request also has a 15-second timeout, verified directly against a
genuinely non-responsive host rather than assumed to work: worst case
across all 5 attempts is roughly 55-80 seconds before the client reports
failure and exits, a real wait, not instant, but it does reliably
terminate rather than hang.

No rate-limit response headers (`Retry-After`, `X-RateLimit-*`) were ever
observed from this endpoint across roughly 70 requests, and normal
response times were 0.2-2.3 seconds, so there's no evidence this specific
server enforces request limits. That's not the same as confirming it
doesn't, and exponential backoff (rather than immediately hammering
retries) is the more respectful default for a client talking to an API it
doesn't control, regardless of whether the server happens to enforce
anything.

## Security notes

- The endpoint is plain HTTP, not HTTPS, so a real deployment of a client
  like this should not assume the response is authentic or unaltered in
  transit. Not something this test server controls, but worth naming.
- The client only ever performs a `GET` against a URL the caller supplies
  on the command line, it doesn't execute, shell out to, or evaluate
  anything from the response body, so a malicious response can't do more
  than fail to parse.
- Response size isn't bounded before parsing. Given the observed sizes
  (into the tens of MB), a hostile server could send an arbitrarily large
  body to exhaust memory. A production version would cap response size and
  stream-parse rather than buffering the whole body, left out here to keep
  the solution focused on what the assignment asks for.
- No secrets, credentials, or user input beyond the endpoint URL are
  handled anywhere in this tool.
- Field-level validation on parsed records isn't just a shape check for its
  own sake. Two real gaps were found by deliberately testing what the
  parser lets through, not just what it's expected to receive, and fixed:
  a malformed entry inside a user's `friends` array (a bare `null` is
  valid JSON) used to reach stats code that assumed every friend had a
  `.hobbies` array, crashing the whole run; and a `city` value of exactly
  `"__proto__"` used to silently overwrite the result object's own
  prototype instead of appearing as a key, dropping that city from the
  output with no error. Both are now handled explicitly (`isFriend()` in
  `src/types.ts` filters malformed friend entries per-record instead of
  discarding the whole user; `Object.fromEntries()` in `src/stats.ts`
  builds the per-city results instead of bracket-assigning into a plain
  object literal), with regression tests reproducing each case.

## Notes on scope

Calculations 3-5 (most-friends-per-city, most-common-name, most-common-hobby)
are included as the extra credit the assignment invites, but kept to the
same style and size as the required two rather than expanded further.

Worth naming as a limitation of the exercise itself, not something this
client can fix: the endpoint has no OpenAPI/Swagger contract and no
versioning, which is the actual root cause behind needing to
reverse-engineer the response shape by hand in the first place. A real
production API would let a client distinguish "the response shape changed
on purpose" from "something upstream actually broke," this one doesn't,
so this client can only be defensive about it, not resolve it.
