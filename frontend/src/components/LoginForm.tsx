import { FormEvent, useState } from "react";
import type { User } from "../types/User";
import { login } from "../services/api";

interface LoginFormProps {
  onAuthenticated: (user: User) => void;
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

export const LoginForm = ({
  onAuthenticated,
  onRegisterClick,
  onForgotPasswordClick,
}: LoginFormProps): JSX.Element => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required.");
      return;
    }

    try {
      setLoading(true);
      const user = await login(username.trim(), password);
      onAuthenticated(user);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Login</h2>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <div className="login-links">
        <button type="button" className="link-button" onClick={onRegisterClick}>
          Register
        </button>
        <button type="button" className="link-button" onClick={onForgotPasswordClick}>
          Forgot Password?
        </button>
      </div>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
};
