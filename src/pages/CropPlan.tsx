import { useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CropPlan() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const cropName = params.get("name") || "Cabbage";
  const variety = params.get("variety") || "Local";
  const cropId = params.get("crop") || "1";

  // Mock data for planting/harvest dates
  const plantingDate = "10 Oct";
  const harvestDate = "~15 Dec";
  const landArea = "2 bigha";

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Crop Plan Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">{cropName}</h2>
              <p className="text-muted-foreground">{variety}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Planting</p>
                <p className="text-xl font-semibold text-foreground">{plantingDate}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Expected Harvest</p>
                <p className="text-xl font-semibold text-foreground">{harvestDate}</p>
              </div>
              <div className="bg-muted p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground">Land</p>
                <p className="text-xl font-semibold text-foreground">{landArea}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate("/crop-selection")}
                className="flex-1"
              >
                Change Crop
              </Button>
              <Button
                onClick={() => navigate("/price-intelligence")}
                className="flex-1"
              >
                View Market Intelligence
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}