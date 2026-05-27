import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { LoginForm } from "src/components/LoginForm/LoginForm";
import { RegisterForm } from "src/components/RegisterForm/RegisterForm";
import { Toaster } from "src/components/Toaster/Toaster";
import { DashboardView } from "src/components/DashboardView/DashboardView";
import { CreateTask } from "src/components/CreateTask/CreateTask";
import { ProfileView } from "src/components/ProfileView/ProfileView";
import { getSession, logout } from "src/services/auth.service";
import type { User } from "src/types/User";

const App = (): JSX.Element => {
  const [user, setUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const navigate = useNavigate();

  const resetTaskDashboardState = () => {
    setUser(null);
    setIsSessionLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const hydrateSession = async () => {
      try {
        const sessionUser = await getSession();
        if (isMounted) {
          setUser(sessionUser);
        }
      } catch {
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    };

    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      void logout();
      resetTaskDashboardState();
      navigate("/");
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [navigate]);

  const handleLogout = async () => {
    await logout();
    resetTaskDashboardState();
    navigate("/");
  };

  if (isSessionLoading) {
    return (
      <>
        <Toaster />
        <main className="auth-layout">
          <p>Loading session...</p>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster />
        <Routes>
          <Route
            path="/"
            element={(
              <main className="auth-layout">
                <h1>ToDo Management</h1>
                <p className="subtitle">Log in to manage your tasks.</p>
                <LoginForm
                  onAuthenticated={setUser}
                  onRegisterClick={() => navigate("/register")}
                />
              </main>
            )}
          />
          <Route
            path="/register"
            element={(
              <main className="auth-layout">
                <h1>ToDo Management</h1>
                <p className="subtitle">Create your account.</p>
                <RegisterForm
                  onAuthenticated={setUser}
                  onBackToLoginClick={() => navigate("/")}
                  onCancel={() => navigate("/")}
                />
              </main>
            )}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <Routes>
        <Route
          path="/tasks"
          element={<DashboardView currentUser={user} onLogout={handleLogout} />}
        />
        <Route
          path="/create-task"
          element={<CreateTask currentUser={user} onLogout={handleLogout} />}
        />
        <Route
          path="/profile"
          element={(
            <ProfileView
              currentUser={user}
              onLogout={handleLogout}
              onFullNameUpdated={(fullName) => {
                setUser((previous) => (previous ? { ...previous, fullName } : previous));
              }}
            />
          )}
        />
        <Route path="*" element={<Navigate to="/tasks" replace />} />
      </Routes>
    </>
  );
};

export default App;
