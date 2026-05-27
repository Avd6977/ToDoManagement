import { FormEvent, useState } from "react";
import type { User } from "src/types/User";
import { login } from "src/services/auth.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginFormProps {
  onAuthenticated: (user: User) => void;
  onRegisterClick: () => void;
}

export const LoginForm = ({
  onAuthenticated,
  onRegisterClick,
}: LoginFormProps): JSX.Element => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });

  const emailError = touched.email
    ? !email.trim()
      ? "Email is required."
      : !EMAIL_REGEX.test(email.trim())
        ? "Email format is invalid."
        : ""
    : "";
  const passwordError = touched.password && !password.trim() ? "Password is required." : "";
  const isFormValid = !!email.trim() && EMAIL_REGEX.test(email.trim()) && !!password.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isFormValid) {
      setTouched({ email: true, password: true });
      return;
    }

    try {
      setLoading(true);
      const user = await login(email.trim(), password);
      onAuthenticated(user);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card form-card">
      <div className="form-content">
        <h2>Login</h2>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            onBlur={() => setTouched((previous) => ({ ...previous, email: true }))}
          />
        </label>
        {emailError && <p className="error">{emailError}</p>}
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            onBlur={() => setTouched((previous) => ({ ...previous, password: true }))}
          />
        </label>
        {passwordError && <p className="error">{passwordError}</p>}
      </div>

      <div className="form-footer">
        <div className="actions login-actions">
          <button type="submit" disabled={loading || !isFormValid}>
            {loading ? "Signing in..." : "Login"}
          </button>
          <button type="button" className="secondary register-button" onClick={onRegisterClick}>
            Register
          </button>
        </div>
      </div>
    </form>
  );
};
