import React from "react";
import { Link } from "react-router-dom";
import { Leaf, Sparkles, ArrowRight } from "lucide-react";

export default function Navbar({ activeTab, setActiveTab }) {
  const navLinks = [
    { id: "market", label: "Market Rates" },
    { id: "analytics", label: "Net Realization" },
    { id: "intelligence", label: "AI Forecasts" },
    { id: "news", label: "Verified Buyers" },
    { id: "plans", label: "Pricing" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 py-4 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo with Leaf Icon */}
        <Link to="/" className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2 rounded-full border border-slate-200/80 shadow-sm hover:bg-white transition-all">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <Leaf className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight font-sans">
            Shennong
          </span>
          <span className="bg-slate-100 text-[10px] text-slate-600 font-bold px-2 py-0.5 rounded-full border border-slate-200">
            .dot
          </span>
        </Link>

        {/* Center Floating Navigation Pill (Exactly like Fundora) */}
        <nav className="hidden md:flex items-center gap-1 bg-white/80 backdrop-blur-xl border border-slate-200/80 p-1.5 rounded-full shadow-sm">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => setActiveTab && setActiveTab(link.id)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeTab === link.id
                  ? "bg-slate-900 text-white font-semibold shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Get Started Pill Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab && setActiveTab("plans")}
            className="bg-white/90 hover:bg-white text-slate-900 border border-slate-300 font-semibold text-xs px-5 py-2.5 rounded-full transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
          >
            <span>Get Started</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    </header>
  );
}
