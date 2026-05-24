"use client";

import axios from "axios";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Crown,
  Hash,
  Phone,
  Plus,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Ticket,
  User,
} from "lucide-react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  ""
);

type Priority = "Normal" | "Senior" | "Emergency";
type Status = "Waiting" | "Done";

type Token = {
  code: string;
  name: string;
  department: string;
  room: string;
  priority: Priority;
  status: Status;
};

type DepartmentOption = {
  label: string;
  value: string;
  code: string;
};

type TriageSuggestion = {
  department: string;
  priority: string;
  reason: string;
};

const DEPARTMENTS: DepartmentOption[] = [
  { label: "Orthopedic", value: "Orthopedic", code: "ORTH" },
  { label: "Dental", value: "Dental", code: "DENT" },
  { label: "Cardiology", value: "Cardiology", code: "CARD" },
  { label: "Neurology", value: "Neurology", code: "NEUR" },
  { label: "General Medicine", value: "General Medicine", code: "GEN" },
];

const CODE_TO_DEPARTMENT_VALUE: Record<string, string> = {
  DENT: "Dental",
  ORTH: "Orthopedic",
  CARD: "Cardiology",
  NEUR: "Neurology",
  GEN: "General Medicine",
};

const PRIORITIES: Priority[] = ["Normal", "Senior", "Emergency"];

const priorityToApi = (p: Priority): string => {
  if (p === "Emergency") return "EMERGENCY";
  if (p === "Senior") return "SENIOR";
  return "NORMAL";
};

const apiToUiPriority = (raw: string): Priority => {
  const u = raw.toUpperCase();
  if (u === "EMERGENCY") return "Emergency";
  if (u === "SENIOR") return "Senior";
  return "Normal";
};

const initialFormState = {
  name: "",
  age: "",
  phone: "",
  chiefComplaint: "",
  department: "",
  priority: "Normal" as Priority,
};

const getPriorityClass = (priority: Priority) => {
  if (priority === "Emergency") return "bg-red-100 text-red-600";
  if (priority === "Senior") return "bg-yellow-100 text-yellow-600";
  return "bg-blue-100 text-blue-600";
};

const getStatusClass = (status: Status) => {
  if (status === "Done") return "bg-green-100 text-green-600";
  return "bg-gray-100 text-gray-600";
};

const getPriorityIcon = (priority: Priority) => {
  if (priority === "Emergency") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (priority === "Senior") return <Crown className="h-3.5 w-3.5" />;
  return <User className="h-3.5 w-3.5" />;
};

export default function ReceptionPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [formData, setFormData] = useState(initialFormState);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<TriageSuggestion | null>(null);
  const [suggestSource, setSuggestSource] = useState<"ai" | "rules" | null>(null);
  const [emergencyWarning, setEmergencyWarning] = useState(false);
  const [seniorHint, setSeniorHint] = useState(false);

  const departmentMap = useMemo(
    () =>
      DEPARTMENTS.reduce<Record<string, string>>((acc, item) => {
        acc[item.value] = item.code;
        return acc;
      }, {}),
    []
  );

  const applySuggestion = (suggestion: TriageSuggestion) => {
    const deptValue = CODE_TO_DEPARTMENT_VALUE[suggestion.department.toUpperCase()] ?? "";
    setFormData((prev) => ({
      ...prev,
      department: deptValue || prev.department,
      priority: apiToUiPriority(suggestion.priority),
    }));
  };

  const handleAiSuggest = async () => {
    setSuggestError(null);
    const complaint = formData.chiefComplaint.trim();
    if (!complaint) {
      setSuggestError("Pehle patient ki problem likho.");
      setTouched((prev) => ({ ...prev, chiefComplaint: true }));
      return;
    }

    const parsedAge = formData.age.trim() ? Number(formData.age) : undefined;
    if (parsedAge !== undefined && (Number.isNaN(parsedAge) || parsedAge <= 0)) {
      setSuggestError("Valid age daalo ya age khali chhod do.");
      return;
    }

    setIsSuggesting(true);
    try {
      const { data } = await axios.post<{
        suggestion: TriageSuggestion;
        source: "ai" | "rules";
        emergencyWarning: boolean;
        seniorHint: boolean;
      }>(`${API_BASE}/patient/suggest`, {
        chiefComplaint: complaint,
        age: parsedAge,
      });

      setAiSuggestion(data.suggestion);
      setSuggestSource(data.source);
      setEmergencyWarning(data.emergencyWarning);
      setSeniorHint(data.seniorHint);
      applySuggestion(data.suggestion);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data as { message?: string; error?: string } | undefined;
        setSuggestError(d?.error ?? d?.message ?? "AI suggest failed.");
      } else {
        setSuggestError("AI suggest failed.");
      }
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleGenerateToken = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);
    setSubmitError(null);

    if (
      !formData.name.trim() ||
      !formData.age.trim() ||
      !formData.phone.trim() ||
      !formData.chiefComplaint.trim() ||
      !formData.department
    ) {
      return;
    }

    const parsedAge = Number(formData.age);
    if (Number.isNaN(parsedAge) || parsedAge <= 0) {
      setSubmitError("Please enter a valid age.");
      return;
    }

    const departmentCode = departmentMap[formData.department] ?? "GEN";
    setIsSubmitting(true);

    try {
      const { data } = await axios.post<{
        message?: string;
        patient: { name: string };
        token: { tokenNumber: string; status: string; priority: string };
      }>(`${API_BASE}/patient/register`, {
        name: formData.name.trim(),
        age: parsedAge,
        phone: formData.phone.trim(),
        chiefComplaint: formData.chiefComplaint.trim(),
        department: departmentCode,
        priority: priorityToApi(formData.priority),
      });

      const roomNumber = (tokens.length % 12) + 1;
      const newToken: Token = {
        code: data.token.tokenNumber,
        name: data.patient.name,
        department: formData.department,
        room: `Room ${roomNumber}`,
        priority: apiToUiPriority(data.token.priority),
        status: "Waiting",
      };

      setTokens((prev) => [...prev, newToken]);
      setFormData(initialFormState);
      setTouched({});
      setIsSubmitted(false);
      setAiSuggestion(null);
      setSuggestSource(null);
      setEmergencyWarning(false);
      setSeniorHint(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string; error?: string } | undefined;
        const msg = data?.error ?? data?.message ?? err.message;
        setSubmitError(
          typeof msg === "string" && msg.length > 0 ? msg : "Failed to register patient."
        );
      } else {
        setSubmitError("Failed to register patient.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleStatus = (code: string) => {
    setTokens((prev) =>
      prev.map((token) =>
        token.code === code
          ? { ...token, status: token.status === "Waiting" ? "Done" : "Waiting" }
          : token
      )
    );
  };

  const hasError = (field: keyof typeof initialFormState) =>
    (isSubmitted || touched[field]) && !String(formData[field]).trim();

  const baseInputClass =
    "h-11 w-full rounded-xl border bg-white text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-transparent focus:ring-2 focus:ring-teal-400";

  return (
    <main className="min-h-[calc(100vh-70px)] bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <section className="mb-1">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl">
            Reception — Patient Registration
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Patient counter: register, AI Suggestion, confirm, then issue token.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-200 hover:shadow-lg sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Ticket className="h-5 w-5 text-gray-400" />
              New patient (reception desk)
            </h2>

            <form className="mt-6 space-y-5" onSubmit={handleGenerateToken}>
              <div>
                <label htmlFor="patient-name" className="mb-2 block text-sm font-medium text-gray-700">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    id="patient-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                    placeholder="e.g. Amit Singh"
                    className={`${baseInputClass} pl-10 pr-4 ${
                      hasError("name") ? "border-red-300" : "border-gray-200"
                    }`}
                    required
                  />
                </div>
                {hasError("name") && (
                  <p className="mt-1 text-xs text-red-500">This field is required</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="patient-age" className="mb-2 block text-sm font-medium text-gray-700">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="patient-age"
                      type="number"
                      min={0}
                      value={formData.age}
                      onChange={(e) => setFormData((prev) => ({ ...prev, age: e.target.value }))}
                      onBlur={() => setTouched((prev) => ({ ...prev, age: true }))}
                      placeholder="34"
                      className={`${baseInputClass} pl-10 pr-4 ${
                        hasError("age") ? "border-red-300" : "border-gray-200"
                      }`}
                      required
                    />
                  </div>
                  {hasError("age") && (
                    <p className="mt-1 text-xs text-red-500">This field is required</p>
                  )}
                </div>

                <div>
                  <label htmlFor="patient-phone" className="mb-2 block text-sm font-medium text-gray-700">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      id="patient-phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                      onBlur={() => setTouched((prev) => ({ ...prev, phone: true }))}
                      placeholder="+91..."
                      className={`${baseInputClass} pl-10 pr-4 ${
                        hasError("phone") ? "border-red-300" : "border-gray-200"
                      }`}
                      required
                    />
                  </div>
                  {hasError("phone") && (
                    <p className="mt-1 text-xs text-red-500">This field is required</p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="chief-complaint"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Patient problem (chief complaint) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Stethoscope className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="chief-complaint"
                    rows={3}
                    value={formData.chiefComplaint}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, chiefComplaint: e.target.value }));
                      setAiSuggestion(null);
                      setSuggestSource(null);
                    }}
                    onBlur={() => setTouched((prev) => ({ ...prev, chiefComplaint: true }))}
                    placeholder="e.g. daant me 3 din se dard, khana khaate waqt badhta hai"
                    className={`min-h-[88px] w-full resize-y rounded-xl border bg-white py-2.5 pl-10 pr-4 text-sm text-gray-800 placeholder:text-gray-400 outline-none transition-all focus:ring-2 focus:ring-teal-400 ${
                      hasError("chiefComplaint") ? "border-red-300" : "border-gray-200"
                    }`}
                    required
                  />
                </div>
                {hasError("chiefComplaint") && (
                  <p className="mt-1 text-xs text-red-500">Patient problem is required</p>
                )}

                <button
                  type="button"
                  onClick={() => void handleAiSuggest()}
                  disabled={isSuggesting || !formData.chiefComplaint.trim()}
                  className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-medium text-violet-800 transition hover:bg-violet-100 disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  {isSuggesting ? "Suggesting…" : "AI Suggestion"}
                </button>
                {suggestError && (
                  <p className="mt-2 text-xs text-red-600">{suggestError}</p>
                )}
              </div>

              {aiSuggestion && (
                <div className="rounded-xl border border-violet-100 bg-violet-50/80 px-4 py-3 text-sm text-violet-900">
                  <p className="font-medium">
                    Suggested ({suggestSource === "ai" ? "Gemini" : "rules"}):{" "}
                    {CODE_TO_DEPARTMENT_VALUE[aiSuggestion.department] ?? aiSuggestion.department}{" "}
                    · {apiToUiPriority(aiSuggestion.priority)}
                  </p>
                  <p className="mt-1 text-violet-800/90">{aiSuggestion.reason}</p>
                  <p className="mt-2 text-xs text-violet-700">
                    Reception confirms below — change if needed.
                  </p>
                </div>
              )}

              {emergencyWarning && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800">
                  Emergency suggested — please confirm priority with reception.
                </p>
              )}
              {seniorHint && !emergencyWarning && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Age 60+ — Senior priority suggested. Confirm below.
                </p>
              )}

              <div>
                <label htmlFor="department" className="mb-2 block text-sm font-medium text-gray-700">
                  Send to department (reception confirms) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <select
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    onBlur={() => setTouched((prev) => ({ ...prev, department: true }))}
                    className={`${baseInputClass} pl-10 pr-10 text-gray-700 ${
                      hasError("department") ? "border-red-300" : "border-gray-200"
                    }`}
                    required
                  >
                    <option value="">Select department</option>
                    {DEPARTMENTS.map((department) => (
                      <option key={department.value} value={department.value}>
                        {department.label}
                      </option>
                    ))}
                  </select>
                </div>
                {hasError("department") && (
                  <p className="mt-1 text-xs text-red-500">This field is required</p>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Priority (reception confirms)</p>
                <div className="flex flex-wrap items-center gap-2">
                  {PRIORITIES.map((priority) => {
                    const isSelected = formData.priority === priority;
                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, priority }))}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? "border-teal-300 bg-teal-50 text-teal-700"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <span className="mr-2 inline-flex align-middle">
                          {priority === "Emergency" ? (
                            <AlertTriangle className="h-4 w-4" />
                          ) : priority === "Senior" ? (
                            <Crown className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </span>
                        {priority}
                      </button>
                    );
                  })}
                </div>
              </div>

              {submitError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-500 to-emerald-500 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Saving…" : "Generate Token"}
              </button>
            </form>
          </article>

          <article className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md transition-all duration-200 hover:shadow-lg sm:p-8">
            <h2 className="flex items-center gap-2 text-lg font-medium text-gray-900">
              <Activity className="h-5 w-5 text-gray-400" />
              Today&apos;s tokens ({tokens.length})
            </h2>

            <div className="mt-5 max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {tokens.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                  <Activity className="mb-3 h-6 w-6 text-gray-400" />
                  <p className="font-medium text-gray-600">No tokens yet</p>
                  <p className="mt-1 text-xs text-gray-500">Generated tokens will appear here</p>
                </div>
              ) : (
                tokens.map((token) => (
                  <div
                    key={token.code}
                    className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-200 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-base font-semibold text-teal-600">{token.code}</p>
                      <p className="text-lg font-medium text-gray-800">{token.name}</p>
                      <p className="text-sm text-gray-500">
                        {token.department} · {token.room}
                      </p>
                      <Link
                        href={`/track/${encodeURIComponent(token.code)}`}
                        className="mt-2 inline-block text-xs font-medium text-violet-700 hover:underline"
                      >
                        Patient queue link →
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getPriorityClass(
                          token.priority
                        )}`}
                      >
                        {getPriorityIcon(token.priority)}
                        {token.priority}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClass(
                          token.status
                        )}`}
                      >
                        {token.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => toggleStatus(token.code)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition-all duration-200 hover:bg-gray-100 hover:text-gray-700"
                        aria-label="Toggle token status"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
