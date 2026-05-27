import { useNavigate } from "react-router-dom";
import { AppHeader } from "src/components/AppHeader/AppHeader";
import { ProfileForm } from "src/components/ProfileForm/ProfileForm";
import { updateProfile } from "src/services/profile.service";
import type { User } from "src/types/User";

interface ProfileViewProps {
  currentUser: User;
  onLogout: () => Promise<void>;
  onFullNameUpdated: (fullName: string) => void;
}

export const ProfileView = ({
  currentUser,
  onLogout,
  onFullNameUpdated,
}: ProfileViewProps): JSX.Element => {
  const navigate = useNavigate();

  const handleSaveProfile = async (payload: {
    fullName: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const response = await updateProfile(payload);
    onFullNameUpdated(response.fullName);
  };

  return (
    <main className="app-layout">
      <AppHeader
        title="Profile"
        fullName={currentUser.fullName}
        onLogout={onLogout}
        onProfileClick={() => navigate("/profile")}
        onBack={() => navigate("/tasks")}
      />

      <ProfileForm
        user={currentUser}
        onSave={handleSaveProfile}
        onCancel={() => navigate("/tasks")}
      />
    </main>
  );
};
