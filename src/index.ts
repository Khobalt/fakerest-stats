#!/usr/bin/env node
import { parseUsers } from "./parser.js";
import { User } from "./types.js";
import {
  averageAgePerCity,
  averageFriendsPerCity,
  userWithMostFriendsPerCity,
  mostCommonFirstName,
  mostCommonHobbyOfFriends,
} from "./stats.js";

const MAX_ATTEMPTS = 5;
const RETRY_BASE_DELAY_MS = 500;
const FETCH_TIMEOUT_MS = 15000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOnce(endpoint: string): Promise<User[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    const body = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const users = parseUsers(body);
    if (users.length === 0) {
      // The endpoint is observed to sometimes return HTTP 200 with an
      // empty body, or with a plain-text error message, or with JSON
      // that doesn't contain any recognizable user records. All of
      // these look identical from here: zero usable users.
      throw new Error("response contained no parseable user records");
    }

    return users;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fetches and parses the user list, retrying with backoff on transient
 * failures (network errors, empty/invalid bodies), since the endpoint is
 * observed to intermittently return unusable responses even with a 200
 * status.
 */
async function fetchUsers(endpoint: string): Promise<User[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await fetchOnce(endpoint);
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS) {
        // Exponential, not linear: this is someone else's server, no
        // evidence it enforces rate limits, but no evidence it doesn't
        // either, back off accordingly rather than assuming.
        await sleep(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
    }
  }

  throw new Error(
    `Failed to get a usable response from ${endpoint} after ${MAX_ATTEMPTS} attempts: ${
      lastError instanceof Error ? lastError.message : String(lastError)
    }`
  );
}

async function main(): Promise<void> {
  const endpoint = process.argv[2];

  if (!endpoint) {
    console.error("Usage: fakerest-stats <endpoint-url>");
    console.error("Example: fakerest-stats http://test.brightsign.io:3000");
    process.exitCode = 1;
    return;
  }

  let users: User[];
  try {
    users = await fetchUsers(endpoint);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  const result = {
    userCount: users.length,
    averageAgePerCity: averageAgePerCity(users),
    averageFriendsPerCity: averageFriendsPerCity(users),
    userWithMostFriendsPerCity: userWithMostFriendsPerCity(users),
    mostCommonFirstName: mostCommonFirstName(users),
    mostCommonHobbyOfFriends: mostCommonHobbyOfFriends(users),
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
