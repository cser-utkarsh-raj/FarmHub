import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function MarketComparison() {
  // Mock data for nearby markets
  const markets = [
    {
      name: "Delhi Azadpur",
      distance: "15 km",
      price: 26.0,
      transportCost: 1.5,
      netRealization: 24.5,
    },
    {
      name: "Ghaziabad Mandi",
      distance: "25 km",
      price: 25.5,
      transportCost: 2.0,
      netRealization: 23.5,
    },
    {
      name: "Noida Mandi",
      distance: "30 km",
      price: 25.0,
      transportCost: 2.5,
      netRealization: 22.5,
    },
    {
      name: "Faridabad Mandi",
      distance: "35 km",
      price: 24.5,
      transportCost: 3.0,
      netRealization: 21.5,
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Market Comparison</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Nearby markets for your crop
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left text-muted-foreground font-medium">
                      Market
                    </th>
                    <th className="p-2 text-left text-muted-foreground font-medium">
                      Distance
                    </th>
                    <th className="p-2 text-left text-muted-foreground font-medium">
                      Price (₹/kg)
                    </th>
                    <th className="p-2 text-left text-muted-foreground font-medium">
                      Transport Cost
                    </th>
                    <th className="p-2 text-left text-muted-foreground font-medium">
                      Net Realization
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {markets.map((market) => (
                    <tr key={market.name} className="border-t hover:bg-muted/50">
                      <td className="p-2">{market.name}</td>
                      <td className="p-2">{market.distance}</td>
                      <td className="p-2 font-mono">₹{market.price}</td>
                      <td className="p-2 font-mono">₹{market.transportCost}</td>
                      <td className="p-2 font-mono">
                        <Badge variant="secondary">₹{market.netRealization}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}