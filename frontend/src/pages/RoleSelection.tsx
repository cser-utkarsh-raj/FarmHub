import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!role) return;
    // Navigate to onboarding based on role
    const roleMap: Record<string, string> = {
      farmer: "/onboarding/farmer",
      distributor: "/onboarding/distributor",
      buyer: "/onboarding/buyer",
    };
    navigate(roleMap[role]);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome to FarmHub
        </h1>
        <p className="text-muted-foreground text-lg">
          Please select your role to get started
        </p>

        <div>
          <Button
            onClick={() => setRole("farmer")}
            className="w-full"
            disabled={role === "farmer"}
          >
            I am a 🌾 Farmer
          </Button>
        </div>
        <div>
          <Button
            onClick={() => setRole("distributor")}
            className="w-full"
            disabled={role === "distributor"}
          >
            I am a 🚚 Distributor
          </Button>
        </div>
        <div>
          <Button
            onClick={() => setRole("buyer")}
            className="w-full"
            disabled={role === "buyer"}
          >
            I am a 🏪 Buyer
          </Button>
        </div>

        <button
          onClick={handleNext}
          className="mt-6 w-full"
          disabled={!role}
        >
          Continue
        </button>
      </div>
    </div>
  );
}