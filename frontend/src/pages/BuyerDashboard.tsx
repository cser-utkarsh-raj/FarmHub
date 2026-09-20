import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CheckCircle2, Clock3, PackageSearch, Store, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { farmHubApi, formatINR, type Inquiry, type UserResponse } from "@/lib/api";
import { ShennongNavbar } from "@/components/ShennongNavbar";
import { DotFooter } from "@/components/DotFooter";

function statusVariant(status: string) {
  if (status === "ACCEPTED") return "default" as const;
  if (status === "DECLINED") return "destructive" as const;
  return "secondary" as const;
}

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [buyers, setBuyers] = useState<Awaited<ReturnType<typeof farmHubApi.getBuyers>>>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const load = useCallback(async () => {
    setError("");
    try {
      const user = await farmHubApi.getMe();
      if (!["BUYER", "DISTRIBUTOR"].includes(user.role)) {
        navigate("/dashboard", { replace: true });
        return;
      }
      const [directory, inbox] = await Promise.all([
        farmHubApi.getBuyers({ verified_only: true }),
        farmHubApi.getInquiries(),
      ]);
      setProfile(user);
      setBuyers(directory);
      setInquiries(inbox);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        localStorage.removeItem("farmhub_token");
        navigate("/", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (inquiry: Inquiry, status: string) => {
    try {
      const updated = await farmHubApi.updateInquiryStatus(inquiry.id, { status });
      setInquiries((items) => items.map((item) => item.id === updated.id ? updated : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update inquiry.");
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading business dashboard…</div>;

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-lg mx-auto mt-10">
          <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Unable to load dashboard</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
          <Button onClick={() => void load()} className="mt-4">Try again</Button>
        </div>
      </div>
    );
  }

  const business = profile?.buyer_profile;
  const pending = inquiries.filter((item) => item.status === "PENDING").length;
  const accepted = inquiries.filter((item) => item.status === "ACCEPTED").length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ShennongNavbar
        userRole={profile?.role as "BUYER" | "DISTRIBUTOR"}
        userName={business?.business_name || profile?.full_name}
        userDistrict={business?.district}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs uppercase tracking-wider font-semibold text-sky-800 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                {profile?.role === "DISTRIBUTOR" ? "Distributor Operations" : "Buyer Trading Desk"}
              </span>
              <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-800 bg-emerald-50">
                {profile?.verification_status.replace(/_/g, " ")}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground">
              {business?.business_name || profile?.full_name}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Operating in {business?.district || "Bihar"} · Primary contact: {profile?.full_name}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/buyer-discovery")}>
              <Users className="mr-2 h-4 w-4 text-sky-600" /> Commercial Network
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Store className="h-4 w-4 text-emerald-600" /> Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{profile?.verification_status.replace(/_/g, " ")}</p>
              <p className="text-xs text-muted-foreground">Business identity status</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PackageSearch className="h-4 w-4 text-sky-600" /> Crops
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{business?.crops_purchased.length ?? 0}</p>
              <p className="text-xs text-muted-foreground truncate">{business?.crops_purchased.join(", ") || "No crop preferences"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-amber-600" /> Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{pending}</p>
              <p className="text-xs text-muted-foreground">Farmer inquiries awaiting response</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Accepted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{accepted}</p>
              <p className="text-xs text-muted-foreground">Accepted supply inquiries</p>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Incoming crop inquiries</CardTitle>
            <p className="text-sm text-muted-foreground">Respond to farmer supply requests directly through Shennong.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {!inquiries.length && (
              <p className="text-sm text-muted-foreground">No inquiries yet. Farmers who match your business profile will appear here when they send an inquiry.</p>
            )}
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{inquiry.crop} · {inquiry.quantity_quintals.toLocaleString("en-IN")} qtl</p>
                    <p className="text-sm text-muted-foreground">{inquiry.farmer_name} · harvest {new Date(inquiry.expected_harvest_date).toLocaleDateString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground mt-1">Received {new Date(inquiry.created_at).toLocaleDateString("en-IN")}</p>
                  </div>
                  <Badge variant={statusVariant(inquiry.status)}>{inquiry.status}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg bg-muted p-3">
                    <span className="text-xs text-muted-foreground block">Target price</span>
                    <p className="font-medium mt-0.5">{inquiry.target_price_inr ? formatINR(inquiry.target_price_inr) + " / qtl" : "Not specified"}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <span className="text-xs text-muted-foreground block">Farmer contact</span>
                    <p className="font-medium mt-0.5">{inquiry.farmer_phone || "Protected"}</p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <span className="text-xs text-muted-foreground block">Notes</span>
                    <p className="font-medium mt-0.5 truncate">{inquiry.notes || "—"}</p>
                  </div>
                </div>
                {inquiry.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" onClick={() => void updateStatus(inquiry, "ACCEPTED")}>Accept inquiry</Button>
                    <Button size="sm" variant="outline" onClick={() => void updateStatus(inquiry, "CONTACTED")}>Mark contacted</Button>
                    <Button size="sm" variant="destructive" onClick={() => void updateStatus(inquiry, "DECLINED")}>Decline</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verified commercial network</CardTitle>
            <p className="text-sm text-muted-foreground">Other verified buyers and distributors currently registered in Shennong.</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {buyers.slice(0, 6).map((buyer) => (
              <div key={buyer.user_id} className="border border-border rounded-xl p-4 bg-muted/20">
                <div className="flex justify-between gap-3">
                  <p className="font-medium text-foreground">{buyer.business_name}</p>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{buyer.district} · {buyer.contact_method}</p>
                <p className="text-xs text-muted-foreground mt-2">{buyer.crops_purchased.join(", ") || "Crop preferences not listed"}</p>
              </div>
            ))}
            {!buyers.length && <p className="text-sm text-muted-foreground">No verified commercial partners are currently listed.</p>}
          </CardContent>
        </Card>
      </main>
      <DotFooter />
    </div>
  );
}
