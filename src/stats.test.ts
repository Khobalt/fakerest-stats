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

test("a city literally named \"__proto__\" is a normal key, not a prototype overwrite", () => {
  // City names come straight from the response body. Building the result
  // via `result[city] = value` on a plain object literal would run into
  // the inherited __proto__ accessor instead of adding a key, silently
  // dropping that city's data with no error. Confirm it round-trips like
  // any other city: present as an own key, and surviving JSON.stringify.
  const protoUsers: User[] = [
    {
      id: 1,
      name: "Eve",
      city: "__proto__",
      age: 99,
      friends: [{ name: "Mallory", hobbies: ["Golf"] }],
    },
    { id: 2, name: "Bob", city: "NYC", age: 40, friends: [] },
  ];

  const ages = averageAgePerCity(protoUsers);
  assert.equal(Object.getPrototypeOf(ages), Object.prototype);
  assert.deepEqual(Object.keys(ages).sort(), ["NYC", "__proto__"]);
  assert.equal(ages["__proto__"], 99);
  assert.equal(JSON.parse(JSON.stringify(ages))["__proto__"], 99);

  const friendsResult = userWithMostFriendsPerCity(protoUsers);
  assert.equal(Object.getPrototypeOf(friendsResult), Object.prototype);
  assert.equal(friendsResult["__proto__"].name, "Eve");
});

test("mostCommonHobbyOfFriends returns null when nobody has any friends", () => {
  const lonely: User[] = [
    { id: 1, name: "Solo", city: "Nowhere", age: 20, friends: [] },
  ];
  assert.equal(mostCommonHobbyOfFriends(lonely), null);
});
