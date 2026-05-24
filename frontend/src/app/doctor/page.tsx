"use client";

import axios from "axios";
import { useEffect, useMemo, useRef, useState } from "react";

type Doctor = { id: number; name: string; department: string | null };

type QueueToken = {
  id: number;
  tokenNumber: string;
  department: string;
  priority: string;
  status: string;
  createdAt: string | Date;
  patientId: number | null;
  patientName?: string | null;
  patientAge?: number | null;
  patientPhone?: string | null;
};

type QueueRow = {
  token: string;
  name: string;
  ageOrPhone: string;
  priority: "Normal" | "Senior" | "Emergency";
  status: string;
  tokenId: number;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const apiPriorityToUi = (p: string): "Normal" | "Senior" | "Emergency" => {
  const u = p.toUpperCase();
  if (u === "EMERGENCY") return "Emergency";
  if (u === "SENIOR") return "Senior";
  return "Normal";
};

const normalizeQueuePayload = (payload: unknown): QueueToken[] => {
  if (Array.isArray(payload)) return payload as QueueToken[];
  if (payload && typeof payload === "object" && Array.isArray((payload as any).queue)) {
    return (payload as any).queue as QueueToken[];
  }
  return [];
};

const sidebarItems = ["Doctor", "Reception", "Admin", "Display Board"] as const;

const badgeStyles = {
  Emergency: "bg-red-50 text-red-600 ring-red-200",
  Senior: "bg-amber-50 text-amber-700 ring-amber-200",
  Normal: "bg-emerald-50 text-emerald-600 ring-emerald-200",
} as const;

export default function DoctorPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [nowServing, setNowServing] = useState<QueueToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<"connecting" | "open" | "closed">("connecting");

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDoctors() {
      try {
        const { data } = await axios.get<{ doctors: Doctor[] }>(`${API_BASE}/user/doctors`);
        if (cancelled) return;
        const list = Array.isArray(data.doctors) ? data.doctors : [];
        setDoctors(list);

        const saved = Number(localStorage.getItem("doctorId"));
        const initial =
          Number.isInteger(saved) && saved > 0 && list.some((d) => d.id === saved)
            ? saved
            : list[0]?.id ?? null;
        setSelectedDoctorId(initial);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load doctors.");
      }
    }

    void loadDoctors();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedDoctor = useMemo(
    () => doctors.find((d) => d.id === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId]
  );

  const department = useMemo(() => (selectedDoctor?.department ?? "").trim().toUpperCase(), [selectedDoctor]);

  useEffect(() => {
    if (!department) return;

    // If user switches doctor/department, clear any previously "Now Serving" token
    // so we don't show a token from a different department.
    setNowServing(null);

    // cleanup previous
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setSseStatus("connecting");
    setError(null);

    const es = new EventSource(`${API_BASE}/queue/stream/${encodeURIComponent(department)}`);
    eventSourceRef.current = es;

    es.onopen = () => setSseStatus("open");
    es.onerror = () => {
      setSseStatus("closed");
      // browser will auto-retry; keep UI informative
    };
    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data);
        if (parsed && typeof parsed === "object" && "msg" in parsed) return; // ignore connect message
        const next = normalizeQueuePayload(parsed);
        setQueueTokens(next);
      } catch {
        // ignore malformed
      }
    };

    return () => {
      es.close();
      if (eventSourceRef.current === es) eventSourceRef.current = null;
    };
  }, [department]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const queueRows: QueueRow[] = useMemo(() => {
    return queueTokens.map((t) => ({
      token: t.tokenNumber,
      name: t.patientName?.trim() || (t.patientId ? `Patient #${t.patientId}` : "Patient"),
      ageOrPhone:
        t.patientAge != null || (t.patientPhone ?? "").trim()
          ? [t.patientAge != null ? `${t.patientAge}y` : null, t.patientPhone?.trim() || null]
              .filter(Boolean)
              .join(" / ")
          : "—",
      priority: apiPriorityToUi(t.priority),
      status: t.status.toLowerCase() === "waiting" ? "In Queue" : t.status,
      tokenId: t.id,
    }));
  }, [queueTokens]);

  const nowServingDisplay = useMemo(() => {
    if (!nowServing) return null;
    const fromLive = queueTokens.find((t) => t.id === nowServing.id) ?? null;
    const patientName = (nowServing.patientName ?? fromLive?.patientName ?? "").trim();
    const patientAge = nowServing.patientAge ?? fromLive?.patientAge ?? null;
    const patientPhone = (nowServing.patientPhone ?? fromLive?.patientPhone ?? "").trim();
    const name = patientName || (nowServing.patientId ? `Patient #${nowServing.patientId}` : "Patient");
    const ageOrPhone =
      patientAge != null || patientPhone
        ? [patientAge != null ? `${patientAge}y` : null, patientPhone || null].filter(Boolean).join(" / ")
        : null;
    return { name, ageOrPhone };
  }, [nowServing, queueTokens]);

  const callNext = async () => {
    if (!department) return;
    setError(null);
    try {
      const { data } = await axios.post<{ token: QueueToken }>(`${API_BASE}/queue/call-next`, {
        department,
      });
      setNowServing(data.token ?? null);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const d = e.response?.data as { message?: string; error?: string } | undefined;
        setError(d?.message ?? d?.error ?? "Failed to call next patient.");
      } else {
        setError("Failed to call next patient.");
      }
    }
  };

  const complete = async (action: "DONE" | "SKIPPED") => {
    if (!nowServing?.id) return;
    setError(null);
    try {
      await axios.post(`${API_BASE}/queue/complete`, { tokenId: nowServing.id, action });
      setNowServing(null);
    } catch (e) {
      if (axios.isAxiosError(e)) {
        const d = e.response?.data as { message?: string; error?: string } | undefined;
        setError(d?.message ?? d?.error ?? "Failed to update token.");
      } else {
        setError("Failed to update token.");
      }
    }
  };

  return (
    <div className="h-[calc(100vh-70px)] bg-slate-100 overflow-hidden">
      <div className="flex h-full w-full overflow-hidden border border-slate-200 bg-white shadow-sm">
        <aside className="hidden h-full w-56 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col lg:px-5 lg:py-8">
          <p className="mb-6 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">Menu</p>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const isActive = item === "Doctor";
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

        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-50 px-4 py-5 md:px-8 md:py-6">
          <section className="mb-5">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Welcome{selectedDoctor ? `, ${selectedDoctor.name}` : ""} 👋
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Manage your patients and queue
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-700">Doctor</label>
              <select
                value={selectedDoctorId ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  const next = Number.isInteger(id) && id > 0 ? id : null;
                  setSelectedDoctorId(next);
                  if (next) localStorage.setItem("doctorId", String(next));
                }}
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
              >
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.department ? `(${d.department})` : ""}
                  </option>
                ))}
              </select>

              <span
                className={`text-xs font-medium ${
                  sseStatus === "open" ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                {department ? `Dept: ${department}` : "Pick a doctor"}
                {department ? ` • Live: ${sseStatus}` : ""}
              </span>
            </div>
          </section>

          <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-700">Now Serving</p>
                <p className="text-4xl font-bold tracking-tight text-slate-900">
                  {nowServing?.tokenNumber ?? "—"}
                </p>
                <p className="mt-2 text-2xl font-semibold text-slate-800">
                  {nowServingDisplay?.name ?? "—"}
                </p>
                {nowServingDisplay?.ageOrPhone && (
                  <p className="mt-1 text-sm text-slate-600">{nowServingDisplay.ageOrPhone}</p>
                )}
                <p className="mt-1 text-sm text-slate-600">
                  {nowServing ? `Priority: ${apiPriorityToUi(nowServing.priority)}` : "—"}
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 md:items-end">
                {nowServing && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                      badgeStyles[apiPriorityToUi(nowServing.priority)]
                    }`}
                  >
                    {apiPriorityToUi(nowServing.priority)}
                  </span>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={callNext}
                    disabled={!department}
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-600"
                  >
                    Call Next
                  </button>
                  <button
                    type="button"
                    onClick={() => complete("DONE")}
                    disabled={!nowServing}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Complete
                  </button>
                  <button
                    type="button"
                    onClick={() => complete("SKIPPED")}
                    disabled={!nowServing}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Skip
                  </button>
                </div>
              </div>
            </div>
            {error && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </section>

          <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Queue</h2>
              <button
                type="button"
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Live via SSE
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-3">Token</th>
                    <th className="px-3 py-3">Patient Name</th>
                    <th className="px-3 py-3">Age / Phone</th>
                    <th className="px-3 py-3">Priority</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {queueRows.map((row) => (
                    <tr key={row.token} className="text-slate-700">
                      <td className="px-3 py-3 font-medium text-emerald-700">{row.token}</td>
                      <td className="px-3 py-3">{row.name}</td>
                      <td className="px-3 py-3 text-slate-600">{row.ageOrPhone}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            badgeStyles[row.priority]
                          }`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                          {row.status}
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
