import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "../components/mode-toggle";
import { useAuth } from "@/context/AuthContext";

import "../App.css";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password) {
      setError("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);

      await login({
        username: username.trim(),
        password,
      });

      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ModeToggle />

      <div className="login-div">
        <form onSubmit={handleLogin}>
          <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Login.</h1>

          <div>
            Required Field <span className="text-destructive">*</span>
            <Input
              id="username"
              placeholder="Username/Roll Number"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div style={{ marginTop: "1rem" }}>
            Required Field <span className="text-destructive">*</span>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-destructive text-sm mt-3" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            style={{ marginTop: "1rem", minWidth: "100%" }}
            variant="outline"
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </div>
    </>
  );
}
