import { createContext, useContext, useState, type ReactNode } from "react";

import {
  login as loginRequest,
  type UserLogin,
  type AuthResponse,
} from "@/api/userService";

interface AuthContextType {
  user: AuthResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthResponse | null>(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("token");
  });

  const login = async (credentials: UserLogin) => {
    const data = await loginRequest(credentials);

    if (!data.token) {
      throw new Error("Authentication token was not received");
    }

    setUser(data);
    setToken(data.token);

    localStorage.setItem("user", JSON.stringify(data));
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
