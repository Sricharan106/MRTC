export interface MidSplitup {
  uniqueKey?: number;
  splitupType?: string;
  splitupMarks?: string | number | null;
}

export interface MidExam {
  rollNo?: string;
  subjectNameChild?: string;
  subjectTypeChild?: string;
  semesterChild?: string;
  midNoChild?: string;
  marksChild?: string | number | null;
  status?: string;
  splitupSubChilds?: MidSplitup[] | null;
  [key: string]: unknown;
}

export interface MidSubject {
  id: string;
  name: string;
  subjectCode: string;
  exams: MidExam[];
}

export interface MidCategory {
  name: string;
  subjects: MidSubject[];
}

const normalize = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toUpperCase();

const getSemesterNumber = (value: unknown): number | null => {
  const normalized = normalize(value);

  const match = normalized.match(
    /(?:SEMESTER\s*)?(VIII|VII|VI|IV|V|III|II|I|\d+)/,
  );

  if (!match) return null;

  const token = match[1];

  const roman: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
  };

  return /^\d+$/.test(token) ? Number(token) : (roman[token] ?? null);
};

const getSubjectDetails = (exam: MidExam) => {
  const rawName = String(exam.subjectNameChild ?? "Unknown Subject").trim();

  // Handles "SUBJECT NAME,CODE" without assuming every
  // API response uses this naming convention.
  const parts = rawName.split(",");

  return {
    name: parts[0]?.trim() || rawName,
    code: parts.length > 1 ? parts.slice(1).join(",").trim() : "",
  };
};

const getExamIdentity = (exam: MidExam) => {
  const { name, code } = getSubjectDetails(exam);

  // Prefer subject code where available.
  return code || normalize(name);
};

export function parseMidResponse(
  response: unknown,
  selectedSemester: string | number,
): MidCategory[] {
  if (!response || typeof response !== "object") return [];

  const root = response as Record<string, unknown>;

  // Support both complete API response and response.data.
  const payload = root.data && typeof root.data === "object" ? root.data : root;

  const selectedNumber = getSemesterNumber(selectedSemester);

  if (selectedNumber === null) return [];

  const categories: MidCategory[] = [];

  for (const [categoryName, value] of Object.entries(payload)) {
    if (!Array.isArray(value)) continue;

    const exams = (value as MidExam[]).filter((exam) => {
      if (!exam || typeof exam !== "object") return false;

      // If semesterChild is absent, retain the record rather
      // than silently discarding potentially valid API data.
      if (!exam.semesterChild) return true;

      return getSemesterNumber(exam.semesterChild) === selectedNumber;
    });

    const subjectMap = new Map<string, MidSubject>();

    for (const exam of exams) {
      const { name, code } = getSubjectDetails(exam);
      const identity = getExamIdentity(exam);

      const existing = subjectMap.get(identity);

      if (existing) {
        existing.exams.push(exam);
      } else {
        subjectMap.set(identity, {
          id: identity,
          name,
          subjectCode: code,
          exams: [exam],
        });
      }
    }

    if (subjectMap.size > 0) {
      categories.push({
        name: categoryName,
        subjects: Array.from(subjectMap.values()),
      });
    }
  }

  return categories;
}
