import React, { useState, useEffect } from "react";
import { getCurrentPrices, getMandis, getPriceHistory } from "../../lib/api";
import { Search, MapPin, RefreshCw, Layers, TrendingUp } from "lucide-react";
import { getTodayTheme } from "../../utils/dailyTheme";

export default function MarketTab({ dayOffset = 0 }) {
  const [prices, setPrices] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);

  const theme = getTodayTheme(dayOffset);

  const loadData = async () => {
    setLoading(true);
    const [pricesRes, mandisRes] = await Promise.all([
      getCurrentPrices(selectedCrop, selectedDistrict, selectedMarket),
      getMandis(),
    ]);
    setPrices(pricesRes || []);
    setMandis(mandisRes || []);
    setLoading(false);
  };

  const loadHistory = async (crop, market) => {
    const hist = await getPriceHistory(crop, market || "Gulabbagh");
    setHistoryData(hist);
  };

  useEffect(() => {
    loadData();
    loadHistory(selectedCrop || "Maize", selectedMarket || "Gulabbagh");
  }, [selectedCrop, selectedDistrict, selectedMarket]);

  return (
    <div className="space-y-8 text-slate-800">
      {/* Category Header Banner with Light Atmospheric Photography */}
      <div className="relative rounded-[28px] overflow-hidden border border-slate-200/80 bg-white shadow-xl p-6 sm:p-8">
        <div className="absolute inset-0 z-0 opacity-15">
          <img src={theme.image} alt={theme.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        </div>

        <div className="relative z-10 max-w-2xl">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${theme.badgeClass} mb-3`}>
            <Layers className="w-3 h-3" />
            {theme.name} Category
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            Live Commodity Market Rates
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Real-time daily modal prices and arrival volumes synced directly from Bihar Mandi trading floors.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-center justify-between shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Crop Search Filter */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search crop (e.g. Maize)..."
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white transition-all"
            />
          </div>

          {/* District Select */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
          >
            <option value="">All Districts</option>
            <option value="Purnia">Purnia</option>
            <option value="Patna">Patna</option>
            <option value="Muzaffarpur">Muzaffarpur</option>
            <option value="Nalanda">Nalanda</option>
            <option value="Gaya">Gaya</option>
          </select>

          {/* Market Select */}
          <select
            value={selectedMarket}
            onChange={(e) => setSelectedMarket(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
          >
            <option value="">All Mandis</option>
            {mandis.map((m, idx) => (
              <option key={idx} value={m.market}>
                {m.market} ({m.district})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-xs text-white px-4 py-2 rounded-xl transition-all font-medium ml-auto shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Grid of Price Tickers */}
      {loading ? (
        <div className="text-center py-16 text-slate-500 animate-pulse text-sm">
          Fetching current market rates from backend...
        </div>
      ) : prices.length === 0 ? (
        <div className="text-center py-16 bg-white/50 rounded-2xl border border-slate-200 text-slate-500">
          No current price records found for this criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {prices.map((item, idx) => (
            <div
              key={idx}
              onClick={() => loadHistory(item.commodity, item.market)}
              className="bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-slate-300 rounded-[22px] p-5 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md group"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/80 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    {item.commodity}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-2 group-hover:text-emerald-700 transition-colors">
                    {item.market}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.district}, Bihar</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900 font-mono">
                    ₹{item.modal_price.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">per Quintal</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <div>
                  Range: <span className="text-slate-900 font-mono font-medium">₹{item.min_price} - ₹{item.max_price}</span>
                </div>
                <div>
                  Arrivals: <span className="text-emerald-600 font-mono font-semibold">{item.arrival_quantity} Qtl</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historical Trend Statistics Panel */}
      {historyData && (
        <div className="bg-white border border-slate-200 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span>90-Day Price Trend: {historyData.commodity}</span>
                <span className="text-xs text-slate-500 font-normal">({historyData.market} Mandi)</span>
              </h3>
            </div>
            <div className="text-xs font-mono text-slate-600">
              Avg Modal: <span className="text-emerald-700 font-bold">₹{historyData.statistics?.avg_modal_price}</span> | Max: <span className="text-slate-900 font-bold">₹{historyData.statistics?.max_modal_price}</span>
            </div>
          </div>

          <div className="h-44 w-full flex items-end justify-between gap-2 pt-6 pb-2 border-b border-slate-100">
            {(historyData.history || []).map((pt, i) => {
              const maxP = historyData.statistics?.max_modal_price || 3000;
              const minP = historyData.statistics?.min_modal_price || 1500;
              const heightPct = Math.max(15, Math.min(100, ((pt.modal_price - minP + 100) / (maxP - minP + 200)) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                    ₹{pt.modal_price}
                  </div>
                  <div
                    className="w-full bg-emerald-500 group-hover:bg-emerald-600 rounded-t-md transition-all"
                    style={{ height: `${heightPct}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
