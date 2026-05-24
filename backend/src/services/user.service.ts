import { db } from "../config/db";
import { users } from "../config/schema";
import { eq } from "drizzle-orm";

export type CreateUserInput = {
  name: string;
  role: "doctor" | "admin" | "reception";
  department: string | null;
};

export const createUser = async (user: CreateUserInput) => {
  const result = await db.insert(users).values(user).returning();
  return result[0];
};

export const listDoctors = async () => {
  return db
    .select({
      id: users.id,
      name: users.name,
      department: users.department,
    })
    .from(users)
    .where(eq(users.role, "doctor"));
};

export const getUserById = async (id: number) => {
  const result = await db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      department: users.department,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return result[0] ?? null;
};
