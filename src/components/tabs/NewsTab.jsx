import React, { useState, useEffect } from "react";
import { getBuyers } from "../../lib/api";
import { Newspaper, Building2, Phone, Star, CheckCircle, ShieldCheck } from "lucide-react";

export default function NewsTab() {
  const [buyers, setBuyers] = useState([]);
  const [cropFilter, setCropFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const newsItems = [
    {
      title: "Bihar Mandi Digitalization Drive Expands to Purnia and Nalanda",
      date: "September 16, 2026",
      source: "AgriMarket News",
      summary: "Direct electronic pricing boards and real-time arrival logging rolled out across 14 major district mandis.",
    },
    {
      title: "Maize Feed Mill Demand Surges in Northern Regional Hubs",
      date: "September 15, 2026",
      source: "Commodity Insights",
      summary: "Institutional buyers offering direct farmgate contracts with 2-day payment settlement.",
    },
    {
      title: "State Agricultural Marketing Board Releases Transport Subsidy Policy",
      date: "September 12, 2026",
      source: "Mandi Bureau",
      summary: "Freight rebate up to ₹40 per quintal for inter-district long-haul grain transport.",
    },
  ];

  const loadBuyers = async () => {
    setLoading(true);
    const data = await getBuyers(cropFilter);
    setBuyers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBuyers();
  }, [cropFilter]);

  return (
    <div className="space-y-8 text-slate-800">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-3">
          <Building2 className="w-8 h-8 text-emerald-600" />
          <span>Verified Institutional Buyers & Market News</span>
        </h2>
        <p className="text-slate-600 text-sm mt-2">
          Connect directly with verified processors, feed mills, and grain exporters across regional agricultural markets.
        </p>
      </div>

      {/* Verified Buyers List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Verified Institutional Buyers</span>
          </h3>
          <input
            type="text"
            placeholder="Search crop or buyer..."
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:border-slate-800"
          />
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 animate-pulse">Loading buyer directory...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {buyers.map((buyer) => (
              <div
                key={buyer.id}
                className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-[24px] p-5 transition-all shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        {buyer.buyer_type}
                      </span>
                      <h4 className="text-lg font-bold text-slate-900 mt-2">{buyer.name}</h4>
                      <p className="text-xs text-slate-500">{buyer.district} District</p>
                    </div>

                    <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{buyer.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Contact Person:</span>
                    <span className="font-semibold text-slate-900">{buyer.contact_person}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Offered Price:</span>
                    <span className="font-mono font-bold text-emerald-700">₹{buyer.buying_price_offered}/Qtl</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-600">
                    <span>Min Order:</span>
                    <span className="font-mono text-slate-800">{buyer.min_quantity_quintals} Quintals</span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <a
                      href={`tel:${buyer.phone}`}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-center flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Contact Buyer</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Market News Section */}
      <div className="bg-white border border-slate-200/90 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          <Newspaper className="w-5 h-5 text-emerald-600" />
          <span>Latest Agricultural Market News</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {newsItems.map((news, idx) => (
            <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                <span>{news.source}</span>
                <span>{news.date}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{news.title}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{news.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
