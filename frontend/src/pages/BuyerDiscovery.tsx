import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { farmHubApi } from "@/lib/api";
import { ShennongNavbar } from "@/components/ShennongNavbar";
import { DotFooter } from "@/components/DotFooter";

export default function BuyerDiscovery() {
  const navigate = useNavigate();
  const [crop, setCrop] = useState(localStorage.getItem("farmhub_selected_crop") || "Maize");
  const [district, setDistrict] = useState(localStorage.getItem("farmhub_district") || "Purnia");
  const [verifiedOnly, setVerifiedOnly] = useState(true);
  const [openBuyer, setOpenBuyer] = useState<number | null>(null);
  const [quantity, setQuantity] = useState("10");
  const [harvestDate, setHarvestDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 10);
  });
  const [targetPrice, setTargetPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [sentTo, setSentTo] = useState<number | null>(null);

  const meQuery = useQuery({ queryKey: ["me"], queryFn: () => farmHubApi.getMe() });
  const query = useQuery({
    queryKey: ["buyers", crop, district, verifiedOnly],
    queryFn: () => farmHubApi.getBuyers({ crop, district, verified_only: verifiedOnly }),
    enabled: Boolean(crop && district),
  });

  const inquiryMutation = useMutation({
    mutationFn: (buyerUserId: number) => farmHubApi.submitInquiry(buyerUserId, {
      buyer_id: buyerUserId,
      crop,
      quantity_quintals: Number(quantity),
      expected_harvest_date: harvestDate,
      target_price_inr: targetPrice ? Number(targetPrice) : null,
      notes: notes.trim() || undefined,
    }),
    onSuccess: (_, buyerUserId) => {
      setSentTo(buyerUserId);
      setOpenBuyer(null);
      setNotes("");
    },
  });

  const isFarmer = !meQuery.data || meQuery.data.role === "FARMER";
  const homeDashboard =
    meQuery.data?.role === "DISTRIBUTOR"
      ? "/distributor-dashboard"
      : meQuery.data?.role === "BUYER"
      ? "/buyer-dashboard"
      : "/dashboard";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ShennongNavbar
        userRole={(meQuery.data?.role as "FARMER" | "BUYER" | "DISTRIBUTOR") || "FARMER"}
        userName={meQuery.data?.full_name}
        userDistrict={district}
      />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <CardTitle>Buyers & commercial partners</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {isFarmer
                    ? "Find verified buyers and distributors for your crop and submit direct supply inquiries."
                    : "Commercial partner directory of verified buyers and regional distributors in Bihar."}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate(homeDashboard)}>
                Back to dashboard
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Crop</Label><Input value={crop} onChange={(e) => setCrop(e.target.value)} /></div>
              <div className="space-y-2"><Label>District</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} /></div>
            </div>
            <Button variant={verifiedOnly ? "default" : "outline"} onClick={() => setVerifiedOnly((value) => !value)}>
              <ShieldCheck className="mr-2 h-4 w-4" />{verifiedOnly ? "Verified only" : "Include unverified"}
            </Button>

            {query.isLoading && <p className="text-sm text-muted-foreground">Loading commercial partners…</p>}
            {query.isError && <p className="text-sm text-destructive">Unable to load matching buyers.</p>}
            {!query.isLoading && !query.isError && query.data?.length === 0 && <p className="text-sm text-muted-foreground">No buyers or distributors match this crop and district.</p>}

            <div className="space-y-3">
              {(query.data ?? []).map((buyer) => (
                <div key={buyer.user_id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{buyer.business_name}</h3>
                        <Badge variant="secondary"><ShieldCheck className="mr-1 h-3 w-3" /> {buyer.verification_status.replace(/_/g, " ")}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{buyer.crops_purchased.join(", ") || "Crop preferences not listed"}</p>
                      <p className="text-sm text-muted-foreground">{buyer.district}, {buyer.state} · approx. {buyer.approx_monthly_quantity_quintals.toLocaleString("en-IN")} qtl/month</p>
                    </div>
                    {isFarmer ? (
                      <Button onClick={() => { setOpenBuyer(openBuyer === buyer.user_id ? null : buyer.user_id); setSentTo(null); }} variant={openBuyer === buyer.user_id ? "secondary" : "default"}>
                        <Send className="mr-2 h-4 w-4" /> {openBuyer === buyer.user_id ? "Close" : "Send inquiry"}
                      </Button>
                    ) : (
                      <Badge variant="outline" className="border-sky-300 text-sky-800 bg-sky-50 py-1">
                        Commercial Peer
                      </Badge>
                    )}
                  </div>

                  {sentTo === buyer.user_id && <p className="text-sm text-emerald-700 mt-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Inquiry sent successfully. You can track the response from your account.</p>}

                  {openBuyer === buyer.user_id && (
                    <div className="mt-4 rounded-xl bg-muted/50 p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="space-y-2"><Label>Quantity (quintals)</Label><Input type="number" min="0.01" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Expected harvest</Label><Input type="date" value={harvestDate} min={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} onChange={(e) => setHarvestDate(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Target price / quintal</Label><Input type="number" min="1" step="1" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder="Optional" /></div>
                      </div>
                      <div className="space-y-2"><Label>Note to buyer</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Quality, variety, expected availability, or other useful details" /></div>
                      {inquiryMutation.isError && <p className="text-sm text-destructive">{inquiryMutation.error instanceof Error ? inquiryMutation.error.message : "Unable to send inquiry."}</p>}
                      <div className="flex justify-end"><Button disabled={inquiryMutation.isPending || Number(quantity) <= 0 || !harvestDate} onClick={() => inquiryMutation.mutate(buyer.user_id)}>{inquiryMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</> : <><Send className="mr-2 h-4 w-4" /> Send supply inquiry</>}</Button></div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Privacy note</p>
              <p className="mt-1">Shennong shares your name and phone with the buyer only through the inquiry response contract. Aadhaar numbers are never stored by Shennong.</p>
            </div>
          </CardContent>
        </Card>
      </main>
      <DotFooter />
    </div>
  );
}
