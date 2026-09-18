import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding from "./pages/Onboarding";
import RoleSelection from "./pages/RoleSelection";
import FarmerOnboarding from "./pages/Onboarding/FarmerOnboarding";
import CropSelection from "./pages/CropSelection";
import CropPlan from "./pages/CropPlan";
import PriceIntelligence from "./pages/PriceIntelligence";
import Profitability from "./pages/Profitability";
import MarketComparison from "./pages/MarketComparison";
import BuyerDiscovery from "./pages/BuyerDiscovery";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RoleSelection />} />
          <Route path="/onboarding/*" element={<Onboarding />} />
          <Route path="/onboarding/farmer" element={<FarmerOnboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/crop-selection" element={<CropSelection />} />
          <Route path="/crop-plan" element={<CropPlan />} />
          <Route path="/price-intelligence" element={<PriceIntelligence />} />
          <Route path="/profitability" element={<Profitability />} />
          <Route path="/market-comparison" element={<MarketComparison />} />
          <Route path="/buyer-discovery" element={<BuyerDiscovery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;