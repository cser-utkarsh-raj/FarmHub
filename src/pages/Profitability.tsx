import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Profitability() {
  // Mock data
  const scenarios = [
    {
      name: "Conservative",
      revenue: 50000,
      cost: 35000,
      profit: 15000,
      color: "text-muted-foreground",
    },
    {
      name: "Expected",
      revenue: 65000,
      cost: 35000,
      profit: 30000,
      color: "text-primary",
    },
    {
      name: "Higher-price",
      revenue: 80000,
      cost: 35000,
      profit: 45000,
      color: "text-green-600",
    },
  ];

  const totalCost = 35000;
  const costBreakdown = [
    { category: "Seeds & Fertilizers", amount: 12000 },
    { category: "Labor", amount: 8000 },
    { category: "Irrigation", amount: 5000 },
    { category: "Transport", amount: 4000 },
    { category: "Other", amount: 6000 },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.name}>
                <CardHeader>
                  <CardTitle className="text-lg">{scenario.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Revenue</span>
                    <span className="font-mono">₹{scenario.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-mono">₹{scenario.cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold">
                    <span>Profit</span>
                    <span className={scenario.color}>₹{scenario.profit.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {costBreakdown.map((item) => (
                <div key={item.category} className="flex justify-between items-center">
                  <span className="text-sm">{item.category}</span>
                  <span className="font-mono text-sm">₹{item.amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Total Cost</span>
                <span className="font-mono">₹{totalCost.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action */}
          <div className="flex justify-end">
            <Button>View Detailed Analysis</Button>
          </div>
        </div>
      </div>
    </div>
  );
}