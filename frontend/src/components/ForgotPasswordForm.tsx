import { FormEvent, useState } from "react";
import { forgotPassword } from "../services/api";

export const ForgotPasswordForm = (): JSX.Element => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setTokenPreview("");

    if (!username.trim()) {
      setError("Username is required.");
      return;
    }

    try {
      setLoading(true);
      const response = await forgotPassword(username.trim());
      setMessage(response.message);
      // Demo-only: backend returns reset token because email integration is out of scope.
      if (response.resetToken) {
        setTokenPreview(response.resetToken);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Forgot password request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Forgot Password</h2>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      {message && <p className="hint">{message}</p>}
      {tokenPreview && <p className="token-preview">Reset token: {tokenPreview}</p>}
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Requesting..." : "Request Reset"}
      </button>
    </form>
  );
};
