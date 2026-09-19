import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { farmHubApi } from "@/lib/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("farmhub_token");
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => farmHubApi.getMe(),
    enabled: Boolean(token),
  });

  const handleSignOut = () => {
    localStorage.removeItem("farmhub_token");
    localStorage.removeItem("farmer_profile");
    navigate("/");
  };

  const steps = [
    { label: "Crop Selection", description: "Choose a crop for your plan", path: "/crop-selection", icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" },
    { label: "Crop Plan", description: "Review planting and harvest details", path: "/crop-plan", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { label: "Price Intelligence", description: "See current prices and trends", path: "/price-intelligence", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { label: "Profitability", description: "Estimate revenue and costs", path: "/profitability", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
    { label: "Market Comparison", description: "Compare nearby markets", path: "/market-comparison", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" },
    { label: "Buyer Discovery", description: "Find nearby buyers and distributors", path: "/buyer-discovery", icon: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {meQuery.data ? `Namaste, ${meQuery.data.full_name}` : "FarmHub"}
            </h1>
            <p className="text-muted-foreground">
              {meQuery.data?.farmer_profile
                ? `${meQuery.data.farmer_profile.district}, Bihar · ${meQuery.data.farmer_profile.land_area} ${meQuery.data.farmer_profile.local_land_unit}`
                : "Your farm decisions, simplified"}
            </p>
          </div>
          <div className="flex gap-2">
            {token && (
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Change Role
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Your Farm Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step) => (
              <Button
                key={step.path}
                onClick={() => navigate(step.path)}
                variant="outline"
                className="w-full justify-start group hover:border-primary/40 transition-colors"
              >
                <span className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={step.icon} />
                  </svg>
                </span>
                <span className="text-left">
                  <span className="block font-medium">{step.label}</span>
                  <span className="block text-sm text-muted-foreground">
                    {step.description}
                  </span>
                </span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}