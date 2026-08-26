# Prompts used

This was a conversational session, not a single detailed spec handed to the
agent up front. The actual prompts, in order, verbatim:

1. **"Go check this out: https://github.com/brightsign/fakerest-test"**
   Agent fetched the repo, summarized what the assignment was (a take-home
   test for a different, more senior role than the one already in
   process), and asked whether this was something Lee had actually been
   assigned or just come across, since that changed what help made sense.

2. **"Yeah, check my email"**
   Agent searched the inbox, found the actual assignment email from the
   BrightSign recruiter (sent the night before), confirmed the real
   details: 60-minute target, explicit encouragement to use agentic AI
   tooling and document it, submission via Greenhouse, and a request for
   availability for a follow-up call.

3. **"Yeah, let's get it done. You can clone it"**
   Agent cloned the repository, read the actual `README.md` directly
   (rather than relying on the earlier summary), then investigated the
   live endpoint by hand with `curl` before writing any code. That's
   where the format inconsistency (JSON array vs. newline-delimited JSON
   vs. empty body vs. plain-text error, all under HTTP 200) got found,
   it wasn't specified in the prompt, it came from actually probing the
   endpoint repeatedly and noticing the responses didn't match each
   other. The agent then designed the parser, stats module, and CLI
   around that finding, built it, and tested it against the live
   endpoint multiple times (confirming behavior across response sizes
   from 30 users to 200,000+, and exercising the no-argument and
   unreachable-host error paths) before writing the documentation.

4. **"Make the dir local here instead of tmp"**
   Agent moved the working directory from a temporary scratch location
   into a persistent project folder, no code changes.

## What was left to agent judgment, not specified in any prompt

- Language choice (TypeScript, matching the assignment's stated
  preference and the rest of Lee's own recent stack)
- The specific parsing strategy (a single-pass top-level-JSON-value
  extractor, rather than e.g. trying JSON.parse then falling back to
  line-by-line NDJSON parsing as two separate code paths)
- Retry count and backoff strategy for the endpoint's flakiness
- Which of the optional/extra-credit calculations to include (all three)
- The structure and content of the README, this file, and CLAUDE.md
