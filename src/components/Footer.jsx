import React from "react";
import { Leaf } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80 py-12 px-4 sm:px-8 mt-20 text-slate-600">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white">
            <Leaf className="w-3.5 h-3.5 fill-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight font-sans">
            Shennong
          </span>
          <span className="text-xs text-slate-400">| Agricultural Intelligence Platform</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 text-xs text-slate-500">
          <a href="#market" className="hover:text-slate-900 transition-colors">Market Rates</a>
          <a href="#analytics" className="hover:text-slate-900 transition-colors">Net Realization</a>
          <a href="#forecasts" className="hover:text-slate-900 transition-colors">AI Forecasts</a>
          <a href="#buyers" className="hover:text-slate-900 transition-colors">Verified Buyers</a>
        </div>

        {/* Presented by .dot Footer Branding (Strict Requirement) */}
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <span>Presented by</span>
          <span className="font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full text-[10px]">
            .dot
          </span>
        </div>
      </div>
    </footer>
  );
}
