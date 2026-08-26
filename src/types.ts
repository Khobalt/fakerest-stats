export interface Friend {
  name: string;
  hobbies: string[];
}

export interface User {
  id: number;
  name: string;
  city: string;
  age: number;
  friends: Friend[];
}

export function isUser(value: unknown): value is User {
  if (typeof value !== "object" || value === null) return false;
  const u = value as Record<string, unknown>;
  return (
    typeof u.id === "number" &&
    typeof u.name === "string" &&
    typeof u.city === "string" &&
    typeof u.age === "number" &&
    Array.isArray(u.friends)
  );
}
