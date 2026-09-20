import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, ArrowRight, CloudRain, Droplets, LogOut, MapPin,
  RefreshCw, Sprout, Store, Sun, TrendingUp, Users, Wind
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { farmHubApi, formatINR } from "@/lib/api";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("farmhub_token");
  const [targetDate, setTargetDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  });
  const [quantity, setQuantity] = useState("10");

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => farmHubApi.getMe(),
    enabled: Boolean(token),
  });

  const farmer = meQuery.data?.farmer_profile;
  const crop = farmer?.crops?.[0] || localStorage.getItem("farmhub_selected_crop") || "Maize";
  const district = farmer?.district || localStorage.getItem("farmhub_district") || "Purnia";

  const pricesQuery = useQuery({
    queryKey: ["dashboard-prices", crop, district],
    queryFn: () => farmHubApi.getCurrentPrices({ crop, district }),
    enabled: Boolean(crop && district),
  });

  const weatherQuery = useQuery({
    queryKey: ["dashboard-weather", district],
    queryFn: () => farmHubApi.getWeather(district),
    enabled: Boolean(district),
  });

  const economicsMutation = useMutation({
    mutationFn: () => farmHubApi.calculateEconomics({
      crop,
      land_area: farmer?.land_area || Number(localStorage.getItem("farmhub_land_area") || 1),
      local_land_unit: farmer?.local_land_unit || localStorage.getItem("farmhub_land_unit") || "bigha",
      expected_selling_price_quintal: selectedPrice ?? null,
    }),
  });

  const forecastMutation = useMutation({
    mutationFn: () => farmHubApi.forecastPrice({
      crop,
      location: district,
      market: selectedMarket,
      harvest_date: targetDate,
    }),
  });

  const compareMutation = useMutation({
    mutationFn: () => farmHubApi.compareMarkets({
      farmer_district: district,
      crop,
      quantity_quintals: Math.max(0.01, Number(quantity) || 10),
    }),
  });

  const buyersQuery = useQuery({
    queryKey: ["dashboard-buyers", crop, district],
    queryFn: () => farmHubApi.getBuyers({ crop, district, verified_only: true }),
    enabled: Boolean(crop && district),
  });

  const selectedMarket = pricesQuery.data?.[0]?.market || "";
  const selectedPrice = pricesQuery.data?.[0]?.modal_price;
  const bestMarket = compareMutation.data?.find((item) => item.is_best_net_value);
  const economics = economicsMutation.data;
  const expectedScenario = economics?.scenarios?.expected;
  const breakEven = expectedScenario
    ? expectedScenario.total_cost_inr / Math.max(expectedScenario.effective_saleable_quintals, 0.01)
    : null;

  if (!token) {
    navigate("/", { replace: true });
    return null;
  }

  if (meQuery.isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading your farm…</div>;
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>We couldn't load your account</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Please sign in again. If this keeps happening, check the backend connection.</p>
            <Button onClick={() => { localStorage.removeItem("farmhub_token"); navigate("/", { replace: true }); }}>Sign in again</Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (meQuery.data.role !== "FARMER") {
    navigate("/buyer-dashboard", { replace: true });
    return null;
  }

  const signOut = () => {
    localStorage.removeItem("farmhub_token");
    localStorage.removeItem("farmhub_phone");
    localStorage.removeItem("farmer_profile");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">FarmHub · Bihar</p>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Namaste, {meQuery.data.full_name}</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {district} · {farmer?.land_area ?? "—"} {farmer?.local_land_unit ?? "land"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => navigate("/crop-selection")}><Sprout className="mr-2 h-4 w-4" /> Change crop</Button>
            <Button variant="ghost" onClick={signOut}><LogOut className="mr-2 h-4 w-4" /> Sign out</Button>
          </div>
        </header>

        {weatherQuery.isError && (
          <Alert>
            <CloudRain className="h-4 w-4" />
            <AlertTitle>Weather unavailable</AlertTitle>
            <AlertDescription>Live weather could not be loaded. FarmHub will not invent current conditions.</AlertDescription>
          </Alert>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div><CardTitle>Your current crop</CardTitle><p className="text-sm text-muted-foreground mt-1">{crop}</p></div>
              <Badge variant="secondary">{farmer?.irrigation_availability ? "Irrigated" : "Rainfed"}</Badge>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Current mandi</p><p className="text-xl font-semibold mt-1">{selectedPrice ? formatINR(selectedPrice) : "—"}</p><p className="text-xs text-muted-foreground">/ quintal</p></div>
                <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Market</p><p className="font-semibold mt-1 truncate">{selectedMarket || "No verified price"}</p></div>
                <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Harvest target</p><p className="font-semibold mt-1">{formatDate(targetDate)}</p></div>
                <div className="rounded-xl bg-muted p-4"><p className="text-xs text-muted-foreground">Break-even</p><p className="text-xl font-semibold mt-1">{breakEven ? formatINR(breakEven) : "—"}</p><p className="text-xs text-muted-foreground">after analysis</p></div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5" /> Field weather</CardTitle></CardHeader>
            <CardContent>
              {weatherQuery.isLoading && <p className="text-sm text-muted-foreground">Loading live weather…</p>}
              {weatherQuery.data && (
                <div className="space-y-3">
                  <div className="flex items-end gap-2"><span className="text-4xl font-bold">{Math.round(weatherQuery.data.current_temperature_c)}°</span><span className="text-muted-foreground pb-1">C</span></div>
                  <div className="flex gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1"><Wind className="h-4 w-4" /> {Math.round(weatherQuery.data.current_wind_speed_kmh)} km/h</span><span className="flex items-center gap-1"><Droplets className="h-4 w-4" /> {weatherQuery.data.today_spray_advisory.status}</span></div>
                  <p className="text-sm">{weatherQuery.data.today_spray_advisory.message}</p>
                  <p className="text-xs text-muted-foreground">Source: {weatherQuery.data.source}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Harvest price forecast</CardTitle><p className="text-sm text-muted-foreground">Only verified model output is shown.</p></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input type="date" value={targetDate} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)} onChange={(e) => setTargetDate(e.target.value)} />
                <Button disabled={!selectedMarket || forecastMutation.isPending} onClick={() => forecastMutation.mutate()}>
                  {forecastMutation.isPending ? "Forecasting…" : "Run forecast"}
                </Button>
              </div>
              {forecastMutation.isError && <p className="text-sm text-destructive">{forecastMutation.error instanceof Error ? forecastMutation.error.message : "Forecast unavailable."}</p>}
              {forecastMutation.data && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Expected</p><p className="font-semibold">{formatINR(forecastMutation.data.central_estimate)}</p></div>
                    <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Lower</p><p className="font-semibold">{formatINR(forecastMutation.data.lower_bound)}</p></div>
                    <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Upper</p><p className="font-semibold">{formatINR(forecastMutation.data.upper_bound)}</p></div>
                  </div>
                  <div className="flex flex-wrap gap-2"><Badge>{forecastMutation.data.confidence} confidence</Badge><Badge variant="outline">{forecastMutation.data.model_version}</Badge></div>
                  <ul className="text-xs text-muted-foreground space-y-1">{forecastMutation.data.limitations.map((item) => <li key={item}>• {item}</li>)}</ul>
                </div>
              )}
              {!forecastMutation.data && !forecastMutation.isError && <p className="text-sm text-muted-foreground">No forecast has been produced for this crop/market/date yet.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Crop economics</CardTitle><p className="text-sm text-muted-foreground">Benchmark assumptions can be refined as your actual costs are known.</p></CardHeader>
            <CardContent className="space-y-4">
              <Button disabled={economicsMutation.isPending} onClick={() => economicsMutation.mutate()}>
                {economicsMutation.isPending ? "Calculating…" : "Calculate my crop economics"}
              </Button>
              {economicsMutation.isError && <p className="text-sm text-destructive">{economicsMutation.error instanceof Error ? economicsMutation.error.message : "Economics calculation failed."}</p>}
              {expectedScenario && economics && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Expected revenue</p><p className="font-semibold">{formatINR(expectedScenario.gross_revenue_inr)}</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Expected cost</p><p className="font-semibold">{formatINR(expectedScenario.total_cost_inr)}</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Expected profit</p><p className="font-semibold">{formatINR(expectedScenario.net_profit_inr)}</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">ROI</p><p className="font-semibold">{expectedScenario.return_on_investment_pct.toFixed(1)}%</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader><CardTitle>Where should you sell?</CardTitle><p className="text-sm text-muted-foreground">Compare net realization, not just the headline mandi price.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 max-w-xl">
              <Input type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Quantity in quintals" />
              <Button disabled={compareMutation.isPending} onClick={() => compareMutation.mutate()}>{compareMutation.isPending ? "Comparing…" : "Compare markets"}</Button>
            </div>
            {compareMutation.isError && <p className="text-sm text-destructive">{compareMutation.error instanceof Error ? compareMutation.error.message : "Market comparison failed."}</p>}
            {bestMarket && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">Best net realization among returned markets</p>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-1">
                  <div><p className="text-lg font-semibold">{bestMarket.market}</p><p className="text-sm text-muted-foreground">{bestMarket.district} · {bestMarket.distance_km.toFixed(1)} km</p></div>
                  <p className="text-2xl font-bold">{formatINR(bestMarket.estimated_net_realization_quintal)}<span className="text-xs font-normal"> / qtl net</span></p>
                </div>
              </div>
            )}
            <Button variant="outline" onClick={() => navigate("/market-comparison")}>Open full market comparison <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Verified buyers</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {buyersQuery.isLoading && <p className="text-sm text-muted-foreground">Finding buyers…</p>}
              {buyersQuery.data?.slice(0, 4).map((buyer) => (
                <div key={buyer.user_id} className="flex items-center justify-between gap-3 border-b last:border-0 pb-3 last:pb-0">
                  <div><p className="font-medium">{buyer.business_name}</p><p className="text-xs text-muted-foreground">{buyer.district} · {buyer.contact_method}</p></div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
              ))}
              {!buyersQuery.isLoading && !buyersQuery.isError && !buyersQuery.data?.length && <p className="text-sm text-muted-foreground">No verified buyer matched this crop and district.</p>}
              <Button variant="outline" className="w-full" onClick={() => navigate("/buyer-discovery")}>Find buyers and send inquiries</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>7-day field outlook</CardTitle></CardHeader>
            <CardContent>
              {weatherQuery.data?.seven_day_forecast?.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {weatherQuery.data.seven_day_forecast.slice(0, 4).map((day) => (
                    <div key={day.date} className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">{new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" })}</p>
                      <p className="font-semibold">{Math.round(day.temp_max_c)}° / {Math.round(day.temp_min_c)}°</p>
                      <p className="text-xs flex items-center gap-1 mt-1"><CloudRain className="h-3 w-3" /> {Math.round(day.rain_prob_pct)}%</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">No live seven-day forecast available.</p>}
            </CardContent>
          </Card>
        </section>

        <footer className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-5 text-sm text-muted-foreground">
          <span>FarmHub · Bihar agricultural decision support</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/price-intelligence")}>Prices</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/profitability")}>Economics</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate("/buyer-discovery")}>Buyers</Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
