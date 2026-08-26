import { User, isUser } from "./types.js";

/**
 * The endpoint's response shape is not documented and, per observed
 * behavior, is not consistent between calls: it may return a proper JSON
 * array, newline-delimited JSON objects (compact or pretty-printed, with
 * no enclosing array and no commas), or occasionally an empty body or a
 * plain-text error string. This scans the raw text once and yields each
 * top-level JSON value (an object or array) it finds, ignoring anything
 * between them and ignoring text that isn't valid JSON at all.
 */
function* extractTopLevelJsonValues(text: string): Generator<string> {
  let depth = 0;
  let start = -1;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        yield text.slice(start, i + 1);
        start = -1;
      }
    }
  }
}

/**
 * Parses a response body into a flat list of users, regardless of whether
 * it arrived as a single JSON array or as newline-delimited JSON objects.
 * Values that parse but don't look like a user (missing expected fields)
 * are silently skipped rather than crashing the whole run, since a
 * malformed record shouldn't sink an otherwise-valid response.
 */
export function parseUsers(body: string): User[] {
  const users: User[] = [];

  for (const chunk of extractTopLevelJsonValues(body)) {
    let value: unknown;
    try {
      value = JSON.parse(chunk);
    } catch {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (isUser(item)) users.push(item);
      }
    } else if (isUser(value)) {
      users.push(value);
    }
  }

  return users;
}
