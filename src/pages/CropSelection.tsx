import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function CropSelection() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const category = params.get("category") || "all";

  const crops = [
    { id: 1, name: "Wheat", category: "grains", variety: "HD 3086" },
    { id: 2, name: "Rice", category: "grains", variety: "Swarna" },
    { id: 3, name: "Cotton", category: "fiber", variety: "Bt Cotton" },
    { id: 4, name: "Sugarcane", category: "fiber", variety: "Co 0238" },
    { id: 5, name: "Mustard", category: "oilseeds", variety: "Varuna" },
    { id: 6, name: "Groundnut", category: "oilseeds", variety: "GG 20" },
    { id: 7, name: "Potato", category: "vegetables", variety: "Kufri Jyoti" },
    { id: 8, name: "Onion", category: "vegetables", variety: "Arka Kalyan" },
    { id: 9, name: "Tomato", category: "vegetables", variety: "Arka Saurabh" },
    { id: 10, name: "Mango", category: "fruits", variety: "Alphonso" },
    { id: 11, name: "Banana", category: "fruits", variety: "Grand Naine" },
    { id: 12, name: "Apple", category: "fruits", variety: "Red Delicious" },
  ];

  const filteredCrops = crops.filter((crop) => {
    const matchesSearch = crop.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "all" || crop.category === category;
    return matchesSearch && matchesCategory;
  });

  const handleSelect = (crop: { id: number; name: string; variety: string; category: string }) => {
    navigate(`/crop-plan?crop=${crop.id}&name=${encodeURIComponent(crop.name)}&variety=${crop.variety}`);
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
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {["all", "grains", "fiber", "oilseeds", "vegetables", "fruits"].map(
                (cat) => (
                  <Button
                    key={cat}
                    variant={cat === category ? "default" : "outline"}
                    className="flex-1"
                  >
                    {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Button>
                ),
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCrops.map((crop) => (
                <Card key={crop.id} className="p-4 hover:shadow-lg transition-shadow">
                  <h3 className="font-bold text-foreground mb-1">{crop.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {crop.variety}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleSelect(crop)}
                    className="w-full mt-2"
                  >
                    Select
                  </Button>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}