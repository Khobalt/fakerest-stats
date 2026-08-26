import { test } from "node:test";
import assert from "node:assert/strict";
import { User } from "./types.js";
import {
  averageAgePerCity,
  averageFriendsPerCity,
  userWithMostFriendsPerCity,
  mostCommonFirstName,
  mostCommonHobbyOfFriends,
} from "./stats.js";

const users: User[] = [
  {
    id: 1,
    name: "Nora",
    city: "San Francisco",
    age: 30,
    friends: [
      { name: "Grace", hobbies: ["Golf", "Fishing"] },
      { name: "Daniel", hobbies: ["Fishing"] },
    ],
  },
  {
    id: 2,
    name: "Nora",
    city: "San Francisco",
    age: 40,
    friends: [{ name: "Leo", hobbies: ["Fishing"] }],
  },
  {
    id: 3,
    name: "Victoria",
    city: "Chicago",
    age: 50,
    friends: [],
  },
];

test("averageAgePerCity averages correctly within each city", () => {
  const result = averageAgePerCity(users);
  assert.equal(result["San Francisco"], 35);
  assert.equal(result["Chicago"], 50);
});

test("averageFriendsPerCity averages friend counts within each city", () => {
  const result = averageFriendsPerCity(users);
  assert.equal(result["San Francisco"], 1.5);
  assert.equal(result["Chicago"], 0);
});

test("userWithMostFriendsPerCity picks the right user per city", () => {
  const result = userWithMostFriendsPerCity(users);
  assert.equal(result["San Francisco"].name, "Nora");
  assert.equal(result["San Francisco"].id, 1);
  assert.equal(result["San Francisco"].friendCount, 2);
  assert.equal(result["Chicago"].id, 3);
  assert.equal(result["Chicago"].friendCount, 0);
});

test("mostCommonFirstName finds the name appearing most often", () => {
  assert.equal(mostCommonFirstName(users), "Nora");
});

test("mostCommonFirstName returns null for an empty list", () => {
  assert.equal(mostCommonFirstName([]), null);
});

test("mostCommonHobbyOfFriends aggregates hobbies across every friend of every user", () => {
  // Fishing appears 3 times (Grace, Daniel, Leo), Golf once.
  assert.equal(mostCommonHobbyOfFriends(users), "Fishing");
});

test("mostCommonHobbyOfFriends returns null when nobody has any friends", () => {
  const lonely: User[] = [
    { id: 1, name: "Solo", city: "Nowhere", age: 20, friends: [] },
  ];
  assert.equal(mostCommonHobbyOfFriends(lonely), null);
});
