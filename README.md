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

**The wire format is not consistent between calls.** Across a couple dozen
probe requests, the same endpoint returned all of the following:

- A standard JSON array, pretty-printed (`[\n  {\n    "id": ...`)
- Newline-delimited JSON objects with no enclosing array and no commas
  between them, both compact (one object per line) and pretty-printed
  (each object spanning several lines)
- An empty response body
- A plain-text, non-JSON error string: `500 - Something bad happened!`

**All of these came back with an HTTP 200 status.** The status code alone
does not indicate whether the body is usable, the body has to be inspected
regardless of what the response code says.

Response size also varies enormously, from empty to 100,000+ user records
in a single call, and the record count is different on every successful
call.

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
client treats that as a failed attempt and retries with linear backoff, up
to 5 attempts, before giving up and exiting non-zero with a message on
stderr. In practice this was needed, the endpoint fails often enough that a
single naive request regularly returns nothing useful.

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

## Notes on scope

Calculations 3-5 (most-friends-per-city, most-common-name, most-common-hobby)
are included as the extra credit the assignment invites, but kept to the
same style and size as the required two rather than expanded further.
