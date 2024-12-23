import { Route } from "react-router-dom";
import ProtectedLayout from "./ProtectedLayout";
import Index from "@/pages/Index";
import Analytics from "@/pages/Analytics";
import Audit from "@/pages/Audit";
import BankStatements from "@/pages/BankStatements";
import BankStatementAnalytics from "@/pages/BankStatementAnalytics";
import Paystubs from "@/pages/Paystubs";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Plans from "@/pages/Plans";

export const ProtectedRoutes = (
  <Route element={<ProtectedLayout>
    <Route path="/dashboard" element={<Index />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/audit" element={<Audit />} />
    <Route path="/bank-statements" element={<BankStatements />} />
    <Route path="/bank-statement-analytics" element={<BankStatementAnalytics />} />
    <Route path="/paystubs" element={<Paystubs />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="/plans" element={<Plans />} />
  </ProtectedLayout>}>
  </Route>
);