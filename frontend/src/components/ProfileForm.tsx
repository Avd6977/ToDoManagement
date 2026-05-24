import { FormEvent, useState } from "react";
import type { User } from "../types/User";

interface ProfileFormProps {
  user: User;
  onSave: (payload: {
    fullName: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
}

export const ProfileForm = ({ user, onSave }: ProfileFormProps): JSX.Element => {
  const [fullName, setFullName] = useState(user.fullName);
  const [username] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (newPassword.trim() && !currentPassword.trim()) {
      setError("Current password is required to set a new password.");
      return;
    }

    try {
      setLoading(true);
      await onSave({
        fullName: fullName.trim(),
        currentPassword: currentPassword.trim() || undefined,
        newPassword: newPassword.trim() || undefined,
      });
      setMessage("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Edit Profile</h2>
      <label>
        Full Name
        <input value={fullName} onChange={(event) => setFullName(event.target.value)} />
      </label>

      <label>
        Username
        <input value={username} disabled />
      </label>

      <label>
        Current Password
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Required only when changing password"
        />
      </label>

      <label>
        New Password
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Leave blank to keep current password"
        />
      </label>

      <p className="hint">Username cannot be changed.</p>
      {message && <p className="hint">{message}</p>}
      {error && <p className="error">{error}</p>}

      <button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
};
