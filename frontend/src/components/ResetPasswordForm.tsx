import { FormEvent, useState } from "react";
import { resetPassword } from "../services/api";

export const ResetPasswordForm = (): JSX.Element => {
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!resetToken.trim() || !newPassword.trim()) {
      setError("Reset token and new password are required.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(resetToken.trim(), newPassword);
      setMessage("Password reset successfully. You can now log in.");
      setResetToken("");
      setNewPassword("");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Reset password request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Reset Password</h2>
      <label>
        Reset Token
        <input value={resetToken} onChange={(e) => setResetToken(e.target.value)} />
      </label>
      <label>
        New Password
        <input
          type="password"
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </label>
      <p className="hint">Password must include at least 8 chars, 1 letter, 1 number, and 1 special character.</p>
      {message && <p className="hint">{message}</p>}
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Resetting..." : "Reset Password"}
      </button>
    </form>
  );
};
