import { User, isUser, isFriend } from "./types.js";

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
  // depth 0 means "not currently inside any {...} or [...]". Every time
  // depth returns to 0 after having gone above it, we've just closed a
  // complete top-level value, that's what gets yielded. This is what
  // lets a single pass handle both "[user, user, user]" (depth goes
  // 0->1 once, at the very end) and "user\nuser\nuser" with no
  // separators (depth returns to 0 after each one, yielding three).
  let depth = 0;
  let start = -1;

  // inString/escaped exist only so that characters like { or } *inside a
  // quoted string value* (e.g. a hobby literally named "Board Games {2}")
  // don't get counted as structural brackets. Without this, a brace
  // inside a string would desync the depth count and corrupt everything
  // after it. escaped tracks whether the current character is preceded
  // by an unescaped backslash, so an escaped quote (\") inside a string
  // doesn't get mistaken for the string actually ending.
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
      continue; // brackets/braces are ignored entirely while inside a string
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      if (depth === 0) start = i; // marks where this top-level value began
      depth++;
    } else if (ch === "}" || ch === "]") {
      depth--;
      if (depth === 0 && start !== -1) {
        // Back to top level: everything from `start` to here (inclusive)
        // is one complete, self-contained JSON value.
        yield text.slice(start, i + 1);
        start = -1;
      }
    }
  }
}

/**
 * isUser() only confirms `friends` is an array, not what's inside it, since
 * the server has been observed to send otherwise-well-formed users. A
 * malformed entry in that array (e.g. a bare `null`) is valid JSON and
 * would otherwise reach stats calculations that assume every friend has a
 * `.hobbies` array, crashing the whole run on what should be a skippable
 * bad record. Same "don't let one bad record sink an otherwise-valid
 * response" reasoning as the top-level skip below, just one level deeper:
 * drop only the malformed friends, not the whole user.
 */
function sanitizeFriends(user: User): User {
  return { ...user, friends: user.friends.filter(isFriend) };
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
        if (isUser(item)) users.push(sanitizeFriends(item));
      }
    } else if (isUser(value)) {
      users.push(sanitizeFriends(value));
    }
  }

  return users;
}
