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

## Continued, after the initial build (review and submission hygiene)

The build itself was the smaller part of the actual work. Most of the
session was spent on review, and that's where the more substantive
direction happened:

5. **"Make a checklist of all the requirements"**, then **"track that in a
   doc"**. Verified against the assignment's actual stated requirements
   (not assumed from memory) and saved as `CHECKLIST.md`.

6. **"I think it should be in the project. I want things to talk about
   with the team. Any requirement against that?"** Checked the assignment
   instructions specifically for a constraint against extra files, found
   none, moved the checklist from private notes into the tracked
   submission on that basis, not just because it was asked.

7. **"Do you think we should squash the commits? ... Actually, for this
   one I would like to squash, but not for everything going forward after
   that. (This would just be like the start of the post mortem to show my
   thinking)"** A deliberate, scoped call on commit hygiene, clean up one
   specific piece of back-and-forth, keep the rest of the history real.

8. **"Seems that you're building on top of their repo, do they want that
   or a clean new repo?"** Caught that the working repo still carried
   BrightSign's own commit history and a BrightSign engineer's name
   underneath the submitted work, not something the agent had flagged on
   its own. Result: rebuilt as a clean repo with no inherited history.

9. **"Hmmm... seems we have some PII in here (not good for the public
   repo)"**, followed by **"That itself is public though"** after the
   first fix only removed the content in a later commit. The second catch
   is the sharper one: recognized that removing something in git doesn't
   remove it from history, the earlier commit was still fully visible.
   Fixed by rewriting history rather than patching over it, since nothing
   had been pushed yet.

10. **"Okay. So let's do a little meta project work here. Um, some things
    I'm noticing. Her email said submit for... via Greenhouse. The test
    itself says push a public repo. ... Was there anything else to flag?
    And perhaps we should have some questions ready, prepare for
    questions ourselves."** Stepped back from the coding work entirely to
    treat the assignment as a real process to give feedback on, not just
    a test to pass: caught the Greenhouse/GitHub submission-channel
    ambiguity and the role-name mismatch (the repo says "Senior Software
    Engineer (cloud)," the actual role in play is different) independently,
    then asked for both constructive feedback for the team and honest
    self-prep for the follow-up call. Saved as `FEEDBACK_AND_PREP.md`,
    kept private since half of it is call prep, not something to hand
    them ahead of the actual conversation.

11. **"I'm sure the flakiness was intentional."** A confident, correct
    read on the endpoint's design, used to sharpen the feedback point
    about it in `FEEDBACK_AND_PREP.md` from an open question into a
    specific recommendation.

12. **"Hmmm... PROMPTS.md is a little... unflattering"** The reason this
    section exists: the original version stopped after the build phase
    and made the process look like minimal direction followed by the
    agent doing everything unsupervised. It undersold what actually
    happened, which is documented above.

13. **"Um, you know, they're using jq for testing. Shouldn't we have some
    of our own tests in here?"** Caught that the solution had zero
    automated tests, correctness had only been verified by hand during
    development. Result: a 16-test suite (`src/parser.test.ts`,
    `src/stats.test.ts`) covering the parser against every response
    shape actually observed from the live endpoint, plus the stats
    calculations against fixture data. Deliberately not testing against
    the live endpoint directly, since its responses aren't reproducible
    on demand, that's exactly why the earlier manual verification wasn't
    enough on its own.

14. **"Remember to keep prompts updated."** Not a one-off fix, a standing
    instruction: this file gets a new entry as the work happens, not
    reconstructed from memory after the fact.

15. **"Do you think we hit their API enough to catch different cases?"**
    A fair challenge to the confidence level in the README. Ran a larger
    batch of live probes (~40 more calls) specifically to check, and it
    surfaced two real gaps: a response shape never seen before (a raw,
    embedded transcript of an unrelated HTTP 400 error, headers and HTML
    included, no JSON characters anywhere in it), and proof that the
    "500 - Something bad happened!" text isn't always paired with an
    HTTP 200 status as the README had claimed, sometimes it comes with a
    genuine HTTP 500. The client's existing logic already handled both
    correctly (no JSON braces means zero users either way, and
    `!response.ok` already catches a real 500 regardless of body
    content), but the README's confidence was overstated relative to
    what had actually been verified. Fixed the documentation, added the
    new case as a test fixture. Good example of the difference between
    "the code happens to work" and "the code is verified to work for a
    documented reason."

16. **"Obviously, we could go on doing that forever to test all the edge
    cases. But for this exercise, I think we've done enough, don't you?"**
    Agreed, with reasoning: the parser's robustness comes from being
    structurally format-agnostic, not from having enumerated every case,
    so more probing would mostly just re-confirm what the design already
    guarantees. Matches the assignment's own "don't make a career out of
    it" instruction. Stopped hunting for new response shapes at this
    point.

17. **"So I'm wondering if... we're always assuming that this API does
    come back or comes back in a timely manner... I'm not sure we did
    any retry logic... did we do anything with being a good citizen of
    the Internet?"** Retry logic already existed, but hadn't actually
    verified the timeout path worked, and hadn't checked for rate-limit
    signals at all. Checked both directly: the timeout genuinely fires
    and the CLI exits cleanly against a non-responsive host (worst case
    55-80 seconds across 5 retries), and no rate-limit headers were ever
    observed across ~70 requests, though absence of evidence isn't proof
    of absence. Switched backoff from linear to exponential as the more
    respectful default regardless, documented the verified timing and
    the lack-of-evidence caveat honestly rather than either overclaiming
    safety or ignoring the question.

18. **"In production, there's some things I would like to see out of an
    API like a swagger definition, versioning of their API. We'd
    probably wanna version ours too."** Identified the actual root cause
    behind needing to reverse-engineer the response format in the first
    place: no API contract or versioning on the endpoint at all. Added
    as an explicit, named limitation in the README's scope notes (not
    fixable by this client, but worth being honest about) and as
    specific feedback for the team in `FEEDBACK_AND_PREP.md`.

## What was left to agent judgment, not specified in any prompt

- Language choice (TypeScript, matching the assignment's stated
  preference and the rest of Lee's own recent stack)
- The specific parsing strategy (a single-pass top-level-JSON-value
  extractor, rather than e.g. trying JSON.parse then falling back to
  line-by-line NDJSON parsing as two separate code paths)
- Retry count and backoff strategy for the endpoint's flakiness
- Which of the optional/extra-credit calculations to include (all three)
- The structure and content of the README, this file, and CLAUDE.md
