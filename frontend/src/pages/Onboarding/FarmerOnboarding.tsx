import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { farmHubApi } from "@/lib/api";
import DotFooter from "@/components/DotFooter";

export default function FarmerOnboarding() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    password: "",
    location: "",
    district: "",
    landArea: "1",
    landUnit: "bigha",
    irrigation: "yes",
    language: "hi",
    notes: "",
  });
  const navigate = useNavigate();
  const totalSteps = 3;

  useEffect(() => {
    if (localStorage.getItem("farmhub_token")) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (loginPhone?: string, loginPassword?: string) => {
    setError("");
    const targetPhone = (loginPhone || formData.phone).trim();
    const targetPassword = loginPassword || formData.password;
    if (!targetPhone || !targetPassword) {
      setError("Please enter both phone number and password.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await farmHubApi.login({ phone: targetPhone, password: targetPassword });
      localStorage.setItem("farmhub_token", token.access_token);
      localStorage.setItem("farmhub_phone", token.phone);
      try {
        const me = await farmHubApi.getMe();
        if (me.farmer_profile) {
          localStorage.setItem("farmhub_district", me.farmer_profile.district);
          localStorage.setItem("farmhub_land_area", String(me.farmer_profile.land_area));
          localStorage.setItem("farmhub_land_unit", me.farmer_profile.local_land_unit);
        }
      } catch {
        // The dashboard will load the profile using the authenticated token.
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please verify your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    setError("");
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }
    if (
      !formData.name.trim() ||
      !formData.phone.trim() ||
      formData.password.length < 6 ||
      !formData.district.trim() ||
      Number(formData.landArea) <= 0
    ) {
      setError("Please complete the required fields before finishing registration.");
      return;
    }
    setSubmitting(true);
    try {
      const token = await farmHubApi.register({
        phone: formData.phone,
        full_name: formData.name,
        password: formData.password,
        role: "FARMER",
        district: formData.district.trim(),
        land_area: Number(formData.landArea),
        local_land_unit: formData.landUnit,
        irrigation_availability: formData.irrigation !== "no",
        crops: localStorage.getItem("farmhub_selected_crop")
          ? [localStorage.getItem("farmhub_selected_crop")!]
          : [],
      });
      localStorage.setItem("farmhub_token", token.access_token);
      localStorage.setItem("farmhub_district", formData.district.trim());
      localStorage.setItem("farmhub_land_area", formData.landArea);
      localStorage.setItem("farmhub_land_unit", formData.landUnit);
      localStorage.setItem("farmer_profile", JSON.stringify(formData));
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { title: "Account", subtitle: "Personal Information" },
    { title: "Land", subtitle: "Farm Details" },
    { title: "Preferences", subtitle: "Language & Notes" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-4xl w-full mx-auto py-6">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
                <span className="text-xs text-sky-700 font-semibold uppercase tracking-wider">· Farmer Portal</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {mode === "register" ? "Farmer Registration" : "Farmer Sign In"}
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
            {mode === "register" ? "Already registered? Sign In" : "New farmer? Register"}
          </Button>
        </div>

        {mode === "register" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {steps.map((s, index) => (
                <div key={s.title} className="flex items-center gap-2">
                  <div
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                      ${step >= index + 1 ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"}
                    `}
                  >
                    {step > index + 1 ? "✓" : index + 1}
                  </div>
                  <div className="hidden sm:block">
                    <p className={`text-sm font-medium ${step >= index + 1 ? "text-slate-900" : "text-slate-500"}`}>
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-400">{s.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
            <Progress value={(step / totalSteps) * 100} className="h-1.5 bg-slate-200" />
          </div>
        )}

        {mode === "login" ? (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Sign in to your account</h2>
                <p className="text-slate-600 text-sm mt-1">Access verified mandi intelligence, crop economics, and weather.</p>
              </div>
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Sign In</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      className="mt-1"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="pt-2 flex flex-col gap-2">
                    <Button
                      onClick={() => handleLogin()}
                      disabled={submitting}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white"
                    >
                      {submitting ? "Signing in…" : "Sign In to Shennong"}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, phone: "9876543210", password: "farmer123" });
                        handleLogin("9876543210", "farmer123");
                      }}
                      disabled={submitting}
                      className="border-slate-300"
                    >
                      Use Demo Account (Ramesh Kumar · Purnia)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="hidden md:block">
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
                <h3 className="font-semibold text-slate-900">Practical decision support</h3>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>• Daily official Bihar mandi modal prices</li>
                  <li>• Multi-horizon harvest price forecasting</li>
                  <li>• Input cost modeling and break-even calculation</li>
                  <li>• Distance-adjusted net market comparison</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-3">
              <Card className="border-slate-200 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {step === 1 ? "Personal Details" : step === 2 ? "Land & Cultivation" : "Preferences"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {step === 1 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Farmer full name"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="10-digit mobile number"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                          id="password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="At least 6 characters"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">Village / Block</Label>
                        <Input
                          id="location"
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g. Kasba"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="district">Bihar District</Label>
                        <Input
                          id="district"
                          value={formData.district}
                          onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                          placeholder="e.g. Purnia, Patna, Nalanda, Begusarai"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="landArea">Land Area</Label>
                        <Input
                          id="landArea"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={formData.landArea}
                          onChange={(e) => setFormData({ ...formData, landArea: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="landUnit">Local Land Unit</Label>
                        <Select
                          value={formData.landUnit}
                          onValueChange={(value) => setFormData({ ...formData, landUnit: value })}
                        >
                          <SelectTrigger id="landUnit" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bigha">Bigha (Standard Bihar: 20 Katha)</SelectItem>
                            <SelectItem value="katha">Katha</SelectItem>
                            <SelectItem value="acre">Acre</SelectItem>
                            <SelectItem value="hectare">Hectare</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="irrigation">Irrigation Facility</Label>
                        <Select
                          value={formData.irrigation}
                          onValueChange={(value) => setFormData({ ...formData, irrigation: value })}
                        >
                          <SelectTrigger id="irrigation" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="yes">Available (Borewell / Canal)</SelectItem>
                            <SelectItem value="no">Rainfed only</SelectItem>
                            <SelectItem value="partial">Partial / Seasonal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="language">Preferred Interface Language</Label>
                        <Select
                          value={formData.language}
                          onValueChange={(value) => setFormData({ ...formData, language: value })}
                        >
                          <SelectTrigger id="language" className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes on Farming Experience (Optional)</Label>
                        <Textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Primary crop cycle, storage access, or nearby mandi preferences"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{error}</p>
                      {error.includes("already registered") && (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 text-emerald-700"
                          onClick={() => {
                            setMode("login");
                            setError("");
                          }}
                        >
                          Click here to sign in with this mobile number
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
                <div className="flex justify-between p-6 pt-0 border-t border-slate-100 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep((value) => Math.max(1, value - 1))}
                    disabled={step === 1 || submitting}
                    className="border-slate-300"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={submitting}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white"
                  >
                    {submitting ? "Processing…" : step === totalSteps ? "Complete Registration" : "Next"}
                  </Button>
                </div>
              </Card>
            </div>
            <div className="hidden md:block md:col-span-2 space-y-4">
              <div className="p-6 bg-white border border-slate-200 rounded-xl space-y-2 shadow-sm">
                <h3 className="font-semibold text-slate-900">Step {step} of {totalSteps}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {step === 1
                    ? "Enter your mobile number and district to map local market data and buyer discovery."
                    : step === 2
                    ? "Specifying your land area and local unit allows Shennong to estimate production volumes and break-even prices."
                    : "Tailor your preferred language and agricultural notes."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <DotFooter className="border-t-0 pt-0" />
    </div>
  );
}
