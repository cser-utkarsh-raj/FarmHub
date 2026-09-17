import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSearchParams, useNavigate } from "react-router-dom";
import { farmHubApi } from "@/lib/api";

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
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Crop Selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search crops..."
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
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    if (cat === "all") next.delete("category");
                    else next.set("category", cat);
                    setParams(next);
                  }}
                >
                  {cat === "all" ? "All" : crops.find((c) => normalizeCategory(c.category) === cat)?.category ?? cat}
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
                <Card key={crop.id} className="p-4 hover:shadow-lg transition-shadow">
                  <h3 className="font-bold text-foreground mb-1">{crop.name}</h3>
                  <p className="text-sm text-muted-foreground">{crop.name_hi}</p>
                  <p className="text-xs text-muted-foreground mt-1">{crop.category} · {crop.duration_days} days</p>
                  <Button size="sm" onClick={() => handleSelect(crop)} className="w-full mt-3">Select</Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}