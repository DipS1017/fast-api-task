import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>{mode === "login" ? "Sign in" : "Create reviewer account"}</h1>
      <p className="muted">Internal candidate review dashboard</p>

      <form onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@techkraft.io"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button type="submit" disabled={busy}>
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Register"}
        </button>
      </form>

      <button
        className="link-btn switch-mode"
        onClick={() => {
          setError(null);
          setMode(mode === "login" ? "register" : "login");
        }}
      >
        {mode === "login"
          ? "Need an account? Register as a reviewer"
          : "Already have an account? Sign in"}
      </button>

      <div className="demo-hint">
        <strong>Demo accounts</strong>
        <div>admin@techkraft.io / admin1234</div>
        <div>reviewer@techkraft.io / review1234</div>
      </div>
    </div>
  );
}
