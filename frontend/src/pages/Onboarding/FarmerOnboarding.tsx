import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { farmHubApi } from "@/lib/api";

export default function FarmerOnboarding() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", phone: "", password: "", location: "", district: "Purnia", landArea: "1", landUnit: "bigha", irrigation: "yes", language: "hi", notes: "",
  });
  const navigate = useNavigate();
  const totalSteps = 3;

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
        if (!localStorage.getItem("farmhub_district")) localStorage.setItem("farmhub_district", "Purnia");
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
    if (step < totalSteps) { setStep(step + 1); return; }
    if (!formData.name.trim() || !formData.phone.trim() || formData.password.length < 6 || !formData.district.trim() || Number(formData.landArea) <= 0) {
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
        district: formData.district,
        land_area: Number(formData.landArea),
        local_land_unit: formData.landUnit,
        irrigation_availability: formData.irrigation !== "no",
        crops: localStorage.getItem("farmhub_selected_crop") ? [localStorage.getItem("farmhub_selected_crop")] : [],
      });
      localStorage.setItem("farmhub_token", token.access_token);
      localStorage.setItem("farmhub_district", formData.district.trim());
      localStorage.setItem("farmhub_land_area", formData.landArea);
      localStorage.setItem("farmhub_land_unit", formData.landUnit);
      localStorage.setItem("farmer_profile", JSON.stringify(formData));
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  const steps = [
    { title: "Account", subtitle: "Personal Information" },
    { title: "Land", subtitle: "Farm Details" },
    { title: "Preferences", subtitle: "Language & Notes" },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/farm-icon.svg" alt="FarmHub" className="w-10 h-10 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {mode === "register" ? "Farmer Onboarding" : "Farmer Sign In"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {mode === "register" ? "Create your account in a few steps" : "Access your existing FarmHub account"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMode(mode === "register" ? "login" : "register");
              setError("");
            }}
          >
            {mode === "register" ? "Already registered? Sign In" : "New farmer? Register"}
          </Button>
        </div>

        {mode === "register" && (
          <>
            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                {steps.map((s, index) => (
                  <div key={s.title} className="flex items-center gap-2">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                      ${step >= index + 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
                    `}>
                      {step > index + 1 ? "✓" : index + 1}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${step >= index + 1 ? "text-foreground" : "text-muted-foreground"}`}>
                        {s.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{s.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Progress value={(step / totalSteps) * 100} className="h-1" />
            </div>
          </>
        )}

        {mode === "login" ? (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
                <p className="text-muted-foreground mt-1">Sign in to continue to your dashboard</p>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Sign In to FarmHub</CardTitle>
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
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <div className="pt-2 flex flex-col gap-2">
                    <Button onClick={() => handleLogin()} disabled={submitting} className="gradient-earth hover:opacity-90 transition-opacity">
                      {submitting ? "Signing in…" : "Sign In"}
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, phone: "9876543210", password: "farmer123" });
                        handleLogin("9876543210", "farmer123");
                      }}
                      disabled={submitting}
                    >
                      Use Demo Account (Ramesh Kumar)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="hidden md:block">
              <div className="sticky top-8">
                <img src="/agricultural-1.jpg" alt="Farmer in field" className="w-full h-72 object-cover rounded-xl" />
                <div className="mt-4 p-4 bg-card border border-border rounded-xl">
                  <h3 className="font-semibold text-foreground">Your farm, your data</h3>
                  <p className="text-sm text-muted-foreground mt-1">Track prices, plan crops, and make informed decisions.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-5 gap-8 items-start">
            <div className="md:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle>{step === 1 ? "Account & Personal Information" : step === 2 ? "Land Details" : "Preferences"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {step === 1 && (
                    <div className="space-y-4">
                      <div><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your full name" /></div>
                      <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit phone number" /></div>
                      <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="At least 6 characters" /></div>
                      <div><Label htmlFor="location">Village / Town</Label><Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Village or town name" /></div>
                      <div><Label htmlFor="district">Bihar District</Label><Input id="district" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} placeholder="e.g. Purnia" /></div>
                    </div>
                  )}
                  {step === 2 && (
                    <div className="space-y-4">
                      <div><Label htmlFor="landArea">Land Area</Label><Input id="landArea" type="number" min="0.01" step="0.01" value={formData.landArea} onChange={(e) => setFormData({ ...formData, landArea: e.target.value })} /></div>
                      <div><Label htmlFor="landUnit">Land Unit</Label><Select value={formData.landUnit} onValueChange={(value) => setFormData({ ...formData, landUnit: value })}><SelectTrigger id="landUnit"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="acre">Acre</SelectItem><SelectItem value="bigha">Bigha</SelectItem><SelectItem value="katha">Katha</SelectItem><SelectItem value="hectare">Hectare</SelectItem></SelectContent></Select></div>
                      <div><Label htmlFor="irrigation">Irrigation Availability</Label><Select value={formData.irrigation} onValueChange={(value) => setFormData({ ...formData, irrigation: value })}><SelectTrigger id="irrigation"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent></Select></div>
                    </div>
                  )}
                  {step === 3 && (
                    <div className="space-y-4">
                      <div><Label htmlFor="language">Preferred Language</Label><Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}><SelectTrigger id="language"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hi">Hindi</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="ur">Urdu</SelectItem></SelectContent></Select></div>
                      <div><Label htmlFor="notes">Additional Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional information" /></div>
                    </div>
                  )}
                  {error && (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{error}</p>
                      {error.includes("already registered") && (
                        <Button variant="link" size="sm" className="p-0 text-primary" onClick={() => { setMode("login"); setError(""); }}>
                          Click here to sign in with this mobile number
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
                <div className="flex justify-between p-6 pt-0">
                  <Button variant="outline" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1 || submitting}>
                    Back
                  </Button>
                  <Button onClick={handleNext} disabled={submitting} className="gradient-earth hover:opacity-90 transition-opacity">
                    {submitting ? "Creating account…" : step === totalSteps ? "Create account" : "Next"}
                  </Button>
                </div>
              </Card>
            </div>
            <div className="hidden md:block md:col-span-2">
              <div className="sticky top-8 space-y-4">
                <div className="p-6 bg-card border border-border rounded-xl">
                  <h3 className="font-semibold text-foreground">Step {step} of {totalSteps}</h3>
                  <p className="text-sm text-muted-foreground mt-2">
                    {step === 1 ? "Tell us about yourself and your location" : step === 2 ? "Help us understand your farm setup" : "Customize your FarmHub experience"}
                  </p>
                </div>
                <img src="/agricultural-2.jpg" alt="Farm landscape" className="w-full h-48 object-cover rounded-xl" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}