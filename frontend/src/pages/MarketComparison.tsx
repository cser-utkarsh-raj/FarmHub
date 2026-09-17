import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { farmHubApi, formatINR } from "@/lib/api";

export default function MarketComparison() {
  const navigate = useNavigate();
  const [crop, setCrop] = useState(localStorage.getItem("farmhub_selected_crop") || "Maize");
  const [district, setDistrict] = useState(localStorage.getItem("farmhub_district") || "");
  const [quantity, setQuantity] = useState("10");
  const mutation = useMutation({
    mutationFn: () => farmHubApi.compareMarkets({
      farmer_district: district,
      crop,
      quantity_quintals: Number(quantity),
      transport_rate_per_km_quintal: 0.9,
    }),
  });

  const compare = () => {
    if (!district.trim() || Number(quantity) <= 0) return;
    localStorage.setItem("farmhub_selected_crop", crop);
    localStorage.setItem("farmhub_district", district.trim());
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Comparison</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Compare Bihar mandis by estimated net realization, not headline price alone.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-2"><Label>Crop</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} /></div>
              <div className="space-y-2"><Label>Farmer district</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Purnia" /></div>
              <div className="space-y-2"><Label>Quantity (quintals)</Label><Input type="number" min="0.1" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
            </div>
            <div className="flex justify-end"><Button onClick={compare} disabled={!district.trim() || mutation.isPending}>{mutation.isPending ? "Comparing…" : "Compare markets"}</Button></div>
            {mutation.isError && <p className="text-sm text-destructive">{mutation.error instanceof Error ? mutation.error.message : "Market comparison unavailable."}</p>}
          </CardContent>
        </Card>

        {mutation.data && (
          <Card>
            <CardContent className="pt-6">
              {mutation.data.length === 0 ? <p className="text-sm text-muted-foreground">No current Bihar market records are available for this crop.</p> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead><tr className="border-b"><th className="p-2">Market</th><th className="p-2">Distance</th><th className="p-2">Reported price</th><th className="p-2">Transport</th><th className="p-2">Mandi charges</th><th className="p-2">Net realization</th></tr></thead>
                    <tbody>{mutation.data.map((item) => <tr key={`${item.market}-${item.district}`} className="border-t hover:bg-muted/50"><td className="p-2">{item.market}<div className="text-xs text-muted-foreground">{item.district}</div></td><td className="p-2">{item.distance_km.toFixed(1)} km</td><td className="p-2">{formatINR(item.reported_price_quintal)}/qtl</td><td className="p-2">{formatINR(item.estimated_transport_cost_quintal)}/qtl</td><td className="p-2">{formatINR(item.mandi_charges_quintal)}/qtl</td><td className="p-2 font-semibold">{formatINR(item.estimated_net_realization_quintal)}/qtl {item.is_best_net_value && <Badge className="ml-2">Highest net</Badge>}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        <div className="flex justify-end"><Button variant="outline" onClick={() => navigate("/price-intelligence")}>Back to price intelligence</Button></div>
      </div>
    </div>
  );
}