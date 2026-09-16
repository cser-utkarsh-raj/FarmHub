import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface PricePoint {
  month: string;
  price: number;
  isForecast?: boolean;
}

export default function PriceIntelligence() {
  // Mock data
  const currentPrice = 25.5; // per kg
  const priceChange = 2.3; // % change from yesterday
  const priceChangeDirection = priceChange >= 0 ? "up" : "down";

  // Historical data (last 6 months)
  const historicalData: PricePoint[] = [
    { month: "Apr", price: 22.0 },
    { month: "May", price: 23.5 },
    { month: "Jun", price: 24.0 },
    { month: "Jul", price: 25.0 },
    { month: "Aug", price: 24.5 },
    { month: "Sep", price: 24.8 },
    { month: "Oct", price: 25.2 },
    { month: "Nov", price: 25.0 },
    { month: "Dec", price: 25.5 },
  ];

  // Forecast data (next 3 months)
  const forecastData: PricePoint[] = [
    { month: "Jan", price: 26.0, isForecast: true },
    { month: "Feb", price: 26.5, isForecast: true },
    { month: "Mar", price: 27.0, isForecast: true },
  ];

  const allData: PricePoint[] = [...historicalData, ...forecastData];

  const maxPrice = Math.max(...allData.map((d) => d.price));
  const minPrice = Math.min(...allData.map((d) => d.price));
  const priceRange = maxPrice - minPrice;

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Current Price */}
          <Card>
            <CardHeader>
              <CardTitle>Current Market Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Price per kg</p>
                  <p className="text-3xl font-bold text-foreground">
                    &pound;{currentPrice.toFixed(2)}
                  </p>
                </div>
                <Badge
                  variant={priceChangeDirection === "up" ? "default" : "destructive"}
                >
                  {priceChangeDirection === "up"
                    ? `+${priceChange}%`
                    : `${priceChange}%`}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                As of today &bull; Mandi: Delhi
              </p>
            </CardContent>
          </Card>

          {/* Price Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price Trend & Forecast</CardTitle>
              <p className="text-muted-foreground text-sm mt-1">
                Historical data (6 months) + Forecast (3 months)
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-48 w-full relative">
                {/* Chart background grid */}
                <div className="absolute inset-0 grid grid-cols-7 grid-rows-4 gap-0.5">
                  {[...Array(4)].map((_, row) => (
                    <div
                      key={`h-${row}`}
                      className="col-span-7 border-b border-muted/20"
                    />
                  ))}
                  {[...Array(7)].map((_, col) => (
                    <div
                      key={`v-${col}`}
                      className="row-span-4 border-r border-muted/20"
                    />
                  ))}
                </div>

                {/* Line chart */}
                <div className="absolute inset-0">
                  <div className="h-full w-full flex items-end">
                    {allData.map((point, index) => {
                      const yPercent =
                        ((point.price - minPrice) / priceRange) * 100;
                      return (
                        <div
                          key={index}
                          className="flex-1 flex items-end justify-center"
                        >
                          <div
                            className={`w-2 bg-primary transition-all duration-500 ${
                              point.isForecast ? "bg-primary/50" : ""
                            }`}
                            style={{ height: `${yPercent}%` }}
                          />
                          <div className="text-xs text-muted-foreground mt-1 w-full text-center">
                            {point.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between">
                  {allData.map((point, index) => (
                    <div
                      key={index}
                      className="flex-1 text-xs text-muted-foreground text-center"
                    >
                      {point.month}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded"></div>
                  <span>Historical</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary/50 rounded"></div>
                  <span>Forecast (not guaranteed)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Forecast Details */}
          <Card>
            <CardHeader>
              <CardTitle>Forecast Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                {forecastData.map((point) => (
                  <div key={point.month} className="p-3 bg-muted rounded-lg">
                    <div className="flex justify-between">
                      <span className="font-medium">{point.month}</span>
                      <span className="font-mono">
                        &pound;{point.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Forecast horizon: 3 months &bull; Data freshness: Updated today
              </p>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex justify-end">
            <Button onClick={() => {}} className="mt-4">
              View Detailed Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}