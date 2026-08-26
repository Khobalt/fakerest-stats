# Agent setup notes

This solution was built with Claude Code (Sonnet 5), working directly in a
terminal session with shell, file read/write/edit, and web-fetch access. No
project-specific skills, custom subagents, or MCP servers were installed or
used for this task, it's a general-purpose coding session, not a
specialized one.

## How the session actually worked

1. Cloned the repo and read the real `README.md` directly rather than
   working from a paraphrase of the assignment.
2. Hit the live endpoint directly with `curl` several times before writing
   any code, to see what the data actually looked like. This is what
   surfaced the format inconsistency documented in the submission
   `README.md`, it wasn't something guessed at or assumed from the
   assignment text.
3. Probed further (more calls, checking HTTP status codes explicitly,
   inspecting raw bytes around a JSON parse error) once the first format
   inconsistency showed up, to characterize it properly instead of
   handling one observed case and calling it done.
4. Wrote the solution: a single-pass extractor that finds top-level JSON
   values regardless of how they're delimited, a stats module, and a CLI
   entry point with retry/backoff since the endpoint is genuinely flaky in
   practice, not just in theory.
5. Built and ran the compiled output against the live endpoint repeatedly
   to confirm it holds up across the range of response sizes and formats
   actually observed (30 users up to 200,000+ in different runs), and
   exercised the error paths directly (no argument given, unreachable
   host).
6. Wrote the documentation last, once the behavior it describes had
   actually been verified against the real endpoint rather than predicted.

No project rules file (`.clauderc`, custom slash commands, etc.) existed
for this repo before this session, this file is the first one.
