import { test } from "node:test";
import assert from "node:assert/strict";
import { parseUsers } from "./parser.js";

const validUser = {
  id: 1,
  name: "Nora",
  city: "San Francisco",
  age: 39,
  friends: [{ name: "Grace", hobbies: ["Golf"] }],
};

test("parses a standard pretty-printed JSON array", () => {
  const body = JSON.stringify([validUser, { ...validUser, id: 2 }], null, 2);
  const users = parseUsers(body);
  assert.equal(users.length, 2);
  assert.equal(users[0].name, "Nora");
});

test("parses a compact JSON array with no whitespace", () => {
  const body = JSON.stringify([validUser]);
  assert.equal(parseUsers(body).length, 1);
});

test("parses compact newline-delimited JSON objects (no array, no commas)", () => {
  const body =
    JSON.stringify(validUser) + "\n" + JSON.stringify({ ...validUser, id: 2 });
  const users = parseUsers(body);
  assert.equal(users.length, 2);
});

test("parses pretty-printed newline-delimited JSON objects", () => {
  const body =
    JSON.stringify(validUser, null, 2) +
    "\n" +
    JSON.stringify({ ...validUser, id: 2 }, null, 2);
  const users = parseUsers(body);
  assert.equal(users.length, 2);
});

test("returns an empty list for an empty body", () => {
  assert.deepEqual(parseUsers(""), []);
});

test("returns an empty list for a plain-text error response", () => {
  assert.deepEqual(parseUsers("500 - Something bad happened!"), []);
});

test("skips values that parse as JSON but aren't user-shaped, keeps the valid ones", () => {
  const body =
    JSON.stringify({ notAUser: true }) + "\n" + JSON.stringify(validUser);
  const users = parseUsers(body);
  assert.equal(users.length, 1);
  assert.equal(users[0].name, "Nora");
});

test("handles a single JSON object with no enclosing array", () => {
  assert.equal(parseUsers(JSON.stringify(validUser)).length, 1);
});

test("does not get confused by braces inside string values", () => {
  const trickyUser = {
    ...validUser,
    name: "Nora {the tricky one}",
  };
  const body = JSON.stringify(trickyUser);
  const users = parseUsers(body);
  assert.equal(users.length, 1);
  assert.equal(users[0].name, "Nora {the tricky one}");
});
