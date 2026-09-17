import React, { useState } from "react";
import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import MarketTab from "../components/tabs/MarketTab";
import AnalyticsTab from "../components/tabs/AnalyticsTab";
import IntelligenceTab from "../components/tabs/IntelligenceTab";
import NewsTab from "../components/tabs/NewsTab";
import PlansTab from "../components/tabs/PlansTab";
import Footer from "../components/Footer";

export default function Home() {
  const [activeTab, setActiveTab] = useState("market");
  const [dayOffset, setDayOffset] = useState(0);

  const scrollToTab = (tabId) => {
    setActiveTab(tabId);
    const element = document.getElementById("main-content");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Outer Shell Canvas (Matching Fundora frame) */}
      <div className="p-2 sm:p-4 max-w-[1600px] mx-auto">
        <div className="bg-white rounded-[36px] shadow-2xl border border-slate-200/80 overflow-hidden min-h-screen flex flex-col justify-between">
          
          {/* Top Floating Navbar */}
          <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

          {/* Hero Section */}
          <HeroSection
            dayOffset={dayOffset}
            setDayOffset={setDayOffset}
            onExploreClick={() => scrollToTab("market")}
          />

          {/* Main Content Area */}
          <main id="main-content" className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-12 scroll-mt-24">
            {/* Secondary Tab Switcher Bar */}
            <div className="flex items-center justify-center mb-10 overflow-x-auto pb-2">
              <div className="bg-slate-100 p-1.5 rounded-full border border-slate-200/80 flex items-center gap-1 shadow-inner">
                {[
                  { id: "market", label: "Mandi Rates" },
                  { id: "analytics", label: "Net Realization" },
                  { id: "intelligence", label: "AI Forecasts" },
                  { id: "news", label: "Verified Buyers" },
                  { id: "plans", label: "Shennong Pro" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-5 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-md"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Tab Component */}
            {activeTab === "market" && <MarketTab dayOffset={dayOffset} />}
            {activeTab === "analytics" && <AnalyticsTab />}
            {activeTab === "intelligence" && <IntelligenceTab />}
            {activeTab === "news" && <NewsTab />}
            {activeTab === "plans" && <PlansTab />}
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
}
