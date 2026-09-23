import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, Menu, X, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ShennongLogo from "@/components/ShennongLogo";

interface ShennongNavbarProps {
  userRole?: "FARMER" | "BUYER" | "DISTRIBUTOR" | null;
  userName?: string;
  userDistrict?: string;
}

export const ShennongNavbar: React.FC<ShennongNavbarProps> = ({ userRole = "FARMER", userName, userDistrict }) => {
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

  const navItems = userRole === "DISTRIBUTOR" ? distributorNavItems : userRole === "BUYER" ? buyerNavItems : farmerNavItems;
  const homePath = userRole === "DISTRIBUTOR" ? "/distributor-dashboard" : userRole === "BUYER" ? "/buyer-dashboard" : "/dashboard";
  const roleLabel = userRole === "FARMER" ? "Farmer" : userRole === "DISTRIBUTOR" ? "Distributor" : "Buyer";

  return (
    <header className="shennong-app-nav sticky top-0 z-30 w-full">
      <div className="max-w-7xl mx-auto flex h-[74px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to={homePath} className="flex items-center gap-2.5">
            <ShennongLogo size="sm" />
            <div>
              <span className="shennong-wordmark block text-[28px]">Shennong</span>
              <span className="shennong-tagline block">Markets. Insights. Better Decisions.</span>
            </div>
          </Link>
          {userRole && <Badge variant="outline" className="hidden sm:inline-flex rounded-full border-emerald-200 bg-emerald-50/70 text-emerald-800 text-[11px]">{roleLabel}</Badge>}
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return <Link key={item.path} to={item.path} className={`px-3 py-2 rounded-full text-sm transition-all ${active ? "bg-emerald-50 text-emerald-900 font-semibold" : "text-stone-600 hover:bg-stone-100/80 hover:text-stone-900"}`}>{item.label}</Link>;
          })}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          {userName && <div className="text-right text-xs"><span className="font-semibold text-stone-800 block max-w-[140px] truncate">{userName}</span>{userDistrict && <span className="text-stone-500">{userDistrict}</span>}</div>}
          <Button variant="ghost" size="sm" onClick={signOut} className="rounded-full text-stone-500 hover:text-stone-900 hover:bg-stone-100"><LogOut className="h-4 w-4 mr-1.5" />Sign out</Button>
        </div>

        <div className="flex md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation menu">{mobileMenuOpen ? <X /> : <Menu />}</Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-[#f7f7f1] px-4 pt-2 pb-4 space-y-2 shadow-sm">
          {userName && <div className="flex items-center gap-2 p-2 border-b border-stone-200 text-xs text-stone-500"><UserIcon className="h-4 w-4 text-emerald-700" />{userName} {userDistrict ? `(${userDistrict})` : ""}</div>}
          <nav className="grid grid-cols-2 gap-1.5 pt-1">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className={`px-3 py-2 rounded-xl text-xs font-medium ${active ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "text-stone-600 hover:bg-stone-100"}`}>{item.label}</Link>;
            })}
          </nav>
          <Button variant="outline" size="sm" className="w-full rounded-full text-xs" onClick={signOut}><LogOut className="h-3.5 w-3.5 mr-1" />Sign out</Button>
        </div>
      )}
    </header>
  );
};

export default ShennongNavbar;
