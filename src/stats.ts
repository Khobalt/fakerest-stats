import { User } from "./types.js";

function groupByCity(users: User[]): Map<string, User[]> {
  const byCity = new Map<string, User[]>();
  for (const user of users) {
    const group = byCity.get(user.city);
    if (group) {
      group.push(user);
    } else {
      byCity.set(user.city, [user]);
    }
  }
  return byCity;
}

function average(nums: number[]): number {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Required calculation #1: average age of all users, per city. */
export function averageAgePerCity(users: User[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [city, group] of groupByCity(users)) {
    result[city] = round2(average(group.map((u) => u.age)));
  }
  return result;
}

/** Required calculation #2: average number of friends, per city. */
export function averageFriendsPerCity(users: User[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [city, group] of groupByCity(users)) {
    result[city] = round2(average(group.map((u) => u.friends.length)));
  }
  return result;
}

/** Extra credit #3: the user with the most friends, per city. */
export function userWithMostFriendsPerCity(
  users: User[]
): Record<string, { name: string; id: number; friendCount: number }> {
  const result: Record<
    string,
    { name: string; id: number; friendCount: number }
  > = {};
  for (const [city, group] of groupByCity(users)) {
    const top = group.reduce((best, u) =>
      u.friends.length > best.friends.length ? u : best
    );
    result[city] = {
      name: top.name,
      id: top.id,
      friendCount: top.friends.length,
    };
  }
  return result;
}

function mostCommon(items: string[]): string | null {
  if (items.length === 0) return null;
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = -1;
  for (const [item, count] of counts) {
    if (count > bestCount) {
      best = item;
      bestCount = count;
    }
  }
  return best;
}

/** Extra credit #4: the most common first name across all users, all cities. */
export function mostCommonFirstName(users: User[]): string | null {
  return mostCommon(users.map((u) => u.name));
}

/** Extra credit #5: the most common hobby among all friends of all users, all cities. */
export function mostCommonHobbyOfFriends(users: User[]): string | null {
  const hobbies = users.flatMap((u) => u.friends.flatMap((f) => f.hobbies));
  return mostCommon(hobbies);
}
