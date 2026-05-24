import dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { db } from "./config/db";
import { patients, tokens, users } from "./config/schema";

dotenv.config();

type SeedUser = {
  name: string;
  role: "doctor" | "admin" | "reception";
  department: string | null;
};

type SeedPatient = {
  name: string;
  age: number;
  phone: string;
};

type SeedToken = {
  tokenNumber: string;
  patientPhone: string;
  department: string;
  status: "waiting" | "IN_PROGRESS" | "DONE" | "SKIPPED";
  priority: "NORMAL" | "SENIOR" | "EMERGENCY";
};

const SEED_USERS: SeedUser[] = [
  { name: "Dr. Rohan Kapoor", role: "doctor", department: "DENT" },
  { name: "Dr. Ravi Patel", role: "doctor", department: "ORTH" },
  { name: "Dr. Nisha Verma", role: "doctor", department: "CARD" },
  { name: "Reception Desk", role: "reception", department: null },
  { name: "Admin", role: "admin", department: null },
];

const SEED_PATIENTS: SeedPatient[] = [
  { name: "Reshma Kumar", age: 45, phone: "+91 91234 56789" },
  { name: "Divy Prakash Pandey", age: 31, phone: "+91 91234 56780" },
  { name: "Amit Singh", age: 52, phone: "+91 76543 21098" },
  { name: "Ananya Verma", age: 29, phone: "+91 99887 65432" },
  { name: "Rahul Mehta", age: 34, phone: "+91 88761 23456" },
  { name: "Kritika Sharma", age: 41, phone: "+91 88761 23457" },
  { name: "Suresh Yadav", age: 63, phone: "+91 70000 00001" },
  { name: "Meera Joshi", age: 27, phone: "+91 70000 00002" },
  { name: "Farhan Ali", age: 38, phone: "+91 70000 00003" },
  { name: "Priya Nair", age: 56, phone: "+91 70000 00004" },
  // Extra 10 (new) patients for additional token rows
  { name: "Neha Gupta", age: 33, phone: "+91 70000 00005" },
  { name: "Vikram Shah", age: 47, phone: "+91 70000 00006" },
  { name: "Ishita Roy", age: 24, phone: "+91 70000 00007" },
  { name: "Karan Malhotra", age: 39, phone: "+91 70000 00008" },
  { name: "Ayesha Khan", age: 61, phone: "+91 70000 00009" },
  { name: "Manish Tiwari", age: 28, phone: "+91 70000 00010" },
  { name: "Pooja Srivastava", age: 52, phone: "+91 70000 00011" },
  { name: "Rajat Bansal", age: 36, phone: "+91 70000 00012" },
  { name: "Sana Ansari", age: 44, phone: "+91 70000 00013" },
  { name: "Deepak Chauhan", age: 58, phone: "+91 70000 00014" },
];

const SEED_TOKENS: SeedToken[] = [
  {
    tokenNumber: "DENT-001",
    patientPhone: "+91 91234 56789",
    department: "DENT",
    status: "waiting",
    priority: "NORMAL",
  },
  {
    tokenNumber: "DENT-002",
    patientPhone: "+91 91234 56780",
    department: "DENT",
    status: "IN_PROGRESS",
    priority: "SENIOR",
  },
  {
    tokenNumber: "DENT-003",
    patientPhone: "+91 76543 21098",
    department: "DENT",
    status: "waiting",
    priority: "EMERGENCY",
  },
  {
    tokenNumber: "ORTH-001",
    patientPhone: "+91 99887 65432",
    department: "ORTH",
    status: "waiting",
    priority: "NORMAL",
  },
  {
    tokenNumber: "CARD-001",
    patientPhone: "+91 88761 23456",
    department: "CARD",
    status: "waiting",
    priority: "SENIOR",
  },
  {
    tokenNumber: "CARD-002",
    patientPhone: "+91 88761 23457",
    department: "CARD",
    status: "SKIPPED",
    priority: "NORMAL",
  },
  {
    tokenNumber: "DENT-004",
    patientPhone: "+91 70000 00002",
    department: "DENT",
    status: "waiting",
    priority: "NORMAL",
  },
  {
    tokenNumber: "ORTH-002",
    patientPhone: "+91 70000 00001",
    department: "ORTH",
    status: "waiting",
    priority: "SENIOR",
  },
  {
    tokenNumber: "CARD-003",
    patientPhone: "+91 70000 00003",
    department: "CARD",
    status: "waiting",
    priority: "EMERGENCY",
  },
  {
    tokenNumber: "CARD-004",
    patientPhone: "+91 70000 00004",
    department: "CARD",
    status: "waiting",
    priority: "NORMAL",
  },
  // Extra 10 (new) token rows
  {
    tokenNumber: "DENT-010",
    patientPhone: "+91 70000 00005",
    department: "DENT",
    status: "waiting",
    priority: "SENIOR",
  },
  {
    tokenNumber: "DENT-011",
    patientPhone: "+91 70000 00006",
    department: "DENT",
    status: "waiting",
    priority: "NORMAL",
  },
  {
    tokenNumber: "ORTH-010",
    patientPhone: "+91 70000 00007",
    department: "ORTH",
    status: "waiting",
    priority: "EMERGENCY",
  },
  {
    tokenNumber: "ORTH-011",
    patientPhone: "+91 70000 00008",
    department: "ORTH",
    status: "waiting",
    priority: "NORMAL",
  },
  {
    tokenNumber: "CARD-010",
    patientPhone: "+91 70000 00009",
    department: "CARD",
    status: "waiting",
    priority: "SENIOR",
  },
  {
    tokenNumber: "CARD-011",
    patientPhone: "+91 70000 00010",
    department: "CARD",
    status: "waiting",
    priority: "NORMAL",
  },
  {
    tokenNumber: "DENT-012",
    patientPhone: "+91 70000 00011",
    department: "DENT",
    status: "waiting",
    priority: "EMERGENCY",
  },
  {
    tokenNumber: "ORTH-012",
    patientPhone: "+91 70000 00012",
    department: "ORTH",
    status: "waiting",
    priority: "SENIOR",
  },
  {
    tokenNumber: "CARD-012",
    patientPhone: "+91 70000 00013",
    department: "CARD",
    status: "waiting",
    priority: "EMERGENCY",
  },
  {
    tokenNumber: "CARD-013",
    patientPhone: "+91 70000 00014",
    department: "CARD",
    status: "waiting",
    priority: "NORMAL",
  },
];

async function ensureUser(u: SeedUser) {
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.name, u.name), eq(users.role, u.role)))
    .limit(1);

  if (existing.length > 0) return { created: false };

  await db.insert(users).values(u);
  return { created: true };
}

async function ensurePatient(p: SeedPatient) {
  const existing = await db
    .select({ id: patients.id })
    .from(patients)
    .where(eq(patients.phone, p.phone))
    .limit(1);

  if (existing.length > 0) return { created: false, id: existing[0].id };

  const inserted = await db.insert(patients).values(p).returning({ id: patients.id });
  return { created: true, id: inserted[0].id };
}

async function ensureToken(t: SeedToken, patientId: number) {
  const existing = await db
    .select({ id: tokens.id })
    .from(tokens)
    .where(eq(tokens.tokenNumber, t.tokenNumber))
    .limit(1);

  if (existing.length > 0) return { created: false };

  await db.insert(tokens).values({
    tokenNumber: t.tokenNumber,
    patientId,
    department: t.department,
    status: t.status,
    priority: t.priority,
  });

  return { created: true };
}

async function main() {
  let createdUsers = 0;
  let createdPatients = 0;
  let createdTokens = 0;

  for (const u of SEED_USERS) {
    const res = await ensureUser(u);
    if (res.created) createdUsers += 1;
  }

  const patientPhoneToId = new Map<string, number>();
  for (const p of SEED_PATIENTS) {
    const res = await ensurePatient(p);
    if (res.created) createdPatients += 1;
    patientPhoneToId.set(p.phone, res.id);
  }

  for (const t of SEED_TOKENS) {
    const patientId = patientPhoneToId.get(t.patientPhone);
    if (!patientId) continue;
    const res = await ensureToken(t, patientId);
    if (res.created) createdTokens += 1;
  }

  console.log(
    `Seed complete. Inserted users ${createdUsers}/${SEED_USERS.length}, patients ${createdPatients}/${SEED_PATIENTS.length}, tokens ${createdTokens}/${SEED_TOKENS.length}.`
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exitCode = 1;
});

