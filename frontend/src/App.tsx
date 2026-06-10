import { Navigate, Route, Routes } from "react-router-dom";

import { RequireAuth } from "@/components/require-auth";
import { TopBar } from "@/components/layout/top-bar";
import CandidateDetailPage from "@/pages/candidate-detail-page";
import CandidateListPage from "@/pages/candidate-list-page";
import LoginPage from "@/pages/login-page";

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <CandidateListPage />
            </RequireAuth>
          }
        />
        <Route
          path="/candidates/:id"
          element={
            <RequireAuth>
              <CandidateDetailPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
