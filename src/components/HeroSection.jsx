import React from "react";
import { Sparkles, Play, ShieldCheck, ArrowRight, TrendingUp, RefreshCw } from "lucide-react";
import { getTodayTheme } from "../utils/dailyTheme";

export default function HeroSection({ dayOffset, setDayOffset, onExploreClick }) {
  const currentTheme = getTodayTheme(dayOffset);

  return (
    <div className="relative min-h-[92vh] flex flex-col justify-between overflow-hidden bg-slate-100/60 pt-28 pb-12 px-4 sm:px-8">
      {/* High-Res Soft Misty Landscape Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src={currentTheme.image}
          alt={currentTheme.name}
          className="w-full h-full object-cover object-center opacity-40 filter contrast-105 saturate-110 scale-105 transition-all duration-1000"
        />
        {/* Soft White Atmospheric Gradients matching Fundora */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/60 to-slate-100"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-transparent to-white/80"></div>
      </div>

      {/* Hero Header Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 pt-4">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-white/90 border border-slate-200/80 shadow-sm backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-slate-700 font-semibold">AI Powered Agricultural Intelligence</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">{currentTheme.name}</span>
          <button
            onClick={() => setDayOffset((prev) => prev + 1)}
            title="Cycle Daily Theme"
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>

        {/* Large Elegant Display Typography (Matching Fundora) */}
        <h1 className="text-5xl sm:text-7xl font-sans tracking-tight text-slate-800 font-normal leading-[1.08]">
          Agricultural Intelligence <br />
          <span className="font-serif italic font-light text-slate-900">Smarter and Safer</span>
        </h1>

        {/* Clean Subtitle */}
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto font-normal leading-relaxed">
          A next-generation digital agriculture platform designed to help you discover real mandi rates, predict 30-day price trends, and maximize net realization with zero complexity.
        </p>

        {/* Center Black CTA Button */}
        <div className="pt-2">
          <button
            onClick={onExploreClick}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm px-8 py-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2 mx-auto"
          >
            <span>Explore Mandi Rates</span>
          </button>
        </div>
      </div>

      {/* Floating Glassmorphic Cards Container (Exact Fundora Layout) */}
      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-end pt-12">
        {/* Floating Card 1 (Bottom Left - Video / AI Model Card) */}
        <div className="md:col-span-4 bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[28px] p-3.5 shadow-xl hover:shadow-2xl transition-all">
          <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 group">
            <img
              src="https://images.unsplash.com/photo-1592417817098-8f3d6ef23a81?q=80&w=800&auto=format&fit=crop"
              alt="AI Agriculture Models"
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-slate-900 ml-0.5" />
              </div>
            </div>
            <span className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-medium px-2.5 py-1 rounded-full border border-white/20">
              LIVE PREDICTION
            </span>
          </div>

          <div className="p-3">
            <p className="text-slate-800 text-xs font-medium leading-snug">
              AI models work 24/7 to predict best mandi opportunities for you
            </p>
          </div>
        </div>

        {/* Floating Card 2 (Center Atmospheric Graphic / Main Highlight) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4">
          <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-2">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=600&auto=format&fit=crop"
              alt="Harvest Center"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-emerald-900/10 backdrop-blur-[1px]"></div>
          </div>
          <span className="text-xs font-semibold text-slate-700 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200 shadow-sm">
            Gulabbagh & Regional Mandis
          </span>
        </div>

        {/* Floating Card 3 & 4 Stack (Right Column) */}
        <div className="md:col-span-4 space-y-4">
          {/* Card 3 (Top Right - Stable Returns) */}
          <div className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[24px] p-5 shadow-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Stable Returns
              </span>
              <div className="text-2xl font-bold text-slate-900 font-mono">
                ₹2,410 <span className="text-xs font-normal text-emerald-600 font-sans">+8.4%</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Projected 30-Day Modal Price</div>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-emerald-600" />
            </div>
          </div>

          {/* Card 4 (Bottom Right Speech Bubble - Quality Verification) */}
          <div className="bg-white/90 backdrop-blur-2xl border border-white/80 rounded-[24px] p-5 shadow-xl relative">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-xs font-semibold text-slate-800">
                  Automated Mandi Intelligence Quality
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">
                  100% Verified Bihar Mandi Sync & Buyer Directory
                </p>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            </div>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-600">
              <div className="flex -space-x-2">
                {["Purnia Mill", "Patna Exporter", "Nalanda Trader"].map((name, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full bg-slate-800 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white"
                  >
                    {name[0]}
                  </div>
                ))}
              </div>
              <span className="font-semibold text-slate-700">14 Verified Buyers Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
