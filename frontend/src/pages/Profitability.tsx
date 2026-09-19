import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { farmHubApi, formatINR, type ScenarioResult } from "@/lib/api";

export default function Profitability() {
  const [crop, setCrop] = useState(localStorage.getItem("farmhub_selected_crop") || "Maize");
  const [landArea, setLandArea] = useState(localStorage.getItem("farmhub_land_area") || "1");
  const [landUnit, setLandUnit] = useState(localStorage.getItem("farmhub_land_unit") || "bigha");
  const [sellingPrice, setSellingPrice] = useState("");

  const cropsQuery = useQuery({ queryKey: ["crops"], queryFn: () => farmHubApi.getCrops() });
  const currentPriceQuery = useQuery({
    queryKey: ["profitability-current-price", crop],
    queryFn: () => farmHubApi.getCurrentPrices({ crop }),
    enabled: Boolean(crop),
  });
  const mutation = useMutation({
    mutationFn: () => farmHubApi.calculateEconomics({
      crop,
      land_area: Number(landArea),
      local_land_unit: landUnit,
      expected_selling_price_quintal: sellingPrice ? Number(sellingPrice) : null,
    }),
  });

  const result = mutation.data;
  const scenarios = result ? Object.values(result.scenarios) : [];
  const priceHint = currentPriceQuery.data?.[0]?.modal_price;

  const saveContext = () => {
    localStorage.setItem("farmhub_selected_crop", crop);
    localStorage.setItem("farmhub_land_area", landArea);
    localStorage.setItem("farmhub_land_unit", landUnit);
  };

  const scenarioLabel = (scenario: ScenarioResult) => scenario.scenario.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader><CardTitle>Profitability Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Crop</Label>
                <Select value={crop} onValueChange={setCrop}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{(cropsQuery.data ?? []).map((item) => <SelectItem key={item.id} value={item.name}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Land area</Label>
                <Input type="number" min="0.01" step="0.01" value={landArea} onChange={(e) => setLandArea(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Land unit</Label>
                <Select value={landUnit} onValueChange={setLandUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bigha">Bigha</SelectItem>
                    <SelectItem value="katha">Katha</SelectItem>
                    <SelectItem value="acre">Acre</SelectItem>
                    <SelectItem value="hectare">Hectare</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expected selling price (₹/quintal) · optional</Label>
              <Input type="number" min="0" step="0.01" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder={priceHint ? `Latest selected-market price: ₹${priceHint.toLocaleString("en-IN")}` : "Leave blank to use the Bihar benchmark"} />
            </div>
            <div className="flex justify-end"><Button onClick={() => { saveContext(); mutation.mutate(); }} disabled={!crop || Number(landArea) <= 0 || mutation.isPending}>{mutation.isPending ? "Calculating…" : "Calculate profitability"}</Button></div>
            {mutation.isError && <p className="text-sm text-destructive">{mutation.error instanceof Error ? mutation.error.message : "Unable to calculate profitability."}</p>}
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {scenarios.map((scenario) => (
                <Card key={scenario.scenario}>
                  <CardHeader><CardTitle className="text-lg">{scenarioLabel(scenario)}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Revenue</span><span>{formatINR(scenario.gross_revenue_inr)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Cost</span><span>{formatINR(scenario.total_cost_inr)}</span></div>
                    <div className="flex justify-between text-sm font-bold"><span>Net profit</span><span>{formatINR(scenario.net_profit_inr)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">Margin</span><span>{scenario.profit_margin_pct.toFixed(1)}%</span></div>
                    <div className="flex justify-between text-sm"><span className="text-muted-foreground">ROI</span><span>{scenario.return_on_investment_pct.toFixed(1)}%</span></div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle>Cost Breakdown</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(result.cost_breakdown).map(([key, item]) => <div key={key} className="flex justify-between gap-4 text-sm"><span>{item.category}</span><span>{formatINR(item.amount_inr)}</span></div>)}
                <div className="border-t pt-3 flex justify-between font-bold"><span>Production cost</span><span>{formatINR(result.total_estimated_production_cost_inr)}</span></div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Assumptions</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>Area: {result.acres_equivalent} acres equivalent</div>
                <div>Baseline price: {formatINR(Number(result.assumptions_summary.baseline_price_inr_quintal || 0))}/quintal</div>
                <div>Expected yield: {String(result.assumptions_summary.yield_per_acre_quintals)} qtl/acre</div>
                <div>Wastage: {String(result.assumptions_summary.wastage_pct)}%</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}