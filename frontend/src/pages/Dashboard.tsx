import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { useAuth } from "@/context/AuthContext";
import { parseMidResponse } from "@/lib/marks-parser";

import {
  getMidMarks,
  getSemMarks,
  type MidMarksResponse,
  type SemMarksResponse,
} from "@/api/userService";

import { useNavigate } from "react-router-dom";

import "../App.css";

type MarksType = "mid" | "semester";

const semesters = [
  { value: "I", label: "Semester I" },
  { value: "II", label: "Semester II" },
  { value: "III", label: "Semester III" },
  { value: "IV", label: "Semester IV" },
  { value: "V", label: "Semester V" },
  { value: "VI", label: "Semester VI" },
  { value: "VII", label: "Semester VII" },
  { value: "VIII", label: "Semester VIII" },
];

const marksTabs: { value: MarksType; label: string }[] = [
  { value: "mid", label: "Mid Marks" },
  { value: "semester", label: "Semester Marks" },
];

const TITLE_KEYS = [
  "courseName",
  "subjectName",
  "courseTitle",
  "subject",
  "course",
  "name",
];

const selectClass =
  "h-10 w-full rounded-lg border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/40";

const humanizeKey = (key: string) =>
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim();

const getInitials = (name?: string) => {
  if (!name) return "S";
  const parts = name
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean);
  if (parts.length === 0) return "S";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4 rounded-xl border bg-card p-5">
      <div className="h-4 w-1/3 rounded bg-muted" />
      <div className="h-16 rounded-lg bg-muted/60" />
      <div className="h-16 rounded-lg bg-muted/60" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [marksType, setMarksType] = useState<MarksType>("mid");
  const [semester, setSemester] = useState("I");
  const [degreeType, setDegreeType] = useState("Major");

  const [midMarks, setMidMarks] = useState<MidMarksResponse["data"] | null>(
    null,
  );

  const [semMarks, setSemMarks] = useState<SemMarksResponse["data"] | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const midGroups = useMemo(
    () => parseMidResponse(midMarks, semester),
    [midMarks, semester],
  );

  const semGroups = useMemo(() => {
    if (!semMarks) return [];

    // Handle either a direct data object or a nested data object.
    const payload = (semMarks as any).data ?? semMarks;

    if (!payload || typeof payload !== "object") return [];

    return Object.entries(payload)
      .filter(([, entries]) => Array.isArray(entries))
      .map(([examTitle, entries]) => ({
        examTitle,
        entries: entries as Record<string, any>[],
      }));
  }, [semMarks]);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined || value === "") return "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";

    return "Good night";
  };

  const resetResults = () => {
    setMidMarks(null);
    setSemMarks(null);
    setError("");
  };

  const handleFetchMarks = async () => {
    if (!token || !user) {
      logout();
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    setMidMarks(null);
    setSemMarks(null);

    try {
      if (marksType === "mid") {
        const response = await getMidMarks(
          {
            rollNumber: user.username,
            semester,
          },
          token,
        );

        setMidMarks(response.data);
      } else {
        const response = await getSemMarks(
          {
            rollNumber: user.username,
            semester,
            degreeType,
          },
          token,
        );

        setSemMarks(response.data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || err.message || "Unable to fetch marks",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-container">
      <div className="mx-auto w-full max-w-4xl space-y-8 text-left">
        {/* Header */}

        <header className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {getInitials(user?.username)}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                {getGreeting()}, {user?.username || "Student"}
              </h1>

              <p className="text-sm text-muted-foreground">
                Your academic results at a glance.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <ModeToggle />

            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </header>

        <main className="space-y-8">
          {/* Student Information */}

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold">Student Information</h2>

            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Username" value={user?.username} />
              <Field label="Email" value={user?.email} />
              <Field label="College ID" value={user?.collegeId} />
              <Field label="Program" value={user?.program} />
            </div>
          </section>

          {/* Marks Selection */}

          <section className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold tracking-tight">
                Academic Results
              </h2>

              <p className="text-sm text-muted-foreground">
                Choose what you want to view, then fetch your marks.
              </p>
            </div>

            {/* Marks type: segmented control */}

            <div
              role="tablist"
              aria-label="Marks type"
              className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
            >
              {marksTabs.map((tab) => {
                const active = marksType === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => {
                      setMarksType(tab.value);
                      resetResults();
                    }}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Filters */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="semester" className="text-sm font-medium">
                  Semester
                </label>

                <select
                  id="semester"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className={selectClass}
                >
                  {semesters.map((sem) => (
                    <option key={sem.value} value={sem.value}>
                      {sem.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Degree Type - Semester API only */}

              {marksType === "semester" && (
                <div className="space-y-2">
                  <label htmlFor="degreeType" className="text-sm font-medium">
                    Degree Type
                  </label>

                  <select
                    id="degreeType"
                    value={degreeType}
                    onChange={(e) => setDegreeType(e.target.value)}
                    className={selectClass}
                  >
                    <option value="Major">Major</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              className="mt-5 w-full"
              size="lg"
              onClick={handleFetchMarks}
              disabled={loading}
            >
              {loading ? "Fetching marks..." : "Get Marks"}
            </Button>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </div>
            )}
          </section>

          {/* Loading */}

          {loading && (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {/* Mid Marks Results */}

          {!loading && midMarks && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  Mid Examination Results
                </h2>

                <span className="text-sm text-muted-foreground">
                  Semester {semester}
                </span>
              </div>

              {midGroups.length > 0 ? (
                midGroups.map((group) => (
                  <div
                    key={group.name}
                    className="rounded-xl border bg-card p-5 shadow-sm"
                  >
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.name}
                    </h3>

                    <div className="space-y-4">
                      {group.subjects.map((subject) => (
                        <div key={subject.id} className="rounded-lg border p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <p className="font-medium leading-snug">
                              {subject.name}
                            </p>

                            {subject.subjectCode && (
                              <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                {subject.subjectCode}
                              </span>
                            )}
                          </div>

                          <div className="space-y-3">
                            {subject.exams.map((exam, index) => (
                              <div
                                key={`${subject.id}-${exam.midNoChild || index}`}
                                className="rounded-lg bg-muted/40 p-3"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                      {exam.midNoChild || `Exam ${index + 1}`}
                                    </p>

                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                      {exam.status || "Status unavailable"}
                                    </p>
                                  </div>

                                  <p className="text-2xl font-semibold tabular-nums">
                                    {formatValue(exam.marksChild)}
                                  </p>
                                </div>

                                {Array.isArray(exam.splitupSubChilds) &&
                                  exam.splitupSubChilds.length > 0 && (
                                    <div className="mt-3 border-t pt-3">
                                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                        Marks Breakdown
                                      </p>

                                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                                        {exam.splitupSubChilds.map(
                                          (item, i) => (
                                            <div
                                              key={item.uniqueKey ?? i}
                                              className="rounded-md border bg-background px-3 py-2"
                                            >
                                              <p className="truncate text-xs text-muted-foreground">
                                                {item.splitupType || "Other"}
                                              </p>

                                              <p className="text-sm font-semibold tabular-nums">
                                                {formatValue(item.splitupMarks)}
                                              </p>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  message={`No mid marks found for Semester ${semester}.`}
                />
              )}
            </section>
          )}

          {/* Semester Marks Results */}

          {!loading && semMarks && (
            <section className="space-y-4">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  Semester Examination Results
                </h2>

                <span className="text-sm text-muted-foreground">
                  Semester {semester}
                </span>
              </div>

              {semGroups.length > 0 ? (
                semGroups.map(({ examTitle, entries }) => (
                  <div
                    key={examTitle}
                    className="rounded-xl border bg-card p-5 shadow-sm"
                  >
                    <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      {examTitle}
                    </h3>

                    <div className="space-y-3">
                      {entries.map((entry, index) => {
                        const titleKey = TITLE_KEYS.find(
                          (k) => entry[k] !== undefined && entry[k] !== "",
                        );

                        const rows = Object.entries(entry).filter(
                          ([key]) => key !== titleKey,
                        );

                        return (
                          <div
                            key={`${index}-${entry.courseCode || entry.course || ""}`}
                            className="rounded-lg border p-4"
                          >
                            {titleKey && (
                              <p className="mb-3 font-medium leading-snug">
                                {formatValue(entry[titleKey])}
                              </p>
                            )}

                            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                              {rows.map(([key, value]) => (
                                <div key={key} className="min-w-0">
                                  <dt className="text-xs font-medium capitalize tracking-wide text-muted-foreground">
                                    {humanizeKey(key)}
                                  </dt>

                                  <dd className="mt-0.5 break-words text-sm font-medium">
                                    {formatValue(value)}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  message={`No semester marks available for Semester ${semester}.`}
                />
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
