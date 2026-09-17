import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { farmHubApi } from "@/lib/api";

export default function CropPlan() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const cropName = params.get("name") || localStorage.getItem("farmhub_selected_crop") || "";
  const { data: crops = [], isLoading, error } = useQuery({ queryKey: ["crops"], queryFn: () => farmHubApi.getCrops() });
  const crop = useMemo(() => crops.find((item) => item.name.toLowerCase() === cropName.toLowerCase()), [crops, cropName]);

  const storedProfile = localStorage.getItem("farmer_profile");
  let landLabel = "Not set";
  if (storedProfile) {
    try {
      const profile = JSON.parse(storedProfile) as { landArea?: string; landUnit?: string };
      if (profile.landArea && profile.landUnit) landLabel = `${profile.landArea} ${profile.landUnit}`;
    } catch {
      // Ignore malformed local draft data.
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader><CardTitle>Crop Plan Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {isLoading && <p className="text-sm text-muted-foreground">Loading crop plan data…</p>}
            {error && <p className="text-sm text-destructive">Unable to load the crop catalogue.</p>}
            {!isLoading && !error && !crop && <p className="text-sm text-muted-foreground">Select a supported Bihar crop to create a plan.</p>}
            {crop && (
              <>
                <div className="text-center"><h2 className="text-2xl font-bold text-foreground">{crop.name}</h2><p className="text-muted-foreground">{crop.name_hi} · {crop.category}</p></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-muted p-4 rounded-lg"><p className="text-sm text-muted-foreground">Sowing window</p><p className="font-semibold">{crop.sowing_window}</p></div>
                  <div className="bg-muted p-4 rounded-lg"><p className="text-sm text-muted-foreground">Harvest window</p><p className="font-semibold">{crop.harvest_window}</p></div>
                  <div className="bg-muted p-4 rounded-lg"><p className="text-sm text-muted-foreground">Land</p><p className="font-semibold">{landLabel}</p></div>
                </div>
                <div className="text-sm text-muted-foreground">Typical duration: {crop.duration_days} days. Major Bihar districts: {crop.major_districts.join(", ")}.</div>
                <div className="flex gap-2"><Button variant="outline" onClick={() => navigate("/crop-selection")} className="flex-1">Change crop</Button><Button onClick={() => navigate(`/price-intelligence?crop=${encodeURIComponent(crop.name)}`)} className="flex-1">View market intelligence</Button></div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}