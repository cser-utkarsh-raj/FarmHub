import { Routes, Route } from "react-router-dom";
import RoleSelection from "./RoleSelection";
import FarmerOnboarding from "./Onboarding/FarmerOnboarding";

export default function Onboarding() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/farmer" element={<FarmerOnboarding />} />
      <Route path="/distributor" element={<div>Distributor Onboarding</div>} />
      <Route path="/buyer" element={<div>Buyer Onboarding</div>} />
    </Routes>
  );
}