import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Layers,
  MapPin,
  Package,
  Phone,
  Store,
  TrendingUp,
  Truck,
  Users,
  XCircle
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { farmHubApi, formatINR, type Inquiry, type MandiRecord, type UserResponse } from "@/lib/api";
import { ShennongNavbar } from "@/components/ShennongNavbar";
import { DotFooter } from "@/components/DotFooter";

const BIHAR_DISTRICTS = [
  "Purnia",
  "Katihar",
  "Araria",
  "Kishanganj",
  "Saharsa",
  "Madhepura",
  "Supaul",
  "Begusarai",
  "Khagaria",
  "Bhagalpur",
  "Patna",
  "Muzaffarpur",
  "Samastipur",
  "Vaishali",
  "Rohtas"
];

const CROPS = ["Maize", "Wheat", "Paddy", "Potato", "Onion", "Tomato", "Mustard", "Gram"];

export default function DistributorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [targetTruckloadQtl, setTargetTruckloadQtl] = useState<number>(250); // standard 25-ton 10-wheeler

  // Sourcing filter
  const [selectedCrop, setSelectedCrop] = useState<string>("Maize");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("Purnia");
  const [districtPrices, setDistrictPrices] = useState<MandiRecord[]>([]);
  const [priceLoading, setPriceLoading] = useState(false);

  const loadData = useCallback(async () => {
    setError("");
    try {
      const user = await farmHubApi.getMe();
      if (user.role !== "DISTRIBUTOR") {
        if (user.role === "BUYER") {
          navigate("/buyer-dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
        return;
      }
      setProfile(user);

      // Set initial district from user profile if available
      const userDistrict = user.buyer_profile?.district || "Purnia";
      setSelectedDistrict(userDistrict);

      const inbox = await farmHubApi.getInquiries();
      setInquiries(inbox);
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status === 401) {
        localStorage.removeItem("farmhub_token");
        navigate("/", { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : "Unable to load distributor dashboard.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Load benchmark mandi prices for selected district and crop
  useEffect(() => {
    let active = true;
    async function fetchPrices() {
      setPriceLoading(true);
      try {
        const prices = await farmHubApi.getCurrentPrices({
          crop: selectedCrop,
          district: selectedDistrict,
        });
        if (active) setDistrictPrices(prices);
      } catch {
        if (active) setDistrictPrices([]);
      } finally {
        if (active) setPriceLoading(false);
      }
    }
    void fetchPrices();
    return () => {
      active = false;
    };
  }, [selectedCrop, selectedDistrict]);

  const updateStatus = async (inquiry: Inquiry, newStatus: string) => {
    try {
      const updated = await farmHubApi.updateInquiryStatus(inquiry.id, { status: newStatus });
      setInquiries((items) => items.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update inquiry status.");
    }
  };

  const business = profile?.buyer_profile;
  const operatingRegions = business?.operating_regions || [business?.district || "Purnia"];

  // Filtered inquiries
  const filteredInquiries = useMemo(() => {
    if (statusFilter === "ALL") return inquiries;
    return inquiries.filter((inq) => inq.status === statusFilter);
  }, [inquiries, statusFilter]);

  // Aggregation calculations from accepted lots
  const acceptedLots = useMemo(() => inquiries.filter((item) => item.status === "ACCEPTED"), [inquiries]);
  const totalAcceptedQtl = useMemo(
    () => acceptedLots.reduce((acc, lot) => acc + (lot.quantity_quintals || 0), 0),
    [acceptedLots]
  );
  const weightedPriceNumerator = useMemo(
    () => acceptedLots.reduce((acc, lot) => acc + (lot.quantity_quintals || 0) * (lot.target_price_inr || 0), 0),
    [acceptedLots]
  );
  const avgProcurementPrice = totalAcceptedQtl > 0 && weightedPriceNumerator > 0 ? weightedPriceNumerator / totalAcceptedQtl : null;

  const dispatchProgressPct = Math.min(100, Math.round((totalAcceptedQtl / targetTruckloadQtl) * 100));

  // Benchmark stats
  const latestBenchmark = districtPrices[0];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading Distributor Operations Desk…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <ShennongNavbar
        userRole="DISTRIBUTOR"
        userName={business?.business_name || profile?.full_name}
        userDistrict={business?.district}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                Regional Distributor & Aggregator
              </span>
              <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-800 bg-emerald-50">
                {profile?.verification_status.replace(/_/g, " ")}
              </Badge>
              <Badge variant="outline" className="text-xs border-slate-300 text-slate-700 bg-slate-50">
                Hub: {business?.district || "Bihar"}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {business?.business_name || profile?.full_name}
            </h1>
            <p className="text-slate-600 text-sm mt-1">
              Multi-district agricultural procurement, aggregation logistics & farmer batch pooling in Bihar.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-3">
              <span className="text-xs text-slate-500 font-medium mr-1">Operating Territories:</span>
              {operatingRegions.map((region) => (
                <span
                  key={region}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  <MapPin className="w-3 h-3 mr-1 text-sky-600" />
                  {region}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/price-intelligence")}
              className="border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <TrendingUp className="mr-1.5 h-4 w-4 text-emerald-600" /> Mandi Prices
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/market-comparison")}
              className="border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <Truck className="mr-1.5 h-4 w-4 text-sky-600" /> Transport Arbitrage
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/buyer-discovery")}
              className="border-slate-300 hover:bg-slate-50 text-slate-700"
            >
              <Users className="mr-1.5 h-4 w-4 text-indigo-600" /> Partner Network
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Action Notice</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Operational KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
                <span>Incoming Lots</span>
                <Clock3 className="h-4 w-4 text-amber-500" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900">
                {inquiries.filter((item) => item.status === "PENDING").length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Farmer supply lots awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
                <span>Committed Volume</span>
                <Package className="h-4 w-4 text-emerald-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900">
                {totalAcceptedQtl.toLocaleString("en-IN")}{" "}
                <span className="text-sm font-medium text-slate-500">qtl</span>
              </div>
              <p className="text-xs text-emerald-700 font-medium mt-1">
                {acceptedLots.length} accepted farmer batches
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
                <span>Regional Reach</span>
                <Layers className="h-4 w-4 text-sky-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900">
                {operatingRegions.length}{" "}
                <span className="text-sm font-medium text-slate-500">districts</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">Active aggregation territory</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-xs bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500 font-semibold flex items-center justify-between">
                <span>Procurement Baseline</span>
                <Store className="h-4 w-4 text-indigo-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-slate-900">
                {latestBenchmark ? formatINR(latestBenchmark.modal_price) : "₹2,150"}
                <span className="text-xs font-normal text-slate-500"> / qtl</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 truncate">
                {latestBenchmark ? `${latestBenchmark.market} (${selectedCrop})` : "Standard Bihar benchmark"}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Aggregation & Truckload Pooling Planner */}
        <Card className="border-sky-200 bg-linear-to-br from-sky-50/50 via-white to-emerald-50/30 shadow-xs">
          <CardHeader className="pb-3 border-b border-sky-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-sky-700" />
                  Regional Dispatch & Batch Pooling Planner
                </CardTitle>
                <p className="text-xs text-slate-600 mt-0.5">
                  Aggregate fragmented smallholder harvest lots into standard commercial transit batches.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-slate-600">Truckload:</span>
                {[160, 250, 400].map((capacity) => (
                  <button
                    key={capacity}
                    type="button"
                    onClick={() => setTargetTruckloadQtl(capacity)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      targetTruckloadQtl === capacity
                        ? "bg-sky-600 text-white shadow-xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {capacity} qtl ({Math.round(capacity / 10)}T)
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
                <span>
                  Aggregation Progress: {totalAcceptedQtl.toLocaleString("en-IN")} / {targetTruckloadQtl} qtl
                </span>
                <span className={dispatchProgressPct >= 100 ? "text-emerald-700" : "text-sky-700"}>
                  {dispatchProgressPct}% Ready
                </span>
              </div>
              <Progress value={dispatchProgressPct} className="h-2.5 bg-slate-200" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Avg Procurement Cost:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {avgProcurementPrice ? `${formatINR(avgProcurementPrice)} / qtl` : "Awaiting accepted lots"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Estimated Regional Freight:</span>
                <span className="font-bold text-slate-900 text-sm">
                  ₹3.50 / km / qtl (~₹350-₹450 / qtl)
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Readiness Status:</span>
                <span className="font-bold text-sm">
                  {totalAcceptedQtl >= targetTruckloadQtl ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Full Truckload Ready for Dispatch
                    </span>
                  ) : (
                    <span className="text-amber-700">
                      Need {(targetTruckloadQtl - totalAcceptedQtl).toLocaleString("en-IN")} qtl more for full truck
                    </span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Multi-District Procurement Benchmark & Sourcing Bar */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Regional Mandi Sourcing & Price Benchmarks
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monitor live wholesale prices and spot price spreads across your Bihar procurement districts.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCrop}
                  onChange={(e) => setSelectedCrop(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500"
                >
                  {CROPS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500"
                >
                  {BIHAR_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} District
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {priceLoading ? (
              <div className="text-xs text-slate-500 py-4 text-center">Loading live market prices…</div>
            ) : districtPrices.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">
                No active mandi quotes recorded for {selectedCrop} in {selectedDistrict} today.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-2.5 px-3">Mandi / Market</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Commodity</th>
                      <th className="py-2.5 px-3">Modal Price</th>
                      <th className="py-2.5 px-3">Min - Max Range</th>
                      <th className="py-2.5 px-3">Arrivals</th>
                      <th className="py-2.5 px-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {districtPrices.slice(0, 5).map((price) => (
                      <tr key={price.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-semibold text-slate-900">{price.market}</td>
                        <td className="py-2 px-3 text-slate-600">{price.district}</td>
                        <td className="py-2 px-3 text-slate-600">{price.commodity}</td>
                        <td className="py-2 px-3 font-bold text-emerald-700">{formatINR(price.modal_price)} / qtl</td>
                        <td className="py-2 px-3 text-slate-500">
                          {formatINR(price.min_price)} - {formatINR(price.max_price)}
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {price.arrivals_volume ? `${price.arrivals_volume} tonnes` : "Standard"}
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(price.record_date).toLocaleDateString("en-IN")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Farmer Sourcing & Inquiry Management */}
        <Card className="border-slate-200 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Farmer Procurement Lots & Inquiries
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct supply offers received from local Bihar farmers for your operating region.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-lg">
                {[
                  { id: "ALL", label: `All (${inquiries.length})` },
                  {
                    id: "PENDING",
                    label: `Pending (${inquiries.filter((i) => i.status === "PENDING").length})`,
                  },
                  {
                    id: "ACCEPTED",
                    label: `Accepted (${inquiries.filter((i) => i.status === "ACCEPTED").length})`,
                  },
                  {
                    id: "CONTACTED",
                    label: `Contacted (${inquiries.filter((i) => i.status === "CONTACTED").length})`,
                  },
                  {
                    id: "DECLINED",
                    label: `Declined (${inquiries.filter((i) => i.status === "DECLINED").length})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                      statusFilter === tab.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4 space-y-3">
            {filteredInquiries.length === 0 ? (
              <div className="text-center py-8 text-slate-500 space-y-2">
                <p className="text-sm font-medium">No procurement lots found for this filter.</p>
                <p className="text-xs text-slate-400">
                  Farmer supply lots submitted through the Shennong network will appear here in real time.
                </p>
              </div>
            ) : (
              filteredInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 hover:border-slate-300 transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900">{inquiry.crop}</span>
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold"
                        >
                          {inquiry.quantity_quintals.toLocaleString("en-IN")} Quintals
                        </Badge>
                        <Badge
                          variant={
                            inquiry.status === "ACCEPTED"
                              ? "default"
                              : inquiry.status === "DECLINED"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {inquiry.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Farmer: <span className="font-semibold text-slate-700">{inquiry.farmer_name}</span> · Expected
                        Harvest: {new Date(inquiry.expected_harvest_date).toLocaleDateString("en-IN")}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2 sm:mt-0">
                      {inquiry.farmer_phone && (
                        <a
                          href={`tel:${inquiry.farmer_phone}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700"
                        >
                          <Phone className="w-3 h-3 text-sky-600" />
                          {inquiry.farmer_phone}
                        </a>
                      )}
                      {inquiry.status !== "ACCEPTED" && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => void updateStatus(inquiry, "ACCEPTED")}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs h-7 px-2.5"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Accept Lot
                        </Button>
                      )}
                      {inquiry.status !== "CONTACTED" && inquiry.status !== "ACCEPTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void updateStatus(inquiry, "CONTACTED")}
                          className="border-sky-300 text-sky-800 hover:bg-sky-50 text-xs h-7 px-2.5"
                        >
                          Mark Contacted
                        </Button>
                      )}
                      {inquiry.status !== "DECLINED" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void updateStatus(inquiry, "DECLINED")}
                          className="text-slate-500 hover:text-red-700 hover:bg-red-50 text-xs h-7 px-2"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> Decline
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-500 block">Target Price:</span>
                      <span className="font-semibold text-slate-800">
                        {inquiry.target_price_inr ? `${formatINR(inquiry.target_price_inr)} / qtl` : "Mandi modal rate"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Submitted On:</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(inquiry.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Farmer Notes:</span>
                      <span className="font-normal text-slate-600 truncate block">
                        {inquiry.notes || "No special conditions specified"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      <DotFooter />
    </div>
  );
}
