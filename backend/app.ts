process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express, { Request, Response } from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

// ==================== CONFIG ====================

const PORT = 3000;

const BASE_URL = "https://student.mrtc.edu.in:8443";

const LOGIN_URL = `${BASE_URL}/adhikrit-login-authentication/api/auth/signin`;

const MARKS_URL = `${BASE_URL}/examtool-backend-adhikrit/api/v1`;

// ==================== TYPES ====================

interface User {
  username: string;
  password: string;
}

interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email: string;
  roles: string[];
  instituteType: string;
  collegeId: string;
  program: string;
  department: string;
  status: boolean;
  facultyType: string | null;
  refreshToken: string;
}

interface MidMarksRequest {
  rollNumber: string;
  semester: string;
}

interface SemMarksRequest {
  rollNumber: string;
  semester: string;
  degreeType: string;
}

interface SplitupSubChild {
  uniqueKey: number;
  splitupType: string;
  splitupMarks: string;
  currentUserName: string;
  currentUserEmail: string;
  currentUploadDateTime: string;
}

interface MidMarksSubject {
  rollNo: string;
  subjectNameChild: string;
  subjectTypeChild: string;
  semesterChild: string;
  midNoChild: string;
  studentName: string;
  status: string;
  marksChild: string;
  splitupSubChilds: SplitupSubChild[];
  currentUserName: string;
  currentUserEmail: string;
  currentUploadDateTime: string;
}

interface MidMarksResponse {
  PRACTICAL: MidMarksSubject[];
  THEORY: MidMarksSubject[];
}

interface SemMarksEntry {
  [key: string]: string;
}

interface SemMarksResponse {
  [examTitle: string]: SemMarksEntry[];
}

// ==================== HELPERS ====================

// Normalize Authorization header
const getBearerToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  return token ? `Bearer ${token}` : null;
};

// Handle upstream API responses
const getResponseData = async (response: globalThis.Response) => {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
};

// ==================== LOGIN ====================

app.post("/login", async (req: Request, res: Response) => {
  const { username, password }: User = req.body;

  if (!username?.trim() || !password) {
    return res.status(400).json({
      status: false,
      message: "Username and password are required",
    });
  }

  try {
    const response = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password,
        module: "ExamCell",
      }),
    });

    const data = await getResponseData(response);

    if (!response.ok) {
      return res.status(response.status).json({
        status: false,
        message: "Authentication failed",
        error: data,
      });
    }

    return res.status(200).json(data as AuthResponse);
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to connect to authentication server",
    });
  }
});

// ==================== MID MARKS ====================

app.post("/mid", async (req: Request, res: Response) => {
  const { rollNumber, semester }: MidMarksRequest = req.body;

  const token = getBearerToken(req.headers.authorization);

  if (!rollNumber?.trim() || !semester?.trim() || !token) {
    return res.status(400).json({
      status: false,
      message: "Roll number, semester, and Bearer token are required",
    });
  }

  try {
    const params = new URLSearchParams({
      rollNumber: rollNumber.trim(),
      semester: `${semester.trim()} SEMESTER`,
    });

    const response = await fetch(
      `${MARKS_URL}/midMarksDataBySemAndRollnumber?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
          Accept: "application/json",
        },
      },
    );

    const data = await getResponseData(response);

    if (!response.ok) {
      return res.status(response.status).json({
        status: false,
        message: "Failed to fetch mid marks data",
        error: data,
      });
    }

    return res.status(200).json({
      status: true,
      data,
    });
  } catch (error) {
    console.error("Mid marks error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to fetch mid marks",
    });
  }
});

// ==================== SEMESTER MARKS ====================

app.post("/sem", async (req: Request, res: Response) => {
  const { rollNumber, semester, degreeType }: SemMarksRequest = req.body;

  const token = getBearerToken(req.headers.authorization);

  if (
    !rollNumber?.trim() ||
    !semester?.trim() ||
    !degreeType?.trim() ||
    !token
  ) {
    return res.status(400).json({
      status: false,
      message:
        "Roll number, semester, degree type, and Bearer token are required",
    });
  }

  try {
    const params = new URLSearchParams({
      rollNo: rollNumber.trim(),
      semester: `${semester.trim()} SEMESTER`,
      degreeType: degreeType.trim(),
    });

    const response = await fetch(
      `${MARKS_URL}/getSemWiseDataWithRollNo?${params}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
          Accept: "application/json",
        },
      },
    );

    const data = await getResponseData(response);

    if (!response.ok) {
      return res.status(response.status).json({
        status: false,
        message: "Failed to fetch semester marks data",
        error: data,
      });
    }

    return res.status(200).json({
      status: true,
      data,
    });
  } catch (error) {
    console.error("Semester marks error:", error);

    return res.status(500).json({
      status: false,
      message: "Unable to fetch semester marks",
    });
  }
});

// ==================== PING ====================

app.get("/ping", (_req: Request, res: Response) => {
  return res.status(200).json({
    status: true,
    ping: "pong",
  });
});

// ==================== SERVER ====================

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
