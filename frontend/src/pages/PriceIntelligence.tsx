import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { farmHubApi, formatINR } from "@/lib/api";

export default function PriceIntelligence() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [crop, setCrop] = useState(params.get("crop") || localStorage.getItem("farmhub_selected_crop") || "Maize");
  const [district, setDistrict] = useState(localStorage.getItem("farmhub_district") || "Purnia");
  const [market, setMarket] = useState(params.get("market") || localStorage.getItem("farmhub_selected_market") || "");
  const [targetDate, setTargetDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    const savedDistrict = localStorage.getItem("farmhub_district");
    if (savedDistrict) setDistrict(savedDistrict);
  }, []);

  const cropsQuery = useQuery({ queryKey: ["crops"], queryFn: () => farmHubApi.getCrops() });
  const pricesQuery = useQuery({
    queryKey: ["current-prices", crop, district],
    queryFn: () => farmHubApi.getCurrentPrices({ crop, district }),
    enabled: Boolean(crop && district),
  });

  const markets = useMemo(() => pricesQuery.data ?? [], [pricesQuery.data]);
  useEffect(() => {
    if (markets.length && !markets.some((item) => item.market === market)) {
      setMarket(markets[0].market);
      localStorage.setItem("farmhub_selected_market", markets[0].market);
    }
  }, [markets, market]);

  const historyQuery = useQuery({
    queryKey: ["price-history", crop, market],
    queryFn: () => farmHubApi.getPriceHistory(crop, market, 90),
    enabled: Boolean(crop && market),
  });

  const forecastQuery = useQuery({
    queryKey: ["forecast", crop, district, market, targetDate],
    queryFn: () => farmHubApi.forecastPrice({ crop, location: district, market, harvest_date: targetDate }),
    enabled: false,
  });

  const current = useMemo(() => {
    if (!market) return undefined;
    return markets.find((item) => item.market === market);
  }, [markets, market]);

  const history = historyQuery.data?.history ?? [];
  const latest = history.length ? history[history.length - 1] : undefined;
  const previous = history.length > 1 ? history[history.length - 2] : undefined;
  const changePct = latest && previous && previous.modal_price > 0
    ? ((latest.modal_price - previous.modal_price) / previous.modal_price) * 100
    : null;
  const chartData = history.slice(-30);
  const minPrice = chartData.length ? Math.min(...chartData.map((p) => p.modal_price)) : 0;
  const maxPrice = chartData.length ? Math.max(...chartData.map((p) => p.modal_price)) : 1;
  const range = Math.max(maxPrice - minPrice, 1);

  const runForecast = () => {
    if (!crop || !district || !market) return;
    forecastQuery.refetch();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={crop} onValueChange={setCrop}>
            <SelectTrigger><SelectValue placeholder="Crop" /></SelectTrigger>
            <SelectContent>{(cropsQuery.data ?? []).map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}</SelectContent>
          </Select>
          <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Bihar district" />
          <Select value={market} onValueChange={(value) => { setMarket(value); localStorage.setItem("farmhub_selected_market", value); }}>
            <SelectTrigger><SelectValue placeholder={pricesQuery.isLoading ? "Loading mandis…" : "Mandi"} /></SelectTrigger>
            <SelectContent>{markets.map((item) => <SelectItem key={item.market} value={item.market}>{item.market}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {pricesQuery.isError && <p className="text-sm text-destructive">Unable to load current mandi prices.</p>}
        {!pricesQuery.isLoading && !pricesQuery.isError && markets.length === 0 && <p className="text-sm text-muted-foreground">No current price records are available for this crop and district.</p>}

        <Card>
          <CardHeader><CardTitle>Current Market Price</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Modal price · {market || "No mandi selected"}</p>
                <p className="text-3xl font-bold text-foreground">{current ? formatINR(current.modal_price) : "—"}<span className="text-sm font-normal text-muted-foreground"> / quintal</span></p>
              </div>
              {changePct !== null && <Badge variant={changePct >= 0 ? "default" : "destructive"}>{changePct >= 0 ? "+" : ""}{changePct.toFixed(1)}%</Badge>}
            </div>
            <p className="text-muted-foreground text-sm">Reported on {current?.record_date ? new Date(current.record_date).toLocaleDateString("en-IN") : "—"} · Bihar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Trend</CardTitle>
            <p className="text-muted-foreground text-sm">Last 30 available observations from the selected mandi</p>
          </CardHeader>
          <CardContent>
            {historyQuery.isLoading && <p className="text-sm text-muted-foreground">Loading price history…</p>}
            {historyQuery.isError && <p className="text-sm text-destructive">Historical prices are unavailable for this mandi.</p>}
            {chartData.length > 0 && (
              <div className="h-48 flex items-end gap-1">
                {chartData.map((point) => {
                  const height = ((point.modal_price - minPrice) / range) * 100;
                  return <div key={`${point.record_date}-${point.id}`} className="flex-1 min-w-1" title={`${point.record_date}: ${formatINR(point.modal_price)}`}><div className="w-full bg-primary/70 rounded-t" style={{ height: `${Math.max(height, 2)}%` }} /></div>;
                })}
              </div>
            )}
            {chartData.length === 0 && !historyQuery.isLoading && <p className="text-sm text-muted-foreground">No historical observations available.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Price Forecast</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input type="date" value={targetDate} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} max={new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)} onChange={(e) => setTargetDate(e.target.value)} />
              <Button onClick={runForecast} disabled={!market || forecastQuery.isFetching}>{forecastQuery.isFetching ? "Calculating…" : "Run forecast"}</Button>
            </div>
            {forecastQuery.isError && <p className="text-sm text-destructive">{forecastQuery.error instanceof Error ? forecastQuery.error.message : "Forecast unavailable."}</p>}
            {forecastQuery.data && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Central estimate</p><p className="text-xl font-semibold">{formatINR(forecastQuery.data.central_estimate)}<span className="text-xs font-normal"> / qtl</span></p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Lower bound</p><p className="text-xl font-semibold">{formatINR(forecastQuery.data.lower_bound)}</p></div>
                  <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Upper bound</p><p className="text-xl font-semibold">{formatINR(forecastQuery.data.upper_bound)}</p></div>
                </div>
                <p className="text-sm text-muted-foreground">Confidence: {forecastQuery.data.confidence} · Model: {forecastQuery.data.model_version}</p>
                <div className="space-y-1 text-xs text-muted-foreground">{forecastQuery.data.limitations.map((item) => <p key={item}>• {item}</p>)}</div>
              </div>
            )}
            {!forecastQuery.data && !forecastQuery.isFetching && !forecastQuery.isError && <p className="text-sm text-muted-foreground">Forecasts run only against verified market history and an installed trained model.</p>}
          </CardContent>
        </Card>

        <div className="flex justify-end"><Button variant="outline" onClick={() => navigate("/market-comparison")}>Compare markets</Button></div>
      </div>
    </div>
  );
}