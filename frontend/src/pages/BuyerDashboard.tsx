import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LogOut, Store, TrendingUp, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { farmHubApi, type BuyerDirectoryItem, type UserResponse } from "@/lib/api";

export default function BuyerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [buyers, setBuyers] = useState<BuyerDirectoryItem[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const user = await farmHubApi.getMe();
        if (!["BUYER", "DISTRIBUTOR"].includes(user.role)) {
          navigate("/dashboard", { replace: true });
          return;
        }
        const directory = await farmHubApi.getBuyers({ verified_only: true });
        if (!active) return;
        setProfile(user);
        setBuyers(directory.slice(0, 5));
      } catch (err) {
        if (!active) return;
        const status = (err as Error & { status?: number }).status;
        if (status === 401) {
          localStorage.removeItem("farmhub_token");
          navigate("/", { replace: true });
          return;
        }
        setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [navigate]);

  const logout = () => {
    localStorage.removeItem("farmhub_token");
    localStorage.removeItem("farmhub_phone");
    navigate("/", { replace: true });
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (error) return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-md mx-auto mt-10">
        <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Unable to load dashboard</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
        <Button onClick={() => navigate("/")} className="mt-4">Back to Home</Button>
      </div>
    </div>
  );

  const isDistributor = profile?.role === "DISTRIBUTOR";
  const business = profile?.buyer_profile as { business_name?: string; district?: string; crops_purchased?: string[]; operating_regions?: string[] } | null | undefined;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div><p className="text-sm text-muted-foreground">FarmHub · Bihar</p><h1 className="text-3xl font-bold text-foreground">{isDistributor ? "Distributor Dashboard" : "Buyer Dashboard"}</h1><p className="text-muted-foreground">Welcome back, {profile?.full_name || profile?.phone}.</p></div>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" /> Sign out</Button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Business status</CardTitle><Store className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{profile?.verification_status?.replace(/_/g, " ") || "Pending"}</p><p className="text-xs text-muted-foreground">{business?.district || "Profile registered"}</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Crops tracked</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{business?.crops_purchased?.length || 0}</p><p className="text-xs text-muted-foreground">From your business profile</p></CardContent></Card>
          <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Verified network</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><p className="text-2xl font-bold">{buyers.length}</p><p className="text-xs text-muted-foreground">Verified partners listed</p></CardContent></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card><CardHeader><CardTitle>Business profile</CardTitle></CardHeader><CardContent className="space-y-3">
            <div><p className="text-xs text-muted-foreground">Business</p><p className="font-medium">{business?.business_name || "Not specified"}</p></div>
            <div><p className="text-xs text-muted-foreground">District</p><p className="font-medium">{business?.district || "Not specified"}</p></div>
            <div><p className="text-xs text-muted-foreground">Regions</p><p className="font-medium">{business?.operating_regions?.join(", ") || "Not specified"}</p></div>
            <div className="flex flex-wrap gap-2">{(business?.crops_purchased || []).map((crop) => <Badge key={crop} variant="secondary">{crop}</Badge>)}</div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle>Quick actions</CardTitle></CardHeader><CardContent className="space-y-3">
            <Button className="w-full justify-start" onClick={() => navigate("/price-intelligence")}><TrendingUp className="mr-2 h-4 w-4" /> View market prices</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/market-comparison")}><Store className="mr-2 h-4 w-4" /> Compare mandis</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate("/buyer-discovery")}><Users className="mr-2 h-4 w-4" /> Browse buyer network</Button>
          </CardContent></Card>
        </div>

        <Card><CardHeader><CardTitle>Verified partners</CardTitle></CardHeader><CardContent>
          {buyers.length === 0 ? <p className="text-sm text-muted-foreground">No verified partners are listed yet.</p> : <div className="space-y-3">{buyers.map((buyer) => <div key={buyer.user_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border p-4"><div><p className="font-medium">{buyer.business_name}</p><p className="text-sm text-muted-foreground">{buyer.district}, {buyer.state}</p><p className="text-xs text-muted-foreground mt-1">{buyer.crops_purchased.join(", ") || "Crops not listed"}</p></div><Badge variant="secondary">{buyer.verification_status.replace(/_/g, " ")}</Badge></div>)}</div>}
        </CardContent></Card>
      </div>
    </div>
  );
}
