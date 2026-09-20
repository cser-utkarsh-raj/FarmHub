import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RoleSelection() {
  const [role, setRole] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!role) return;
    const roleMap: Record<string, string> = {
      farmer: "/onboarding/farmer",
      distributor: "/onboarding/distributor",
      buyer: "/onboarding/buyer",
    };
    navigate(roleMap[role]);
  };

  const roles = [
    {
      id: "farmer",
      title: "Farmer",
      description: "Track crops, market prices, and plan your harvest",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      id: "distributor",
      title: "Distributor",
      description: "Connect with farmers and manage supply chains",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
    {
      id: "buyer",
      title: "Buyer",
      description: "Discover fresh produce and compare market rates",
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/farm-icon.svg" alt="FarmHub" className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Welcome to FarmHub</h1>
          <p className="text-muted-foreground text-lg mt-2">
            Select your role to get started
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              aria-pressed={role === r.id}
              className={`
                relative flex flex-col items-center gap-3 p-6 rounded-xl border transition-all duration-200
                ${role === r.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                }
              `}
            >
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                ${role === r.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}
              `}>
                {r.icon}
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-center">
          <Button
            onClick={handleNext}
            disabled={!role}
            className="w-full sm:w-auto px-8 gradient-earth hover:opacity-90 transition-opacity"
          >
            Continue
          </Button>
        </div>
        <footer className="pt-2 text-center text-xs text-muted-foreground">
          FarmHub · presented by <span className="font-semibold text-foreground">.dot</span>
        </footer>
      </div>
    </div>
  );
}