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
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", phone: "", password: "", location: "", district: "", landArea: "1", landUnit: "bigha", irrigation: "yes", language: "hi", notes: "",
  });
  const navigate = useNavigate();
  const totalSteps = 3;

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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6"><h1 className="text-2xl font-bold text-foreground">Farmer Onboarding</h1><p className="text-muted-foreground mt-1">Step {step} of {totalSteps}</p><Progress value={(step / totalSteps) * 100} className="mt-2" /></div>
        <Card>
          <CardHeader><CardTitle>{step === 1 ? "Account & Personal Information" : step === 2 ? "Land Details" : "Preferences"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {step === 1 && <div className="space-y-4">
              <div><Label htmlFor="name">Full Name</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter your full name" /></div>
              <div><Label htmlFor="phone">Phone Number</Label><Input id="phone" type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="10-digit phone number" /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="At least 6 characters" /></div>
              <div><Label htmlFor="location">Village / Town</Label><Input id="location" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Village or town name" /></div>
              <div><Label htmlFor="district">Bihar District</Label><Input id="district" value={formData.district} onChange={(e) => setFormData({ ...formData, district: e.target.value })} placeholder="e.g. Purnia" /></div>
            </div>}
            {step === 2 && <div className="space-y-4">
              <div><Label htmlFor="landArea">Land Area</Label><Input id="landArea" type="number" min="0.01" step="0.01" value={formData.landArea} onChange={(e) => setFormData({ ...formData, landArea: e.target.value })} /></div>
              <div><Label htmlFor="landUnit">Land Unit</Label><Select value={formData.landUnit} onValueChange={(value) => setFormData({ ...formData, landUnit: value })}><SelectTrigger id="landUnit"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="acre">Acre</SelectItem><SelectItem value="bigha">Bigha</SelectItem><SelectItem value="katha">Katha</SelectItem><SelectItem value="hectare">Hectare</SelectItem></SelectContent></Select></div>
              <div><Label htmlFor="irrigation">Irrigation Availability</Label><Select value={formData.irrigation} onValueChange={(value) => setFormData({ ...formData, irrigation: value })}><SelectTrigger id="irrigation"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem><SelectItem value="partial">Partial</SelectItem></SelectContent></Select></div>
            </div>}
            {step === 3 && <div className="space-y-4"><div><Label htmlFor="language">Preferred Language</Label><Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}><SelectTrigger id="language"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hi">Hindi</SelectItem><SelectItem value="en">English</SelectItem><SelectItem value="ur">Urdu</SelectItem></SelectContent></Select></div><div><Label htmlFor="notes">Additional Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Optional information" /></div></div>}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <div className="flex justify-between p-6 pt-0"><Button variant="outline" onClick={() => setStep((value) => Math.max(1, value - 1))} disabled={step === 1 || submitting}>Back</Button><Button onClick={handleNext} disabled={submitting}>{submitting ? "Creating account…" : step === totalSteps ? "Create account" : "Next"}</Button></div>
        </Card>
      </div>
    </div>
  );
}