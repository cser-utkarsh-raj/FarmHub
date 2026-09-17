import React, { useState, useEffect } from "react";
import { getPriceForecast } from "../../lib/api";
import { Sparkles, TrendingUp, ShieldCheck, Zap } from "lucide-react";

export default function IntelligenceTab() {
  const [crop, setCrop] = useState("Maize");
  const [district, setDistrict] = useState("Purnia");
  const [market, setMarket] = useState("Gulabbagh");
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetchForecast = async () => {
    setLoading(true);
    const res = await getPriceForecast(crop, district, market);
    setForecast(res);
    setLoading(false);
  };

  useEffect(() => {
    handleFetchForecast();
  }, [crop, district, market]);

  return (
    <div className="space-y-8 text-slate-800">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-2 border border-emerald-200">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" /> AI Forecasting Engine
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Price Intelligence & Trajectory</h2>
            <p className="text-slate-600 text-sm mt-1">
              ML time-series price predictions calibrated against historical Bihar mandi arrival logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="Maize">Maize</option>
              <option value="Wheat">Wheat</option>
              <option value="Paddy">Paddy</option>
              <option value="Potato">Potato</option>
              <option value="Mustard">Mustard</option>
            </select>

            <select
              value={market}
              onChange={(e) => setMarket(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
            >
              <option value="Gulabbagh">Gulabbagh (Purnia)</option>
              <option value="Patna City">Patna City (Patna)</option>
              <option value="Bihar Sharif">Bihar Sharif (Nalanda)</option>
              <option value="Muzaffarpur">Muzaffarpur</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 animate-pulse">Running ML Price Prediction models...</div>
      ) : forecast ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Forecast Metrics Card */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">30-Day Modal Price Target</span>
                <div className="text-4xl font-bold text-slate-900 mt-1 font-mono">
                  ₹{forecast.forecast_30d_modal_price?.toLocaleString()}
                  <span className="text-xs text-slate-500 font-sans font-normal ml-2">per Quintal</span>
                </div>
              </div>

              <div className="text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  forecast.trend_direction === "BULLISH"
                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                    : "bg-red-100 text-red-800 border border-red-200"
                }`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  {forecast.trend_direction} ({forecast.expected_change_pct > 0 ? "+" : ""}{forecast.expected_change_pct}%)
                </span>
                <div className="text-xs text-slate-500 mt-2 font-mono">
                  Confidence Score: <span className="text-emerald-700 font-bold">{forecast.confidence_pct}%</span>
                </div>
              </div>
            </div>

            {/* Projected Trajectory Chart */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">30-Day Trajectory Projection & Bounds</h4>
              <div className="space-y-3">
                {(forecast.projected_prices || []).map((pt, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-700 w-16">{pt.date}</span>
                    
                    <div className="flex-1 mx-4">
                      <div className="flex justify-between text-[10px] text-slate-500 mb-1 font-mono">
                        <span>Lower: ₹{pt.lower}</span>
                        <span className="text-emerald-700 font-bold">Target: ₹{pt.price}</span>
                        <span>Upper: ₹{pt.upper}</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden relative">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(20, ((pt.price - 2000) / 600) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-slate-900 w-16 text-right">₹{pt.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Rationale & Seasonality Insights */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Seasonality & Arrival Pattern</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                "{forecast.seasonality_summary}"
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <Zap className="w-4 h-4" />
                <span>AI Prediction Rationale</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                "{forecast.rationale}"
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
