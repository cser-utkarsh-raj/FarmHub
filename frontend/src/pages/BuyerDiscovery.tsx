import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { farmHubApi } from "@/lib/api";

export default function BuyerDiscovery() {
  const [crop, setCrop] = useState(localStorage.getItem("farmhub_selected_crop") || "Maize");
  const [district, setDistrict] = useState(localStorage.getItem("farmhub_district") || "Purnia");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const query = useQuery({
    queryKey: ["buyers", crop, district, verifiedOnly],
    queryFn: () => farmHubApi.getBuyers({ crop, district, verified_only: verifiedOnly }),
    enabled: Boolean(crop && district),
  });

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader><CardTitle>Buyers & Distributors</CardTitle><p className="text-muted-foreground text-sm mt-1">Commercial contacts matching your crop and Bihar district.</p></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Crop</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} /></div>
              <div className="space-y-2"><Label>District</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
            </div>
            <Button variant={verifiedOnly ? "default" : "outline"} onClick={() => setVerifiedOnly((value) => !value)}>{verifiedOnly ? "Verified only" : "Include unverified"}</Button>

            {query.isLoading && <p className="text-sm text-muted-foreground">Loading buyers…</p>}
            {query.isError && <p className="text-sm text-destructive">Unable to load matching buyers.</p>}
            {!query.isLoading && !query.isError && query.data?.length === 0 && <p className="text-sm text-muted-foreground">No buyers or distributors match this crop and district.</p>}
            <div className="space-y-3">
              {(query.data ?? []).map((buyer) => (
                <div key={buyer.user_id} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{buyer.business_name}</h3>
                      <p className="text-sm text-muted-foreground">{buyer.crops_purchased.join(", ") || "Crop preferences not listed"}</p>
                      <p className="text-sm text-muted-foreground">{buyer.district}, {buyer.state} · {buyer.approx_monthly_quantity_quintals.toLocaleString("en-IN")} qtl/month approx.</p>
                    </div>
                    <Badge variant={buyer.verification_status === "VERIFIED" || buyer.verification_status === "PHONE_VERIFIED" ? "default" : "secondary"}>{buyer.verification_status.replace(/_/g, " ")}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">Preferred contact: {buyer.contact_method || "Not specified"}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}