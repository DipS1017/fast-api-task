import { Navigate, Link, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import Login from "./pages/Login";
import CandidateList from "./pages/CandidateList";
import CandidateDetail from "./pages/CandidateDetail";

function RequireAuth({ children }) {
  const { auth } = useAuth();
  const location = useLocation();
  if (!auth) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function TopBar() {
  const { auth, logout } = useAuth();
  if (!auth) return null;
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        TechKraft · Candidate Review
      </Link>
      <div className="topbar-right">
        <span className="role-badge">{auth.role}</span>
        <button className="link-btn" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <TopBar />
      <main className="container">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <CandidateList />
              </RequireAuth>
            }
          />
          <Route
            path="/candidates/:id"
            element={
              <RequireAuth>
                <CandidateDetail />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
}
