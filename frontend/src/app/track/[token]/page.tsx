"use client";

import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Loader2 } from "lucide-react";
import { getWaitingPosition, normalizeQueuePayload, type QueueToken } from "@/lib/queue";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

const DEPT_LABELS: Record<string, string> = {
  DENT: "Dental",
  ORTH: "Orthopedic",
  CARD: "Cardiology",
  NEUR: "Neurology",
  GEN: "General Medicine",
};

type TrackInfo = {
  token: {
    id: number;
    tokenNumber: string;
    department: string;
    status: string;
    priority: string;
    patientName: string | null;
  };
  department: string;
  position: number | null;
  patientsAhead: number | null;
  waitingCount: number;
};

export default function TrackTokenPage() {
  const params = useParams();
  const tokenParam = decodeURIComponent(String(params.token ?? "")).trim().toUpperCase();

  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [queueTokens, setQueueTokens] = useState<QueueToken[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sseStatus, setSseStatus] = useState<"connecting" | "open" | "closed">("connecting");

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!tokenParam) return;

    let cancelled = false;
    setLoadError(null);

    async function load() {
      try {
        const { data } = await axios.get<TrackInfo>(
          `${API_BASE}/token/track/${encodeURIComponent(tokenParam)}`
        );
        if (!cancelled) setTrackInfo(data);
      } catch (e) {
        if (cancelled) return;
        if (axios.isAxiosError(e) && e.response?.status === 404) {
          setLoadError("Token not found. Check the number on your slip.");
        } else {
          setLoadError("Could not load your token. Try again.");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tokenParam]);

  const department = trackInfo?.department ?? "";
  const tokenId = trackInfo?.token.id;

  useEffect(() => {
    if (!department || tokenId == null) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setSseStatus("connecting");
    const es = new EventSource(`${API_BASE}/queue/stream/${encodeURIComponent(department)}`);
    eventSourceRef.current = es;

    es.onopen = () => setSseStatus("open");
    es.onerror = () => setSseStatus("closed");

    es.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(evt.data) as unknown;
        if (parsed && typeof parsed === "object" && "msg" in parsed) return;
        setQueueTokens(normalizeQueuePayload(parsed));
      } catch {
        // ignore malformed SSE payloads
      }
    };

    return () => {
      es.close();
      if (eventSourceRef.current === es) eventSourceRef.current = null;
    };
  }, [department, tokenId]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const position = useMemo(() => {
    if (tokenId == null) return trackInfo?.position ?? null;
    return getWaitingPosition(queueTokens, tokenId) ?? trackInfo?.position ?? null;
  }, [queueTokens, tokenId, trackInfo?.position]);

  const status = trackInfo?.token.status?.toLowerCase() ?? "";
  const deptLabel = DEPT_LABELS[department] ?? department;

  const statusMessage = (() => {
    if (!trackInfo) return null;
    if (status === "in_progress") {
      return "Doctor is ready for you — please go to the counter now.";
    }
    if (status === "done" || status === "skipped") {
      return "Your visit for this token is complete.";
    }
    if (position == null) {
      return "You are not in the waiting queue right now.";
    }
    if (position === 1) {
      return "You are next in line. Please stay near the department.";
    }
    if (position === 2) {
      return "One patient ahead of you. Please be ready.";
    }
    return `${position - 1} patients ahead of you.`;
  })();

  return (
    <main className="min-h-screen bg-gradient-to-b from-teal-50 to-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2 text-teal-700">
          <Activity className="h-6 w-6" />
          <span className="text-lg font-bold text-slate-900">MediQueue</span>
        </div>

        {loadError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
            {loadError}
            <Link href="/reception" className="mt-4 block text-teal-700 underline">
              Back to reception
            </Link>
          </div>
        )}

        {!loadError && !trackInfo && (
          <div className="flex justify-center py-16 text-teal-600">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {trackInfo && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-100 bg-white p-6 shadow-md">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Your token
              </p>
              <p className="mt-1 text-3xl font-bold text-teal-600">{trackInfo.token.tokenNumber}</p>
              <p className="mt-2 text-sm text-slate-600">{deptLabel}</p>
              {trackInfo.token.patientName && (
                <p className="mt-1 text-sm text-slate-500">{trackInfo.token.patientName}</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-md">
              {position != null && status === "waiting" && (
                <p className="text-4xl font-bold text-slate-900">
                  #{position}
                  <span className="ml-2 text-base font-medium text-slate-500">in queue</span>
                </p>
              )}
              <p className="mt-3 text-sm text-slate-700">{statusMessage}</p>
              <p className="mt-2 text-xs text-slate-400">
                Live updates: {sseStatus === "open" ? "connected" : sseStatus}
              </p>
            </div>

            <p className="text-center text-xs text-slate-400">
              Keep this page open for live queue position updates.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
