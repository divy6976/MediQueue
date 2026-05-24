import { sql } from "drizzle-orm";
import { db } from "../config/db";
import { patients, tokens, users } from "../config/schema";

export type AdminStats = {
  todayAppointments: number;
  patientsWaiting: number;
  activeDoctors: number;
  totalAdminStaff: number;
  departmentBreakdown: { name: string; percent: number; count: number }[];
};

export async function getAdminStats(): Promise<AdminStats> {
  const [
    todayAppointmentsRow,
    waitingRow,
    doctorsRow,
    adminRow,
    deptRows,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(tokens)
      .where(sql`${tokens.createdAt} >= date_trunc('day', now())`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(tokens)
      .where(sql`${tokens.status} = 'waiting'`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.role} = 'doctor'`),
    db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`${users.role} = 'admin'`),
    db
      .select({
        department: tokens.department,
        count: sql<number>`count(*)`,
      })
      .from(tokens)
      .where(sql`${tokens.status} = 'waiting'`)
      .groupBy(tokens.department)
      .orderBy(sql`count(*) desc`),
  ]);

  const todayAppointments = Number(todayAppointmentsRow[0]?.count ?? 0);
  const patientsWaiting = Number(waitingRow[0]?.count ?? 0);
  const activeDoctors = Number(doctorsRow[0]?.count ?? 0);
  const totalAdminStaff = Number(adminRow[0]?.count ?? 0);

  const totalWaitingAcrossDepts = deptRows.reduce((sum, r) => sum + Number(r.count ?? 0), 0);
  const departmentBreakdown = deptRows.map((r) => {
    const count = Number(r.count ?? 0);
    const percent = totalWaitingAcrossDepts > 0 ? Math.round((count / totalWaitingAcrossDepts) * 100) : 0;
    return {
      name: String(r.department ?? "").trim().toUpperCase(),
      count,
      percent,
    };
  });

  return {
    todayAppointments,
    patientsWaiting,
    activeDoctors,
    totalAdminStaff,
    departmentBreakdown,
  };
}

export type AdminUserRow = {
  id: number;
  name: string;
  role: string;
  department: string | null;
};

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  return db
    .select({
      id: users.id,
      name: users.name,
      role: users.role,
      department: users.department,
    })
    .from(users)
    .orderBy(users.id);
}

export async function getAdminCounts(): Promise<{ patients: number; tokens: number }> {
  const [patientsRow, tokensRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(patients),
    db.select({ count: sql<number>`count(*)` }).from(tokens),
  ]);

  return {
    patients: Number(patientsRow[0]?.count ?? 0),
    tokens: Number(tokensRow[0]?.count ?? 0),
  };
}

