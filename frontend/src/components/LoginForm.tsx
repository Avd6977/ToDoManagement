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
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    password: false,
  });

  const usernameError = touched.username && !username.trim() ? "Username is required." : "";
  const passwordError = touched.password && !password.trim() ? "Password is required." : "";
  const isFormValid = !!username.trim() && !!password.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!isFormValid) {
      setTouched({ username: true, password: true });
      return;
    }

    try {
      setLoading(true);
      const user = await login(username.trim(), password);
      onAuthenticated(user);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Login</h2>
      <label>
        Username
        <input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, username: true }))}
        />
      </label>
      {usernameError && <p className="error">{usernameError}</p>}
      <label>
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, password: true }))}
        />
      </label>
      {passwordError && <p className="error">{passwordError}</p>}
      <div className="login-links">
        <button type="button" className="link-button" onClick={onRegisterClick}>
          Register
        </button>
        <button type="button" className="link-button" onClick={onForgotPasswordClick}>
          Forgot Password?
        </button>
      </div>
      {submitError && <p className="error">{submitError}</p>}
      <button type="submit" disabled={loading || !isFormValid}>
        {loading ? "Signing in..." : "Login"}
      </button>
    </form>
  );
};
