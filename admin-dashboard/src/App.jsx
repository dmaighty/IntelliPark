import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import GarageDetailPage from "./pages/GarageDetailPage";
import DefineSpotsPage from "./pages/DefineSpotsPage";

function RequireAdmin({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAdmin>
            <DashboardPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/garages/:lotId"
        element={
          <RequireAdmin>
            <GarageDetailPage />
          </RequireAdmin>
        }
      />
      <Route
        path="/levels/:levelId/spots"
        element={
          <RequireAdmin>
            <DefineSpotsPage />
          </RequireAdmin>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
