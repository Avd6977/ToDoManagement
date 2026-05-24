import { ReactNode, useEffect, useRef, useState } from "react";

interface AppHeaderProps {
  title: string;
  fullName: string;
  onLogout: () => void;
  onProfileClick: () => void;
  onBack?: () => void;
  rightActions?: ReactNode;
}

export const AppHeader = ({
  title,
  fullName,
  onLogout,
  onProfileClick,
  onBack,
  rightActions,
}: AppHeaderProps): JSX.Element => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleDocumentMouseDown = (event: MouseEvent) => {
      if (!isProfileMenuOpen) {
        return;
      }

      var targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(targetNode)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener("mousedown", handleDocumentMouseDown);
    };
  }, [isProfileMenuOpen]);

  return (
    <header className="dashboard-header">
      <div className="header-main">
        <div className="header-title-row">
          {onBack && (
            <button
              type="button"
              className="back-button secondary"
              onClick={onBack}
              aria-label="Back"
              title="Back"
            >
              ←
            </button>
          )}
          <h1>{title}</h1>
        </div>
      </div>

      <div className="header-actions">
        {rightActions}
        <div className="profile-menu-wrapper" ref={profileMenuRef}>
          <button
            type="button"
            className="profile-button"
            onClick={() => setIsProfileMenuOpen((value) => !value)}
            aria-haspopup="menu"
            aria-expanded={isProfileMenuOpen}
            title="Profile"
          >
            <span className="profile-avatar" aria-hidden="true">👤</span>
          </button>
          {isProfileMenuOpen && (
            <div className="profile-menu" role="menu">
              <button
                type="button"
                role="menuitem"
                className="profile-menu-item profile-name-item"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onProfileClick();
                }}
              >
                {fullName}
              </button>
              <button
                type="button"
                role="menuitem"
                className="profile-menu-item"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  onLogout();
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
