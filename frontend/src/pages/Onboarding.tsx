import { Routes, Route } from "react-router-dom";
import RoleSelection from "./RoleSelection";
import FarmerOnboarding from "./Onboarding/FarmerOnboarding";
import BusinessOnboarding from "./Onboarding/BusinessOnboarding";

export default function Onboarding() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/farmer" element={<FarmerOnboarding />} />
      <Route path="/distributor" element={<BusinessOnboarding role="DISTRIBUTOR" />} />
      <Route path="/buyer" element={<BusinessOnboarding role="BUYER" />} />
    </Routes>
  );
}
