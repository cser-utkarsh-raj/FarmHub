import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MarketComparison from "./pages/MarketComparison";
import PriceIntelligence from "./pages/PriceIntelligence";
import Profitability from "./pages/Profitability";
import BuyerDiscovery from "./pages/BuyerDiscovery";
import CropSelection from "./pages/CropSelection";
import CropPlan from "./pages/CropPlan";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/market-comparison" element={<Home />} />
        <Route path="/price-intelligence" element={<Home />} />
        <Route path="/profitability" element={<Home />} />
        <Route path="/buyer-discovery" element={<Home />} />
        <Route path="/crop-selection" element={<Home />} />
        <Route path="/crop-plan" element={<Home />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
