import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ShennongNavbarProps {
  userRole?: "FARMER" | "BUYER" | "DISTRIBUTOR" | null;
  userName?: string;
  userDistrict?: string;
}

export const ShennongNavbar: React.FC<ShennongNavbarProps> = ({
  userRole = "FARMER",
  userName,
  userDistrict,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const signOut = () => {
    localStorage.removeItem("farmhub_token");
    localStorage.removeItem("farmhub_phone");
    localStorage.removeItem("farmer_profile");
    navigate("/", { replace: true });
  };

  const farmerNavItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "My Crops", path: "/crop-selection" },
    { label: "Mandi Prices", path: "/price-intelligence" },
    { label: "Economics", path: "/profitability" },
    { label: "Compare Markets", path: "/market-comparison" },
    { label: "Buyers", path: "/buyer-discovery" },
  ];

  const distributorNavItems = [
    { label: "Distributor Desk", path: "/distributor-dashboard" },
    { label: "Mandi Prices", path: "/price-intelligence" },
    { label: "Market Comparison", path: "/market-comparison" },
    { label: "Partner Directory", path: "/buyer-discovery" },
  ];

  const buyerNavItems = [
    { label: "Buyer Desk", path: "/buyer-dashboard" },
    { label: "Mandi Prices", path: "/price-intelligence" },
    { label: "Market Comparison", path: "/market-comparison" },
    { label: "Partner Directory", path: "/buyer-discovery" },
  ];

  const navItems =
    userRole === "DISTRIBUTOR"
      ? distributorNavItems
      : userRole === "BUYER"
      ? buyerNavItems
      : farmerNavItems;

  const homePath =
    userRole === "DISTRIBUTOR"
      ? "/distributor-dashboard"
      : userRole === "BUYER"
      ? "/buyer-dashboard"
      : "/dashboard";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-4">
          <Link to={homePath} className="flex items-center gap-2.5">
            {/* Geometric Field Emblem */}
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center p-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="24" height="24" fill="none">
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
              <span className="font-extrabold tracking-tight text-lg text-slate-900 block leading-tight">
                SHENNONG
              </span>
              <span className="text-[9px] uppercase tracking-widest font-semibold text-sky-700 block leading-none">
                Bihar
              </span>
            </div>
          </Link>

          {userRole && (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex text-[11px] font-medium border-emerald-300 bg-emerald-50/70 text-emerald-800"
            >
              {userRole === "FARMER" ? "Farmer" : userRole === "DISTRIBUTOR" ? "Distributor" : "Buyer"}
            </Badge>
          )}
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-100 text-emerald-800 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: User Status & Sign Out */}
        <div className="hidden sm:flex items-center gap-3">
          {userName && (
            <div className="text-right text-xs">
              <span className="font-semibold text-slate-800 block truncate max-w-[140px]">{userName}</span>
              {userDistrict && <span className="text-muted-foreground">{userDistrict}</span>}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-muted-foreground hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 pt-2 pb-4 space-y-2 shadow-sm">
          {userName && (
            <div className="flex items-center gap-2 p-2 border-b border-border text-xs text-muted-foreground">
              <UserIcon className="h-4 w-4 text-emerald-700" />
              <span>{userName} {userDistrict ? `(${userDistrict})` : ""}</span>
            </div>
          )}
          <nav className="grid grid-cols-2 gap-1.5 pt-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-xs font-medium ${
                    active
                      ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="pt-2 border-t border-border flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={signOut}
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default ShennongNavbar;
