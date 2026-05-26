import { FormEvent, useState } from "react";
import { forgotPassword } from "../services/api";

interface ForgotPasswordFormProps {
  onRequestSucceeded?: () => void;
}

export const ForgotPasswordForm = ({ onRequestSucceeded }: ForgotPasswordFormProps): JSX.Element => {
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [tokenPreview, setTokenPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);

  const usernameError = usernameTouched && !username.trim() ? "Username is required." : "";
  const isFormValid = !!username.trim();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    setMessage("");
    setTokenPreview("");

    if (!isFormValid) {
      setUsernameTouched(true);
      return;
    }

    try {
      setLoading(true);
      const response = await forgotPassword(username.trim());
      setMessage(response.message);
      onRequestSucceeded?.();
      // Demo-only: backend returns reset token because email integration is out of scope.
      if (response.resetToken) {
        setTokenPreview(response.resetToken);
      }
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Forgot password request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Forgot Password</h2>
      <label>
        Username
        <input
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setUsernameTouched(true)}
        />
      </label>
      {usernameError && <p className="error">{usernameError}</p>}
      {message && <p className="hint">{message}</p>}
      {tokenPreview && <p className="token-preview">Reset token: {tokenPreview}</p>}
      {submitError && <p className="error">{submitError}</p>}
      <button type="submit" disabled={loading || !isFormValid}>
        {loading ? "Requesting..." : "Request Reset"}
      </button>
    </form>
  );
};
