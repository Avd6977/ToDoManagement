import { FormEvent, useState } from "react";
import { resetPassword } from "../services/api";

export const ResetPasswordForm = (): JSX.Element => {
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    resetToken: false,
    newPassword: false,
  });

  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(newPassword);

  const resetTokenError = touched.resetToken && !resetToken.trim() ? "Reset token is required." : "";
  const newPasswordError = touched.newPassword
    ? !newPassword.trim()
      ? "New password is required."
      : newPassword.length < 8
        ? "Password must be at least 8 characters."
        : !hasLetter
          ? "Password must contain at least one letter."
          : !hasNumber
            ? "Password must contain at least one number."
            : !hasSpecialCharacter
              ? "Password must contain at least one special character."
              : ""
    : "";

  const isFormValid = !!resetToken.trim()
    && !!newPassword.trim()
    && newPassword.length >= 8
    && hasLetter
    && hasNumber
    && hasSpecialCharacter;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    setMessage("");

    if (!isFormValid) {
      setTouched({ resetToken: true, newPassword: true });
      return;
    }

    try {
      setLoading(true);
      await resetPassword(resetToken.trim(), newPassword);
      setMessage("Password reset successfully. You can now log in.");
      setResetToken("");
      setNewPassword("");
      setTouched({ resetToken: false, newPassword: false });
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Reset password request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Reset Password</h2>
      <label>
        Reset Token
        <input
          value={resetToken}
          onChange={(e) => {
            setResetToken(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, resetToken: true }))}
        />
      </label>
      {resetTokenError && <p className="error">{resetTokenError}</p>}
      <label>
        New Password
        <input
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, newPassword: true }))}
        />
      </label>
      {newPasswordError && <p className="error">{newPasswordError}</p>}
      <p className="hint">Password must include at least 8 chars, 1 letter, 1 number, and 1 special character.</p>
      {message && <p className="hint">{message}</p>}
      {submitError && <p className="error">{submitError}</p>}
      <button type="submit" disabled={loading || !isFormValid}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
};
