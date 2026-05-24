import { db } from "../config/db";
import { patients } from "../config/schema";

export const createPatient = async (patient: {
  name: string;
  age: number;
  phone: string;
}) => {
  const result = await db.insert(patients).values(patient).returning();
  return result[0];
};
