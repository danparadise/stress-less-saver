import { Route } from "react-router-dom";
import Login from "@/pages/Login";
import Privacy from "@/pages/legal/Privacy";
import Terms from "@/pages/legal/Terms";
import CCPA from "@/pages/legal/CCPA";
import Accessibility from "@/pages/legal/Accessibility";
import Security from "@/pages/legal/Security";
import DataProcessing from "@/pages/legal/DataProcessing";
import Landing from "@/pages/Landing";

export const AuthRoutes = [
  <Route key="landing" path="/" element={<Landing />} />,
  <Route key="login" path="/login" element={<Login />} />,
  <Route key="privacy" path="/privacy" element={<Privacy />} />,
  <Route key="terms" path="/terms" element={<Terms />} />,
  <Route key="ccpa" path="/ccpa" element={<CCPA />} />,
  <Route key="accessibility" path="/accessibility" element={<Accessibility />} />,
  <Route key="security" path="/security" element={<Security />} />,
  <Route key="data-processing" path="/data-processing" element={<DataProcessing />} />,
];