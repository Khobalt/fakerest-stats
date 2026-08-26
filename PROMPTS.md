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

10. **"I'm sure the flakiness was intentional."** A confident, correct
    read on the endpoint's design (see `FEEDBACK_AND_PREP.md`), used to
    sharpen the feedback point about it from a question into a specific
    recommendation.

11. **"Hmmm... PROMPTS.md is a little... unflattering"** The reason this
    section exists: the original version stopped after the build phase
    and made the process look like minimal direction followed by the
    agent doing everything unsupervised. It undersold what actually
    happened, which is documented above.

## What was left to agent judgment, not specified in any prompt

- Language choice (TypeScript, matching the assignment's stated
  preference and the rest of Lee's own recent stack)
- The specific parsing strategy (a single-pass top-level-JSON-value
  extractor, rather than e.g. trying JSON.parse then falling back to
  line-by-line NDJSON parsing as two separate code paths)
- Retry count and backoff strategy for the endpoint's flakiness
- Which of the optional/extra-credit calculations to include (all three)
- The structure and content of the README, this file, and CLAUDE.md
