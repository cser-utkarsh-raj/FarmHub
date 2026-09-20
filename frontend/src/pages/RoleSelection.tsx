import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sprout, Truck, Store, ArrowRight } from "lucide-react";
import DotFooter from "@/components/DotFooter";

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
      subtitle: "किसान",
      description: "Track verified mandi prices, calculate break-even economics, and forecast harvest revenue.",
      icon: <Sprout className="w-6 h-6 text-emerald-700" />,
      accentBg: "bg-emerald-50",
      accentBorder: "border-emerald-500",
    },
    {
      id: "distributor",
      title: "Distributor",
      subtitle: "वितरक / व्यापारी",
      description: "Coordinate regional aggregation, discover farmer batches, and manage supply logistics.",
      icon: <Truck className="w-6 h-6 text-sky-700" />,
      accentBg: "bg-sky-50",
      accentBorder: "border-sky-500",
    },
    {
      id: "buyer",
      title: "Commercial Buyer",
      subtitle: "खरीदार / प्रोसेसर",
      description: "Source verified Bihar agricultural commodities and review direct farmer harvest inquiries.",
      icon: <Store className="w-6 h-6 text-emerald-700" />,
      accentBg: "bg-emerald-50",
      accentBorder: "border-emerald-500",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-3xl w-full mx-auto my-auto space-y-8 py-8">
        {/* Header with Canonical Geometric Emblem */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-sm mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="36" height="36" fill="none">
              <rect width="40" height="40" rx="8" fill="#F0FDF4" />
              <rect x="5" y="5" width="13.5" height="13.5" rx="3" fill="#15803D" />
              <rect x="21.5" y="5" width="13.5" height="13.5" rx="3" fill="#0284C7" />
              <rect x="5" y="21.5" width="13.5" height="13.5" rx="3" fill="#38BDF8" />
              <rect x="21.5" y="21.5" width="13.5" height="13.5" rx="3" fill="#16A34A" />
              <path d="M20 15.5 L24.5 20 L20 24.5 L15.5 20 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="1.8" fill="#0284C7" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            SHENNONG
          </h1>
          <p className="text-base sm:text-lg font-medium text-slate-600 max-w-md mx-auto">
            Better crop and market decisions.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-xs font-semibold">
            <span>Bihar Mandi Network & Decision Support</span>
          </div>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((r) => {
            const isSelected = role === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                aria-pressed={isSelected}
                className={`
                  relative flex flex-col items-start text-left p-6 rounded-xl border bg-white transition-all duration-150
                  ${isSelected
                    ? `${r.accentBorder} ring-2 ring-emerald-600 shadow-sm`
                    : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                  }
                `}
              >
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${r.accentBg}`}>
                  {r.icon}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{r.title}</h3>
                    <span className="text-xs text-muted-foreground font-normal">{r.subtitle}</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    {r.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-emerald-600" />
                )}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="flex flex-col items-center gap-3 pt-2">
          <Button
            onClick={handleNext}
            disabled={!role}
            className="w-full sm:w-auto px-10 h-11 text-sm font-semibold bg-emerald-700 hover:bg-emerald-800 text-white transition-colors"
          >
            Continue as {role ? roles.find((r) => r.id === role)?.title : "..."}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-xs text-slate-500">
            Free decision tools for Bihar agricultural producers and trading partners.
          </p>
        </div>
      </div>

      {/* Standard .dot Ecosystem Footer */}
      <DotFooter className="border-t-0 pt-0" />
    </div>
  );
}