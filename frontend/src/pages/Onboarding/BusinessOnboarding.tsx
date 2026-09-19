import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { farmHubApi } from "@/lib/api";

type BusinessRole = "BUYER" | "DISTRIBUTOR";

interface Props {
  role: BusinessRole;
}

const DEFAULT_CROPS = ["Maize", "Wheat", "Rice", "Potato", "Onion", "Tomato"];

export default function BusinessOnboarding({ role }: Props) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    password: "",
    businessName: "",
    district: "Purnia",
    regions: "Purnia",
    crops: "Maize, Wheat, Potato",
  });

  const title = role === "BUYER" ? "Buyer" : "Distributor";
  const description =
    role === "BUYER"
      ? "Create a buyer profile to discover farm supply and manage crop inquiries."
      : "Create a distributor profile to manage sourcing regions and farmer supply.";

  const cropList = useMemo(
    () => form.crops.split(",").map((crop) => crop.trim()).filter(Boolean),
    [form.crops],
  );
  const regionList = useMemo(
    () => form.regions.split(",").map((region) => region.trim()).filter(Boolean),
    [form.regions],
  );

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const finish = async () => {
    setError("");
    if (
      !form.fullName.trim() ||
      !form.phone.trim() ||
      form.password.length < 6 ||
      !form.businessName.trim() ||
      !form.district.trim() ||
      cropList.length === 0 ||
      regionList.length === 0
    ) {
      setError("Please complete all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await farmHubApi.register({
        phone: form.phone,
        full_name: form.fullName,
        password: form.password,
        role,
        district: form.district.trim(),
        business_name: form.businessName.trim(),
        operating_regions: regionList,
        crops_purchased: cropList,
      });
      localStorage.setItem("farmhub_token", token.access_token);
      localStorage.setItem("farmhub_phone", token.phone);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const login = async () => {
    setError("");
    if (!form.phone.trim() || form.password.length < 6) {
      setError("Enter your phone number and password.");
      return;
    }

    setSubmitting(true);
    try {
      const token = await farmHubApi.login({ phone: form.phone, password: form.password });
      localStorage.setItem("farmhub_token", token.access_token);
      localStorage.setItem("farmhub_phone", token.phone);
      const me = await farmHubApi.getMe();
      if (me.role !== role) {
        localStorage.removeItem("farmhub_token");
        throw new Error("This account is registered as " + me.role.toLowerCase() + ", not " + title.toLowerCase() + ".");
      }
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please verify your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  if (mode === "login") {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <img src="/farm-icon.svg" alt="FarmHub" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{title} Sign In</h1>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setMode("register"); setError(""); }}>
              New {title.toLowerCase()}? Register
            </Button>
          </div>

          <Card className="max-w-xl">
            <CardHeader><CardTitle>Access your FarmHub account</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label htmlFor="business-phone">Phone Number</Label><Input id="business-phone" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit mobile number" /></div>
              <div><Label htmlFor="business-password">Password</Label><Input id="business-password" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 6 characters" /></div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button onClick={login} disabled={submitting} className="w-full gradient-earth">
                {submitting ? "Signing in…" : "Sign In"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <img src="/farm-icon.svg" alt="FarmHub" className="w-10 h-10" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">{title} Onboarding</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setMode("login"); setError(""); }}>
            Already registered? Sign in
          </Button>
        </div>

        <div className="mb-8 max-w-xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Step {step} of 2</span>
            <span className="text-muted-foreground">{step === 1 ? "Account" : "Business profile"}</span>
          </div>
          <Progress value={step === 1 ? 50 : 100} className="h-1" />
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>{step === 1 ? "Account details" : title + " profile"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 1 ? (
              <>
                <div><Label htmlFor="business-name-person">Full Name</Label><Input id="business-name-person" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} placeholder="Your name" /></div>
                <div><Label htmlFor="business-phone-register">Phone Number</Label><Input id="business-phone-register" type="tel" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="10-digit mobile number" /></div>
                <div><Label htmlFor="business-password-register">Password</Label><Input id="business-password-register" type="password" value={form.password} onChange={(e) => update("password", e.target.value)} placeholder="At least 6 characters" /></div>
              </>
            ) : (
              <>
                <div><Label htmlFor="business-title">Business Name</Label><Input id="business-title" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} placeholder={role === "BUYER" ? "e.g. Purnia Agro Buyers" : "e.g. Bihar Farm Supply"} /></div>
                <div><Label htmlFor="business-district">Primary District</Label><Input id="business-district" value={form.district} onChange={(e) => update("district", e.target.value)} placeholder="e.g. Purnia" /></div>
                <div><Label htmlFor="business-regions">Operating Regions</Label><Textarea id="business-regions" value={form.regions} onChange={(e) => update("regions", e.target.value)} placeholder="Purnia, Katihar, Araria" /></div>
                <div><Label htmlFor="business-crops">Crops / Produce</Label><Textarea id="business-crops" value={form.crops} onChange={(e) => update("crops", e.target.value)} placeholder={DEFAULT_CROPS.join(", ")} /></div>
                <p className="text-xs text-muted-foreground">Separate multiple regions or crops with commas.</p>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <div className="flex items-center justify-between p-6 pt-0">
            <Button variant="outline" disabled={step === 1 || submitting} onClick={() => setStep(1)}>Back</Button>
            <Button disabled={submitting} onClick={() => step === 1 ? setStep(2) : finish()} className="gradient-earth">
              {submitting ? "Creating account…" : step === 1 ? "Continue" : "Create account"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
