import axiosClient from "./axiosClient";

// ==================== TYPES ====================

export interface UserLogin {
  username: string;
  password: string;
}

export interface AuthResponse {
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

export interface MidMarksRequest {
  rollNumber: string;
  semester: string;
}

export interface SemMarksRequest {
  rollNumber: string;
  semester: string;
  degreeType: string;
}

export interface SplitupSubChild {
  uniqueKey: number;
  splitupType: string;
  splitupMarks: string;
  currentUserName: string;
  currentUserEmail: string;
  currentUploadDateTime: string;
}

export interface MidMarksSubject {
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

export interface MidMarksResponse {
  status: boolean;
  data: {
    PRACTICAL: MidMarksSubject[];
    THEORY: MidMarksSubject[];
  };
}

export interface SemMarksResponse {
  status: boolean;
  data: Record<string, Record<string, string>[]>;
}

// ==================== LOGIN ====================

export const login = async (userLogin: UserLogin): Promise<AuthResponse> => {
  const { username, password } = userLogin;

  if (!username.trim() || !password) {
    throw new Error("Username and password are required");
  }

  const response = await axiosClient.post<AuthResponse>("/login", userLogin);

  return response.data;
};

// ==================== MID MARKS ====================

export const getMidMarks = async (
  request: MidMarksRequest,
  token: string,
): Promise<MidMarksResponse> => {
  if (!request.rollNumber || !request.semester || !token) {
    throw new Error("Roll number, semester, and token are required");
  }

  const response = await axiosClient.post<MidMarksResponse>("/mid", request, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

// ==================== SEMESTER MARKS ====================

export const getSemMarks = async (
  request: SemMarksRequest,
  token: string,
): Promise<SemMarksResponse> => {
  if (
    !request.rollNumber ||
    !request.semester ||
    !request.degreeType ||
    !token
  ) {
    throw new Error(
      "Roll number, semester, degree type, and token are required",
    );
  }

  const response = await axiosClient.post<SemMarksResponse>("/sem", request, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
