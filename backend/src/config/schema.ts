import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }),
});

export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  age: integer("age").notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  chiefComplaint: varchar("chief_complaint", { length: 500 }),
});

export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  tokenNumber: varchar("token_number", { length: 255 }).notNull(),
  patientId: integer("patient_id").references(() => patients.id),
  department: varchar("department", { length: 255 }).notNull(),
  status: varchar("status", { length: 255 }).notNull(),
  priority: varchar("priority", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  tokenId: integer("token_id").references(() => tokens.id),
  issueTime: timestamp("issue_time").notNull(),
  callTime: timestamp("call_time").notNull(),
  endTime: timestamp("end_time").notNull(),
});