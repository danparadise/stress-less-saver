import { Route } from "react-router-dom";
import ProtectedLayout from "./ProtectedLayout";
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Analytics from "@/pages/Analytics";
import Audit from "@/pages/Audit";
import Paystubs from "@/pages/Paystubs";
import BankStatements from "@/pages/BankStatements";
import BankStatementAnalytics from "@/pages/BankStatementAnalytics";

const ProtectedRoute = ({ element }: { element: React.ReactNode }) => (
  <ProtectedLayout>{element}</ProtectedLayout>
);

export const ProtectedRoutes = [
  <Route key="dashboard" path="/dashboard" element={<ProtectedRoute element={<Index />} />} />,
  <Route key="settings" path="/settings" element={<ProtectedRoute element={<Settings />} />} />,
  <Route key="profile" path="/profile" element={<ProtectedRoute element={<Profile />} />} />,
  <Route key="analytics" path="/analytics" element={<ProtectedRoute element={<Analytics />} />} />,
  <Route key="audit" path="/audit" element={<ProtectedRoute element={<Audit />} />} />,
  <Route key="paystubs" path="/paystubs" element={<ProtectedRoute element={<Paystubs />} />} />,
  <Route
    key="bank-statements"
    path="/bank-statements"
    element={<ProtectedRoute element={<BankStatements />} />}
  />,
  <Route
    key="bank-statement-analytics"
    path="/bank-statements/:id/analytics"
    element={<ProtectedRoute element={<BankStatementAnalytics />} />}
  />,
];