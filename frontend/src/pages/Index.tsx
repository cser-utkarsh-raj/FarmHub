import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const [search, setSearch] = useState("");
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Purnia");
  const navigate = useNavigate();

  const handleExplore = () => {
    if (!search && !crop && !district) return;
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (crop) params.set("crop", crop);
    if (district) params.set("district", district);
    navigate(`/price-intelligence?${params.toString()}`);
  };

  const crops = [
    { id: 1, name: "Maize", name_hi: "मक्का" },
    { id: 2, name: "Wheat", name_hi: "गेहूं" },
    { id: 3, name: "Rice", name_hi: "चावल" },
    { id: 4, name: "Sugarcane", name_hi: "गन्ना" },
    { id: 5, name: "Potato", name_hi: "आलू" },
    { id: 6, name: "Onion", name_hi: "प्याज" },
    { id: 7, name: "Tomato", name_hi: "टमाटर" },
    { id: 8, name: "Mustard", name_hi: "सरसों" },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-48 h-48 bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-secondary/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <img
              src="/farm-icon.svg"
              alt="FarmHub logo"
              className="w-12 h-12 text-primary"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground text-balance mb-4">
            FarmHub
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Empowering Bihar's farmers with real-time market intelligence
          </p>
        </div>

        <div className="w-full max-w-4xl space-y-8">
          <div className="farm-card">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Explore Market Prices
              </h2>
              <p className="text-muted-foreground">
                Get instant access to current mandi prices for your crops
              </p>
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <Label htmlFor="search-crop" className="text-sm font-medium">
                      Crop
                    </Label>
                    <Select value={crop} onValueChange={setCrop}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select crop..." />
                      </SelectTrigger>
                      <SelectContent>
                        {crops.map((c) => (
                          <SelectItem key={c.id} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="search-district" className="text-sm font-medium">
                      District
                    </Label>
                    <Input
                      id="search-district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="Enter district (e.g., Purnia)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="search-term" className="text-sm font-medium">
                      Search
                    </Label>
                    <Input
                      id="search-term"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search crops or mandis..."
                    />
                  </div>
                </div>
                <Button
                  onClick={handleExplore}
                  className="w-full py-3 font-medium gradient-earth hover:opacity-90 transition-opacity"
                >
                  Explore Prices →
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="farm-card">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Crop Planning</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Plan your planting schedule with optimal timing and variety selection
                </p>
              </CardContent>
              <CardFooter className="pt-4">
                <Button variant="outline" size="sm" className="text-primary/80 hover:text-primary">
                  Learn More
                </Button>
              </CardFooter>
            </Card>

            <Card className="farm-card">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-secondary/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Market Intelligence</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Access real-time prices, trends, and forecasts from local mandis
                </p>
              </CardContent>
              <CardFooter className="pt-4">
                <Button variant="outline" size="sm" className="text-secondary/80 hover:text-secondary">
                  Learn More
                </Button>
              </CardFooter>
            </Card>

            <Card className="farm-card">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center">
                    <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Profitability Analysis</h3>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Calculate costs, revenues, and break-even points for your crops
                </p>
              </CardContent>
              <CardFooter className="pt-4">
                <Button variant="outline" size="sm" className="text-accent/80 hover:text-accent">
                  Learn More
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="farm-card text-center py-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Ready to make better farm decisions?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xl">
              Join thousands of farmers in Bihar who are using FarmHub to optimize their harvests and maximize profits
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="py-3 px-6 font-medium gradient-earth hover:opacity-90 transition-opacity">
                Get Started Free
              </Button>
              <Button variant="outline" className="py-3 px-6 font-medium text-foreground/80 hover:text-foreground">
                Take a Tour
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}