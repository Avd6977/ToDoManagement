import { FormEvent, useState } from "react";
import type { User } from "../types/User";
import { register } from "../services/api";

interface RegisterFormProps {
  onAuthenticated: (user: User) => void;
  onBackToLoginClick: () => void;
}

export const RegisterForm = ({ onAuthenticated, onBackToLoginClick }: RegisterFormProps): JSX.Element => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    username: false,
    password: false,
  });

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

  const fullNameError = touched.fullName && !fullName.trim() ? "Full name is required." : "";
  const usernameError = touched.username && !username.trim() ? "Username is required." : "";
  const passwordError = touched.password
    ? !password.trim()
      ? "Password is required."
      : password.length < 8
        ? "Password must be at least 8 characters."
        : !hasLetter
          ? "Password must contain at least one letter."
          : !hasNumber
            ? "Password must contain at least one number."
            : !hasSpecialCharacter
              ? "Password must contain at least one special character."
              : ""
    : "";

  const isFormValid = !!fullName.trim()
    && !!username.trim()
    && !!password.trim()
    && password.length >= 8
    && hasLetter
    && hasNumber
    && hasSpecialCharacter;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!isFormValid) {
      setTouched({ fullName: true, username: true, password: true });
      return;
    }

    try {
      setLoading(true);
      const user = await register(fullName.trim(), username.trim(), password);
      onAuthenticated(user);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Register</h2>
      <label>
        Full Name*
        <input
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, fullName: true }))}
        />
      </label>
      {fullNameError && <p className="error">{fullNameError}</p>}
      <label>
        Username*
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
        Password*
        <input
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, password: true }))}
        />
      </label>
      {passwordError && <p className="error">{passwordError}</p>}
      <p className="hint">Minimum 8 characters with at least 1 letter, 1 number, and 1 special character.</p>
      <button type="button" className="link-button" onClick={onBackToLoginClick}>
        Back to Login
      </button>
      {submitError && <p className="error">{submitError}</p>}
      <button type="submit" disabled={loading || !isFormValid}>
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
};
