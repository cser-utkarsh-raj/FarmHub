import React, { useState } from "react";
import { Check, CreditCard, ShieldCheck, Sparkles } from "lucide-react";

export default function PlansTab() {
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    setLoadingRazorpay(true);
    setTimeout(() => {
      setLoadingRazorpay(false);
      setSubscribed(true);
    }, 1200);
  };

  return (
    <div className="space-y-8 text-slate-800 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          Shennong Pro Membership
        </span>
        <h2 className="text-4xl font-extrabold tracking-tight text-slate-900">Simple, Transparent Pricing</h2>
        <p className="text-slate-600 text-sm max-w-xl mx-auto">
          Unlock real-time price alerts, ML forecasting, verified buyer direct-connects, and net realization comparisons.
        </p>
      </div>

      {subscribed && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-center text-sm font-bold flex items-center justify-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>Shennong Pro Subscription Active! You now have full access to institutional agricultural intelligence.</span>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
        {/* Standard Free Tier */}
        <div className="bg-white border border-slate-200 rounded-[28px] p-8 flex flex-col justify-between space-y-6 shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Basic Tier</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">Mandi Explorer</h3>
            <div className="text-3xl font-bold text-slate-900 mt-4 font-mono">
              ₹0 <span className="text-xs font-normal text-slate-500 font-sans">/ forever</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Daily mandi modal price lookup</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Basic crop selection planner</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Public buyer directory viewing</span>
              </li>
            </ul>
          </div>

          <button className="w-full bg-slate-100 text-slate-600 font-semibold py-3 rounded-2xl text-xs cursor-default">
            Current Plan
          </button>
        </div>

        {/* Shennong Pro Tier */}
        <div className="bg-gradient-to-b from-white via-white to-emerald-50/50 border-2 border-emerald-500 rounded-[28px] p-8 flex flex-col justify-between space-y-6 shadow-lg relative">
          <span className="absolute -top-3 right-8 bg-emerald-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-sm">
            MOST POPULAR
          </span>

          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Shennong Pro</span>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">Institutional Intelligence</h3>
            <div className="text-4xl font-bold text-slate-900 mt-4 font-mono">
              ₹49 <span className="text-xs font-normal text-slate-500 font-sans">/ month</span>
            </div>

            <ul className="mt-6 space-y-3 text-xs text-slate-700">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>30-day ML price trajectory & confidence bounds</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Mandi net realization transport comparison</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Direct phone access to verified institutional buyers</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>SMS & WhatsApp price movement alerts</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleSubscribe}
            disabled={loadingRazorpay || subscribed}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <CreditCard className="w-4 h-4" />
            <span>
              {subscribed
                ? "Shennong Pro Active"
                : loadingRazorpay
                ? "Connecting Razorpay..."
                : "Subscribe Shennong Pro ₹49/month"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
