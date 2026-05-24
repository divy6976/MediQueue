"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import { normalizeQueuePayload, type QueueToken } from "@/lib/queue";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Building2,
  ChevronDown,
  Clock,
  Hash,
  Info,
  LayoutGrid,
  MapPin,
  Stethoscope,
  Timer,
  User,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

type QueuePriority = "EMERGENCY" | "SENIOR" | "NORMAL";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const apiPriorityToUi = (p: string): QueuePriority => {
  const u = p.toUpperCase();
  if (u === "EMERGENCY") return "EMERGENCY";
  if (u === "SENIOR") return "SENIOR";
  return "NORMAL";
};

export default function DisplayPage() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [queue, setQueue] = useState<QueueToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<"connecting" | "open" | "closed">("connecting");
  const [now, setNow] = useState(() => new Date());
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDepartments() {
      try {
        const { data } = await axios.get<{ doctors: { department: string | null }[] }>(`${API_BASE}/user/doctors`);
        const list = Array.isArray(data.doctors) ? data.doctors : [];
        const unique = Array.from(
          new Set(
            list
              .map((d) => (d.department ?? "").trim().toUpperCase())
              .filter((d) => d.length > 0)
          )
        );
        if (cancelled) return;
        setDepartments(unique);
        setSelectedDepartment((prev) => prev || unique[0] || "");
      } catch (e) {
        if (!cancelled) setError("Failed to load departments.");
      }
    }
    void loadDepartments();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setQueue([]);
      setSseStatus("connecting");
      return;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setLoading(true);
    setError(null);
    setSseStatus("connecting");

    const es = new EventSource(
      `${API_BASE}/queue/stream/${encodeURIComponent(selectedDepartment)}`
    );
    eventSourceRef.current = es;

    es.onopen = () => setSseStatus("open");
    es.onerror = () => {
      setSseStatus("closed");
      setError("Live connection lost. Reconnecting…");
    };
    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data) as unknown;
        if (parsed && typeof parsed === "object" && "msg" in parsed) return;
        if (parsed && typeof parsed === "object" && "error" in parsed) {
          setError("Could not load waiting queue.");
          setLoading(false);
          return;
        }
        const next = normalizeQueuePayload(parsed);
        setQueue(next);
        setLoading(false);
        setError(null);
      } catch {
        // ignore malformed SSE payloads
      }
    };

    return () => {
      es.close();
      if (eventSourceRef.current === es) eventSourceRef.current = null;
    };
  }, [selectedDepartment]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const rows = useMemo(() => {
    return queue.map((t) => ({
      id: t.id,
      token: t.tokenNumber,
      patient: (t.patientName ?? "").trim() || "Patient",
      priority: apiPriorityToUi(t.priority),
      status: String(t.status ?? ""),
    }));
  }, [queue]);

  const waitingCount = rows.length;
  const activeDoctorsCount = 0;
  const inConsultationCount = 0;

  const timeText = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateText = now.toLocaleDateString("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "short",
  });

  return (
    <main className="min-h-screen w-full bg-slate-50 pb-12 md:pb-14">
      <div className="mx-auto max-w-[1400px] px-6 py-6 md:px-8 md:py-7">
        <div className="flex flex-col">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-xl bg-teal-50 p-2">
                <Activity className="h-6 w-6 text-teal-500" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
                  MediQueue · Live Board
                </h1>
                <p className="text-sm text-slate-500">Real-time patient queue display</p>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 md:gap-4">
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm md:px-4 md:py-2.5">
                <p className="text-lg font-semibold text-teal-600 md:text-xl">{timeText}</p>
                <p className="text-xs text-slate-500">{dateText}</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4 text-slate-500" />
                Exit
              </button>
            </div>
          </header>

          <section className="grid min-w-0 grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex min-h-[90px] min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-5 md:p-6">
              <div className="flex w-full items-center gap-3">
                <div className="rounded-lg bg-teal-50 p-2">
                  <Activity className="h-5 w-5 text-teal-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500">In Consultation</p>
                  <p className="text-2xl font-semibold text-slate-900 md:text-3xl">
                    {inConsultationCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex min-h-[90px] min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-5 md:p-6">
              <div className="flex w-full items-center gap-3">
                <div className="rounded-lg bg-teal-50 p-2">
                  <Users className="h-5 w-5 text-teal-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Patients Waiting</p>
                  <p className="text-2xl font-semibold text-slate-900 md:text-3xl">{waitingCount}</p>
                </div>
              </div>
            </div>

            <div className="flex min-h-[90px] min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-5 md:p-6">
              <div className="flex w-full items-center gap-3">
                <div className="rounded-lg bg-teal-50 p-2">
                  <Stethoscope className="h-5 w-5 text-teal-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Active Doctors</p>
                  <p className="text-2xl font-semibold text-slate-900 md:text-3xl">
                    {activeDoctorsCount}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-gray-100 p-2">
                  <LayoutGrid className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Select Department
                  </p>
                  <p className="text-sm text-slate-600">Choose a department to view its live queue</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <select
                    value={selectedDepartment}
                    onChange={(event) => setSelectedDepartment(event.target.value)}
                    className="min-w-56 appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-10 text-sm text-slate-800 shadow-sm outline-none ring-teal-500 transition focus:ring-2"
                  >
                    {departments.length === 0 ? (
                      <option value="">Loading…</option>
                    ) : (
                      departments.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQueue([]);
                    setSelectedDepartment("");
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <XCircle className="h-4 w-4 text-slate-500" />
                  Clear
                </button>
              </div>
            </div>
          </section>

          <section className="mt-4 mb-0 rounded-xl border border-red-100 bg-red-50/95 p-4 md:p-5">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="rounded-lg bg-white p-2">
                <Info className="h-5 w-5 text-red-600" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="font-semibold text-slate-900">How the queue order works</p>
                <p className="text-sm leading-relaxed text-slate-600">
                  Tokens are not always served in issue order. Emergency and senior-citizen patients
                  can be prioritized, followed by normal tokens in arrival sequence.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 w-full min-w-0">
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-3.5 md:px-6 md:py-4">
                <p className="text-base font-semibold text-slate-800">
                  {selectedDepartment ? selectedDepartment : "Select a department"} · Waiting Queue
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {loading
                    ? "Connecting…"
                    : sseStatus === "open"
                      ? `Live · ${waitingCount} waiting`
                      : `${waitingCount} waiting`}
                </p>
              </div>

              <div className="overflow-x-auto p-4 md:p-6">
                {error && (
                  <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </p>
                )}
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-4">#</th>
                      <th className="px-4 py-4">
                        <span className="flex items-center gap-2">
                          <Hash className="h-4 w-4 text-slate-500" />
                          Token
                        </span>
                      </th>
                      <th className="px-4 py-4">Patient</th>
                      <th className="px-4 py-4">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((item, index) => (
                      <tr key={item.id} className="text-sm text-slate-700">
                        <td className="px-4 py-4">{index + 1}</td>
                        <td className="px-4 py-4 font-semibold text-teal-700">{item.token}</td>
                        <td className="px-4 py-4 text-slate-700">{item.patient}</td>
                        <td className="px-4 py-4">
                          <span className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-slate-700">
                            {item.priority === "EMERGENCY" && (
                              <AlertTriangle className="h-4 w-4 text-rose-500" />
                            )}
                            {item.priority === "SENIOR" && (
                              <UserCheck className="h-4 w-4 text-amber-500" />
                            )}
                            {item.priority === "NORMAL" && <User className="h-4 w-4 text-slate-500" />}
                            {item.priority}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
