import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSearchParams, useNavigate } from "react-router-dom";
import { farmHubApi } from "@/lib/api";
import { ShennongNavbar } from "@/components/ShennongNavbar";
import { DotFooter } from "@/components/DotFooter";

function normalizeCategory(value: string) {
  return value.trim().toLowerCase();
}

export default function CropSelection() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "all";
  const { data: crops = [], isLoading, error } = useQuery({
    queryKey: ["crops"],
    queryFn: () => farmHubApi.getCrops(),
  });

  const categories = useMemo(() => {
    const values = new Map<string, string>();
    crops.forEach((crop) => values.set(normalizeCategory(crop.category), crop.category));
    return ["all", ...Array.from(values.keys())];
  }, [crops]);

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch = crop.name.toLowerCase().includes(search.toLowerCase()) || crop.name_hi.includes(search);
    const matchesCategory = category === "all" || normalizeCategory(crop.category) === category;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (crop: (typeof crops)[number]) => {
    localStorage.setItem("farmhub_selected_crop", crop.name);
    localStorage.setItem("farmhub_selected_variety", crop.id);
    navigate(`/crop-plan?name=${encodeURIComponent(crop.name)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ShennongNavbar userRole="FARMER" />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle>Bihar Crop Catalogue</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a crop to configure growth cycles, input cost benchmarks, and market analytics.
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Back to dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search crops in English or Hindi (e.g. Maize, मक्का)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="outline" onClick={() => setSearch("")}>Clear</Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={cat === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    if (cat === "all") next.delete("category");
                    else next.set("category", cat);
                    setParams(next);
                  }}
                >
                  {cat === "all" ? "All categories" : crops.find((c) => normalizeCategory(c.category) === cat)?.category ?? cat}
                </Button>
              ))}
            </div>

            {isLoading && <p className="text-sm text-muted-foreground">Loading Bihar crops…</p>}
            {error && <p className="text-sm text-destructive">Unable to load the crop catalogue. Please try again.</p>}

            {!isLoading && !error && filteredCrops.length === 0 && (
              <p className="text-sm text-muted-foreground">No crops match your search.</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCrops.map((crop) => (
                <Card key={crop.id} className="p-4 hover:border-emerald-500 hover:shadow-md transition-all border-border bg-card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-foreground text-base">{crop.name}</h3>
                      <p className="text-sm text-muted-foreground">{crop.name_hi}</p>
                    </div>
                    <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">
                      {crop.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Cycle duration: {crop.duration_days} days
                  </p>
                  <Button size="sm" onClick={() => handleSelect(crop)} className="w-full mt-4">
                    Select this crop
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <DotFooter />
    </div>
  );
}