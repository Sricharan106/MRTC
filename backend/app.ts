process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import express, { Request, Response } from "express";
const app = express();
app.use(express.json());

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

app.post("/login", async (req: Request, res: Response) => {
  const { username, password }: User = req.body;
  if (!username && !password) {
    return res.status(401).json({
      status: false,
      message: "Both roll number and password are required",
    });
  }
  const response = await fetch(
    "https://student.mrtc.edu.in:8443/adhikrit-login-authentication/api/auth/signin",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username,
        password: password,
        module: "ExamCell",
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const data: AuthResponse = await response.json();
  res.status(200).json(data);
});

interface MidMarksRequest {
  rollNumber: string;
  semester: string;
  token: string;
}

interface SemMarksRequest {
  rollNumber: string;
  semester: string;
  degreeType: string;
  token: string;
}

interface SplitupSubChild {
  uniqueKey: number;
  splitupType: string;
  splitupMarks: string;
  currentUserName: string;
  currentUserEmail: string;
  currentUploadDateTime: string;
}

interface SemMarksEntry {
  [key: string]: string;
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

interface SemMarksResponse {
  [examTitle: string]: SemMarksEntry[];
}

interface MidMarksResponse {
  PRACTICAL: MidMarksSubject[];
  THEORY: MidMarksSubject[];
}

app.post("/mid", async (req: Request, res: Response) => {
  const { rollNumber, semester }: MidMarksRequest = req.body;
  const token = req.headers.authorization;

  if (!rollNumber || !semester || !token) {
    return res.status(400).json({
      status: false,
      message: "Roll number, semester, and authorization token are required",
    });
  }

  try {
    const response = await fetch(
      `https://student.mrtc.edu.in:8443/examtool-backend-adhikrit/api/v1/midMarksDataBySemAndRollnumber?rollNumber=${encodeURIComponent(rollNumber)}&semester=${encodeURIComponent(semester)} SEMESTER`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
    );

    const data: MidMarksResponse = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        status: false,
        message: "Failed to fetch mid marks data",
        error: data,
      });
    }

    res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching mid marks:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

app.post("/sem", async (req: Request, res: Response) => {
  const { rollNumber, semester, degreeType }: SemMarksRequest = req.body;
  const token = req.headers.authorization;

  if (!rollNumber || !semester || !degreeType || !token) {
    return res.status(400).json({
      status: false,
      message:
        "Roll number, semester, degree type, and authorization token are required",
    });
  }

  try {
    const response = await fetch(
      `https://student.mrtc.edu.in:8443/examtool-backend-adhikrit/api/v1/getSemWiseDataWithRollNo?rollNo=${encodeURIComponent(rollNumber)}&semester=${encodeURIComponent(semester)} SEMESTER&degreeType=${encodeURIComponent(degreeType)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      },
    );

    const data: SemMarksResponse = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        status: false,
        message: "Failed to fetch semester marks data",
        error: data,
      });
    }

    res.status(200).json({
      status: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching semester marks:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
});

app.get("/ping", (req: Request, res: Response) => {
  res.status(200).json({ ping: "pong" });
});

app.listen(3000, () => {
  console.log("server started on port 3000");
});
