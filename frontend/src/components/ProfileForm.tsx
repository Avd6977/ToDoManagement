import { FormEvent, useState } from "react";
import type { User } from "../types/User";

const FULL_NAME_MAX_LENGTH = 100;
const USERNAME_MAX_LENGTH = 50;

interface ProfileFormProps {
  user: User;
  onSave: (payload: {
    fullName: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  onCancel?: () => void;
}

export const ProfileForm = ({ user, onSave, onCancel }: ProfileFormProps): JSX.Element => {
  const [fullName, setFullName] = useState(user.fullName);
  const [username] = useState(user.username);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    fullName: false,
    currentPassword: false,
    newPassword: false,
  });
  const fullNameTooLong = fullName.length > FULL_NAME_MAX_LENGTH;

  const fullNameError = touched.fullName
    ? !fullName.trim()
      ? "Full name is required."
      : fullNameTooLong
        ? `Full name must be ${FULL_NAME_MAX_LENGTH} characters or fewer.`
        : ""
    : "";
  const currentPasswordRequired = !!newPassword.trim() && !currentPassword.trim();
  const currentPasswordError = (touched.currentPassword || touched.newPassword) && currentPasswordRequired
    ? "Current password is required to set a new password."
    : "";
  const isFormValid = !!fullName.trim() && !fullNameTooLong && !currentPasswordRequired;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");
    setMessage("");

    if (!isFormValid) {
      setTouched({
        fullName: true,
        currentPassword: true,
        newPassword: true,
      });
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
      setTouched((previous) => ({ ...previous, currentPassword: false, newPassword: false }));
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Edit Profile</h2>
      <label>
        Full Name*
        <input
          value={fullName}
          maxLength={FULL_NAME_MAX_LENGTH}
          onChange={(event) => {
            setFullName(event.target.value);
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
        Username*
        <input
          value={username}
          maxLength={USERNAME_MAX_LENGTH}
          disabled
          title="Username cannot be changed."
          aria-label="Username (cannot be changed)"
        />
        <span className="field-counter hint">{username.length}/{USERNAME_MAX_LENGTH}</span>
      </label>

      <label>
        Current Password
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => {
            setCurrentPassword(event.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, currentPassword: true }))}
          placeholder="Required only when changing password"
        />
      </label>
      {currentPasswordError && <p className="error">{currentPasswordError}</p>}

      <label>
        New Password
        <input
          type="password"
          value={newPassword}
          onChange={(event) => {
            setNewPassword(event.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, newPassword: true }))}
          placeholder="Leave blank to keep current password"
        />
      </label>

      {message && <p className="hint">{message}</p>}
      {submitError && <p className="error">{submitError}</p>}

      <div className="actions">
        <button type="submit" disabled={loading || !isFormValid}>
          {loading ? "Saving..." : "Save Profile"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
