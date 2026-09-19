import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    { label: "Crop Selection", description: "Choose a crop for your plan", path: "/crop-selection" },
    { label: "Crop Plan", description: "Review planting and harvest details", path: "/crop-plan" },
    { label: "Price Intelligence", description: "See current prices and trends", path: "/price-intelligence" },
    { label: "Profitability", description: "Estimate revenue and costs", path: "/profitability" },
    { label: "Market Comparison", description: "Compare nearby markets", path: "/market-comparison" },
    { label: "Buyer Discovery", description: "Find nearby buyers and distributors", path: "/buyer-discovery" },
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
            {steps.map((step, index) => (
              <Button
                key={step.path}
                onClick={() => navigate(step.path)}
                variant="outline"
                className="w-full justify-start"
              >
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {index + 1}
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