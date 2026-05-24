"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";

const sidebarItems = ["Reception", "Doctor", "Admin", "Display Board"] as const;

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const barHeights = [
  { day: "Mon", newValue: "h-10", followups: "h-16" },
  { day: "Tue", newValue: "h-12", followups: "h-20" },
  { day: "Wed", newValue: "h-14", followups: "h-24" },
  { day: "Thu", newValue: "h-10", followups: "h-18" },
  { day: "Fri", newValue: "h-14", followups: "h-24" },
] as const;

type AdminStats = {
  todayAppointments: number;
  patientsWaiting: number;
  activeDoctors: number;
  totalAdminStaff: number;
  departmentBreakdown: { name: string; percent: number; count: number }[];
};

type AdminUserRow = {
  id: number;
  name: string;
  role: string;
  department: string | null;
};

const departmentColors = ["bg-emerald-500", "bg-amber-400", "bg-cyan-400", "bg-indigo-400"] as const;
const roleLabel = (role: string) => role.slice(0, 1).toUpperCase() + role.slice(1);

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const [{ data: statsData }, { data: usersData }] = await Promise.all([
          axios.get<{ stats: AdminStats }>(`${API_BASE}/admin/stats`),
          axios.get<{ users: AdminUserRow[] }>(`${API_BASE}/admin/users`),
        ]);
        if (cancelled) return;
        setStats(statsData.stats ?? null);
        setUsers(Array.isArray(usersData.users) ? usersData.users : []);
      } catch (e) {
        if (!cancelled) setError("Failed to load admin dashboard data.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const statCards = useMemo(() => {
    return [
      {
        title: "Today's Appointments",
        value: stats?.todayAppointments ?? "—",
        icon: "📅",
        cardStyle: "bg-amber-50 text-amber-700",
      },
      {
        title: "Patients Waiting",
        value: stats?.patientsWaiting ?? "—",
        icon: "🕘",
        cardStyle: "bg-cyan-50 text-cyan-700",
      },
      {
        title: "Active Doctors",
        value: stats?.activeDoctors ?? "—",
        icon: "🩺",
        cardStyle: "bg-emerald-50 text-emerald-700",
      },
      {
        title: "Total Admin Staff",
        value: stats?.totalAdminStaff ?? "—",
        icon: "👥",
        cardStyle: "bg-violet-50 text-violet-700",
      },
    ] as const;
  }, [stats]);

  const departments = useMemo(() => {
    const list = stats?.departmentBreakdown ?? [];
    return list.slice(0, 4).map((d, idx) => ({
      name: d.name,
      percent: `${d.percent}%`,
      color: departmentColors[idx] ?? "bg-slate-400",
    }));
  }, [stats]);

  const uiUsers = useMemo(() => {
    return users.map((u) => {
      const parts = String(u.name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const initials = (parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "");
      return {
        id: u.id,
        name: u.name,
        initials: initials.toUpperCase(),
        role: roleLabel(String(u.role ?? "")),
        department: u.department ?? "—",
        status: "Active",
      };
    });
  }, [users]);

  return (
    <div className="h-[calc(100dvh-70px)] bg-slate-100 overflow-hidden">
      <div className="flex h-full w-full overflow-hidden border border-slate-200 bg-white shadow-sm">
        <aside className="hidden h-full w-56 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col lg:px-5 lg:py-8">
          <p className="mb-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Menu</p>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = item === "Admin";
              return (
                <div
                  key={item}
                  className={`flex cursor-default items-center rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <span className="mr-3 text-sm text-slate-400">•</span>
                  {item}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex flex-1 flex-col overflow-hidden bg-slate-50 px-4 py-4 md:px-8 md:py-5">
          <section className="mb-4 shrink-0">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Welcome, Shruti Mehta 👋
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Monitor department statistics and manage users
            </p>
          </section>

          {error && (
            <section className="mb-4 shrink-0">
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            </section>
          )}

          <section className="mb-4 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <div
                key={card.title}
                className="rounded-xl bg-white p-4 shadow-md ring-1 ring-slate-100"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-600">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${card.cardStyle}`}
                  >
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section className="mb-4 grid shrink-0 gap-4 xl:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md xl:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-slate-900">
                  Appointments Overview
                </h2>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                    New
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    Follow-ups
                  </span>
                </div>
              </div>

              <div className="flex h-44 items-end justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 px-4 pb-4 pt-2">
                {barHeights.map((bar) => (
                  <div key={bar.day} className="flex flex-col items-center gap-2">
                    <div className="flex items-end gap-1">
                      <div className={`w-4 rounded-t-md bg-cyan-300 ${bar.newValue}`} />
                      <div
                        className={`w-4 rounded-t-md bg-emerald-400 ${bar.followups}`}
                      />
                    </div>
                    <p className="text-xs text-slate-500">{bar.day}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-md">
              <h2 className="mb-4 text-base font-semibold text-slate-900">
                Department Breakdown
              </h2>
              <div className="flex items-center gap-5">
                <div className="relative h-28 w-28 rounded-full bg-[conic-gradient(#10b981_0_40%,#fbbf24_40%_65%,#22d3ee_65%_85%,#818cf8_85%_100%)]">
                  <div className="absolute inset-5 rounded-full bg-white" />
                </div>
                <div className="space-y-2 text-sm">
                  {departments.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-slate-700">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      <span>
                        {item.name} {item.percent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-md">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Users Management</h2>
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  className="h-10 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white transition hover:bg-emerald-600"
                >
                  + Add User
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Department</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {uiUsers.map((user) => (
                    <tr key={user.id} className="text-slate-700">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                            {user.initials}
                          </div>
                          <span className="font-medium text-slate-800">{user.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">{user.role}</td>
                      <td className="px-3 py-3 text-slate-600">{user.department}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
