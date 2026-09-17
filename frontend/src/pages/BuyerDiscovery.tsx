import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BuyerDiscovery() {
  // Mock data for nearby buyers/distributors
  const buyers = [
    {
      name: "Green Valley Distributors",
      crop: "Wheat, Rice",
      location: "Delhi",
      verified: true,
      distance: "12 km",
    },
    {
      name: "AgriTrade Solutions",
      crop: "Cotton, Mustard",
      location: "Ghaziabad",
      verified: true,
      distance: "20 km",
    },
    {
      name: "Fresh Harvest Pvt Ltd",
      crop: "Potato, Onion",
      location: "Noida",
      verified: false,
      distance: "25 km",
    },
    {
      name: "Metro Mandi Connect",
      crop: "All grains",
      location: "Faridabad",
      verified: true,
      distance: "30 km",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Nearby Buyers & Distributors</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Verified buyers looking for your crop
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {buyers.map((buyer) => (
                <div
                  key={buyer.name}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {buyer.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {buyer.crop}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {buyer.location} • {buyer.distance}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={buyer.verified ? "default" : "secondary"}
                      >
                        {buyer.verified ? "Verified" : "Unverified"}
                      </Badge>
                      <Button size="sm">Contact</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}