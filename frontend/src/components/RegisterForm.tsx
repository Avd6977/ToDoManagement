import { FormEvent, useState } from "react";
import type { User } from "../types/User";
import { register } from "../services/api";

const FULL_NAME_MAX_LENGTH = 100;
const EMAIL_MAX_LENGTH = 254;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface RegisterFormProps {
  onAuthenticated: (user: User) => void;
  onBackToLoginClick: () => void;
  onCancel?: () => void;
}

export const RegisterForm = ({ onAuthenticated, onBackToLoginClick, onCancel }: RegisterFormProps): JSX.Element => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
  });

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);
  const fullNameTooLong = fullName.length > FULL_NAME_MAX_LENGTH;
  const emailTooLong = email.length > EMAIL_MAX_LENGTH;

  const fullNameError = touched.fullName
    ? !fullName.trim()
      ? "Full name is required."
      : fullNameTooLong
        ? `Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`
        : ""
    : "";
  const emailError = touched.email
    ? !email.trim()
      ? "Email is required."
      : emailTooLong
        ? `Email must be ${EMAIL_MAX_LENGTH} characters or fewer.`
        : !EMAIL_REGEX.test(email.trim())
          ? "Email format is invalid."
        : ""
    : "";
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
    && !fullNameTooLong
    && !!email.trim()
    && !emailTooLong
    && EMAIL_REGEX.test(email.trim())
    && !!password.trim()
    && password.length >= 8
    && hasLetter
    && hasNumber
    && hasSpecialCharacter;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!isFormValid) {
      setTouched({ fullName: true, email: true, password: true });
      return;
    }

    try {
      setLoading(true);
      const user = await register(fullName.trim(), email.trim(), password);
      onAuthenticated(user);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card form-card">
      <div className="form-content">
        <button
          type="button"
          className="back-button secondary"
          onClick={onBackToLoginClick}
          aria-label="Back"
          title="Back"
        >
          ←
        </button>
        <h2>Register</h2>
        <label>
          Full Name*
          <input
            value={fullName}
            maxLength={FULL_NAME_MAX_LENGTH}
            onChange={(e) => {
              setFullName(e.target.value);
              setSubmitError("");
            }}
            onBlur={() => setTouched((previous) => ({ ...previous, fullName: true }))}
          />
          <span className={`field-counter ${fullNameTooLong ? "error" : "hint"}`}>
            {fullName.length}/{FULL_NAME_MAX_LENGTH}
          </span>
        </label>
        {fullNameError && <p className="error">{fullNameError}</p>}
        <label>
          Email*
          <input
            type="email"
            value={email}
            maxLength={EMAIL_MAX_LENGTH}
            onChange={(e) => {
              setEmail(e.target.value);
              setSubmitError("");
            }}
            onBlur={() => setTouched((previous) => ({ ...previous, email: true }))}
          />
          <span className={`field-counter ${emailTooLong ? "error" : "hint"}`}>
            {email.length}/{EMAIL_MAX_LENGTH}
          </span>
        </label>
        {emailError && <p className="error">{emailError}</p>}
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
        {submitError && <p className="error">{submitError}</p>}
      </div>

      <div className="form-footer">
        <div className="actions">
          <button type="submit" disabled={loading || !isFormValid}>
            {loading ? "Creating account..." : "Register"}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="secondary">
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
};
