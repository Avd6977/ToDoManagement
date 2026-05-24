import { FormEvent, useState } from "react";
import type { User } from "../types/User";
import { register } from "../services/api";

interface RegisterFormProps {
  onAuthenticated: (user: User) => void;
}

export const RegisterForm = ({ onAuthenticated }: RegisterFormProps): JSX.Element => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError("Full name, username, and password are required.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!hasLetter) {
      setError("Password must contain at least one letter.");
      return;
    }

    if (!hasNumber) {
      setError("Password must contain at least one number.");
      return;
    }

    if (!hasSpecialCharacter) {
      setError("Password must contain at least one special character.");
      return;
    }

    try {
      setLoading(true);
      const user = await register(fullName.trim(), username.trim(), password);
      onAuthenticated(user);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Register</h2>
      <label>
        Full Name
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </label>
      <label>
        Username
        <input value={username} onChange={(e) => setUsername(e.target.value)} />
      </label>
      <label>
        Password
        <input
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <p className="hint">Minimum 8 characters with at least 1 letter, 1 number, and 1 special character.</p>
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Creating account..." : "Register"}
      </button>
    </form>
  );
};
