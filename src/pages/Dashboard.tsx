import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

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
            <h1 className="text-2xl font-bold text-foreground">FarmHub</h1>
            <p className="text-muted-foreground">Your farm decisions, simplified</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")}>
            Change Role
          </Button>
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