import React, { useState, useEffect } from "react";
import { compareMarkets, calculateProfitability } from "../../lib/api";
import { Calculator, Award, ArrowUpRight } from "lucide-react";

export default function AnalyticsTab() {
  const [farmerDistrict, setFarmerDistrict] = useState("Purnia");
  const [crop, setCrop] = useState("Maize");
  const [quantity, setQuantity] = useState(100);
  const [transportRate, setTransportRate] = useState(2.5);
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Profitability Estimator States
  const [landAcres, setLandAcres] = useState(2.0);
  const [yieldPerAcre, setYieldPerAcre] = useState(25.0);
  const [expectedPrice, setExpectedPrice] = useState(2250);
  const [profitSummary, setProfitSummary] = useState(null);

  const handleCompare = async () => {
    setLoading(true);
    const res = await compareMarkets({
      farmer_district: farmerDistrict,
      crop,
      quantity_quintals: quantity,
      transport_rate_per_km_quintal: transportRate,
      mandi_fee_pct: 1.0,
    });
    setComparisonResults(res || []);
    setLoading(false);
  };

  const handleProfitCalc = async () => {
    const res = await calculateProfitability({
      crop,
      land_area_acres: landAcres,
      expected_yield_qtl_per_acre: yieldPerAcre,
      expected_price_per_qtl: expectedPrice,
    });
    setProfitSummary(res);
  };

  useEffect(() => {
    handleCompare();
    handleProfitCalc();
  }, [farmerDistrict, crop]);

  return (
    <div className="space-y-8 text-slate-800">
      {/* Analytics Header */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <Calculator className="w-7 h-7 text-emerald-600" />
          <span>Net Realization & Mandi Comparison</span>
        </h2>
        <p className="text-slate-600 text-sm mt-2 max-w-2xl">
          Evaluate net realization after deducting transport haulage and mandi fees across regional agricultural hubs.
        </p>

        {/* Inputs row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Farmer District</label>
            <input
              type="text"
              value={farmerDistrict}
              onChange={(e) => setFarmerDistrict(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Crop</label>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="Maize">Maize</option>
              <option value="Wheat">Wheat</option>
              <option value="Paddy">Paddy</option>
              <option value="Potato">Potato</option>
              <option value="Mustard">Mustard</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity (Quintals)</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Transport Rate (₹/km/qtl)</label>
            <input
              type="number"
              step="0.5"
              value={transportRate}
              onChange={(e) => setTransportRate(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:border-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleCompare}
          className="mt-5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-all shadow-sm"
        >
          {loading ? "Calculating Mandi Realization..." : "Run Mandi Net Realization Comparison"}
        </button>
      </div>

      {/* Comparison Results Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {comparisonResults.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-[24px] p-6 border transition-all duration-300 shadow-sm relative ${
              item.is_top_choice
                ? "bg-gradient-to-b from-emerald-50/60 to-white border-emerald-300 shadow-emerald-100"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}
          >
            {item.is_top_choice && (
              <span className="absolute top-4 right-4 bg-emerald-600 text-white text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                <Award className="w-3 h-3" />
                Rank #{item.recommendation_rank} Top Choice
              </span>
            )}

            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.district} District</div>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{item.market}</h3>

            <div className="mt-6 space-y-3 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Gross Price:</span>
                <span className="font-mono text-slate-900 font-bold">₹{item.gross_modal_price_per_qtl}/Qtl</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Est. Haulage Distance:</span>
                <span className="font-mono text-slate-700">{item.estimated_distance_km} km</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Total Transport Cost:</span>
                <span className="font-mono text-red-600">-₹{item.total_transport_cost?.toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Mandi Cess (1%):</span>
                <span className="font-mono text-red-600">-₹{item.mandi_fee_amount?.toLocaleString()}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-800">Net Realization / Qtl:</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  ₹{item.net_realization_per_qtl?.toLocaleString()}
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              "{item.notes}"
            </p>
          </div>
        ))}
      </div>

      {/* Profitability Estimator Section */}
      {profitSummary && (
        <div className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Profitability Forecast</span>
              <h3 className="text-2xl font-bold text-slate-900">Estimated Crop Economics: {crop}</h3>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 px-5 py-2.5 rounded-2xl text-right">
              <span className="text-xs text-slate-500">Projected Net Profit:</span>
              <div className="text-2xl font-bold text-emerald-700 font-mono">
                ₹{profitSummary.net_projected_profit?.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-500">Total Yield:</span>
              <div className="text-lg font-bold text-slate-900 mt-1">{profitSummary.total_expected_yield_quintals} Quintals</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-500">Gross Revenue:</span>
              <div className="text-lg font-bold text-slate-900 mt-1">₹{profitSummary.gross_revenue?.toLocaleString()}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-500">Est. Total Input Cost:</span>
              <div className="text-lg font-bold text-red-600 mt-1">₹{profitSummary.estimated_total_cost?.toLocaleString()}</div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-slate-500">Projected ROI:</span>
              <div className="text-lg font-bold text-emerald-700 mt-1">{profitSummary.roi_percentage}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
