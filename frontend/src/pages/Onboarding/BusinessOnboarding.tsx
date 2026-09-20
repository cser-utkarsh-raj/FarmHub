import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { farmHubApi } from "@/lib/api";
import DotFooter from "@/components/DotFooter";

type BusinessRole = "BUYER" | "DISTRIBUTOR";

interface Props {
  role: BusinessRole;
}

const DEFAULT_CROPS = ["Maize", "Wheat", "Paddy", "Potato", "Onion", "Tomato", "Mustard", "Gram"];

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
    regions: "Purnia, Katihar, Araria",
    crops: "Maize, Wheat, Potato",
  });

  const title = role === "BUYER" ? "Commercial Buyer" : "Distributor";
  const description =
    role === "BUYER"
      ? "Create a commercial buyer profile to discover verified Bihar crop supply and receive farmer inquiries."
      : "Create a distributor profile to manage regional sourcing aggregation and farmer supply chains.";

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
      const targetDashboard = role === "DISTRIBUTOR" ? "/distributor-dashboard" : "/buyer-dashboard";
      navigate(targetDashboard, { replace: true });
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
      const targetDashboard = role === "DISTRIBUTOR" ? "/distributor-dashboard" : "/buyer-dashboard";
      navigate(targetDashboard, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please verify your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-4xl w-full mx-auto py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1.5 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="28" height="28" fill="none">
                <rect width="40" height="40" rx="8" fill="#F0FDF4" />
                <rect x="5" y="5" width="13.5" height="13.5" rx="2.5" fill="#15803D" />
                <rect x="21.5" y="5" width="13.5" height="13.5" rx="2.5" fill="#0284C7" />
                <rect x="5" y="21.5" width="13.5" height="13.5" rx="2.5" fill="#38BDF8" />
                <rect x="21.5" y="21.5" width="13.5" height="13.5" rx="2.5" fill="#16A34A" />
                <path d="M20 16 L24 20 L20 24 L16 20 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
                <circle cx="20" cy="20" r="1.5" fill="#0284C7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider text-slate-900 uppercase">Shennong</span>
                <span className="text-xs text-sky-700 font-semibold uppercase tracking-wider">· Commercial Partner</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {mode === "register" ? `${title} Onboarding` : `${title} Sign In`}
              </h1>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
            }}
            className="border-slate-300"
          >
            {mode === "register" ? "Already registered? Sign in" : `New ${title.toLowerCase()}? Register`}
          </Button>
        </div>

        {mode === "login" ? (
          <div className="max-w-xl mx-auto space-y-6">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">Sign In to Shennong</CardTitle>
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="business-phone">Mobile Phone Number</Label>
                  <Input
                    id="business-phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                    placeholder="10-digit mobile number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="business-password">Password</Label>
                  <Input
                    id="business-password"
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="Enter your password"
                    className="mt-1"
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="pt-2 flex flex-col gap-2">
                  <Button
                    onClick={login}
                    disabled={submitting}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    {submitting ? "Signing in…" : "Sign In"}
                  </Button>
                  {role === "BUYER" ? (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        update("phone", "9876543211");
                        update("password", "buyer123");
                        farmHubApi.login({ phone: "9876543211", password: "buyer123" }).then((token) => {
                          localStorage.setItem("farmhub_token", token.access_token);
                          localStorage.setItem("farmhub_phone", token.phone);
                          navigate("/buyer-dashboard");
                        }).catch((err) => setError(err.message));
                      }}
                      disabled={submitting}
                      className="border-slate-300 text-xs"
                    >
                      Use Demo Buyer (Sanjay Agarwal · Purnia)
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        update("phone", "9876543212");
                        update("password", "buyer123");
                        farmHubApi.login({ phone: "9876543212", password: "buyer123" }).then((token) => {
                          localStorage.setItem("farmhub_token", token.access_token);
                          localStorage.setItem("farmhub_phone", token.phone);
                          navigate("/buyer-dashboard");
                        }).catch((err) => setError(err.message));
                      }}
                      disabled={submitting}
                      className="border-slate-300 text-xs"
                    >
                      Use Demo Distributor (Vikram Singh · Nalanda)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="max-w-xl">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-semibold text-slate-900">Step {step} of 2</span>
                <span className="text-slate-500 text-xs">{step === 1 ? "Authorized Person" : "Enterprise Profile"}</span>
              </div>
              <Progress value={step === 1 ? 50 : 100} className="h-1.5 bg-slate-200" />
            </div>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-lg">
                  {step === 1 ? "Authorized Contact Details" : `${title} Commercial Profile`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {step === 1 ? (
                  <>
                    <div>
                      <Label htmlFor="business-name-person">Full Name (Authorized Contact)</Label>
                      <Input
                        id="business-name-person"
                        value={form.fullName}
                        onChange={(e) => update("fullName", e.target.value)}
                        placeholder="e.g. Sanjay Agarwal"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-phone-register">Mobile Phone Number</Label>
                      <Input
                        id="business-phone-register"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update("phone", e.target.value)}
                        placeholder="10-digit mobile number"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-password-register">Password</Label>
                      <Input
                        id="business-password-register"
                        type="password"
                        value={form.password}
                        onChange={(e) => update("password", e.target.value)}
                        placeholder="At least 6 characters"
                        className="mt-1"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="business-title">Registered Business / Trade Name</Label>
                      <Input
                        id="business-title"
                        value={form.businessName}
                        onChange={(e) => update("businessName", e.target.value)}
                        placeholder={role === "BUYER" ? "e.g. Purnia Grain Agro Traders" : "e.g. Magadh Produce Aggregators"}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-district">Headquarters District (Bihar)</Label>
                      <Input
                        id="business-district"
                        value={form.district}
                        onChange={(e) => update("district", e.target.value)}
                        placeholder="e.g. Purnia, Patna, Nalanda"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business-regions">Operating Procurement Districts</Label>
                      <Textarea
                        id="business-regions"
                        value={form.regions}
                        onChange={(e) => update("regions", e.target.value)}
                        placeholder="Purnia, Katihar, Araria, Kishanganj"
                        className="mt-1"
                      />
                      <p className="text-xs text-slate-500 mt-1">Separate districts with commas.</p>
                    </div>
                    <div>
                      <Label htmlFor="business-crops">Target Crops for Procurement</Label>
                      <Textarea
                        id="business-crops"
                        value={form.crops}
                        onChange={(e) => update("crops", e.target.value)}
                        placeholder={DEFAULT_CROPS.join(", ")}
                        className="mt-1"
                      />
                      <p className="text-xs text-slate-500 mt-1">Separate commodities with commas.</p>
                    </div>
                  </>
                )}

                {error && <p className="text-sm text-destructive">{error}</p>}
              </CardContent>
              <div className="flex items-center justify-between p-6 pt-0 border-t border-slate-100 mt-4">
                <Button
                  variant="outline"
                  disabled={step === 1 || submitting}
                  onClick={() => setStep(1)}
                  className="border-slate-300"
                >
                  Back
                </Button>
                <Button
                  disabled={submitting}
                  onClick={() => (step === 1 ? setStep(2) : finish())}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  {submitting ? "Processing…" : step === 1 ? "Next: Business Profile" : "Register Business Profile"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      <DotFooter className="border-t-0 pt-0" />
    </div>
  );
}
