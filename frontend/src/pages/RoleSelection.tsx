import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Calculator, Leaf, Menu, Sprout, Store, Truck, X } from "lucide-react";
import DotFooter from "@/components/DotFooter";
import ShennongLogo from "@/components/ShennongLogo";

export default function RoleSelection() {
  const [role, setRole] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => {
    if (!role) return;
    const roleMap: Record<string, string> = {
      farmer: "/onboarding/farmer",
      distributor: "/onboarding/distributor",
      buyer: "/onboarding/buyer",
    };
    navigate(roleMap[role]);
  };

  const roles = [
    { id: "farmer", title: "Farmer", subtitle: "किसान", description: "Track market prices, understand crop economics, and plan your harvest with confidence.", icon: <Sprout className="h-5 w-5" /> },
    { id: "distributor", title: "Distributor", subtitle: "वितरक / व्यापारी", description: "Coordinate aggregation, discover supply, and manage regional agricultural logistics.", icon: <Truck className="h-5 w-5" /> },
    { id: "buyer", title: "Commercial Buyer", subtitle: "खरीदार / प्रोसेसर", description: "Discover agricultural supply, review harvest inquiries, and connect with producers.", icon: <Store className="h-5 w-5" /> },
  ];

  return (
    <div className="shennong-landing min-h-screen overflow-x-hidden">
      <header className="shennong-landing-nav">
        <div className="shennong-container flex h-20 items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-3 text-left">
            <ShennongLogo size="md" />
            <div className="hidden sm:block">
              <div className="shennong-wordmark">Shennong</div>
              <div className="shennong-tagline">Markets. Insights. Better Decisions.</div>
            </div>
          </button>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-stone-700">
            <a className="shennong-nav-link is-active" href="#home">Home</a>
            <a className="shennong-nav-link" href="#markets">Markets</a>
            <a className="shennong-nav-link" href="#prediction">Prediction</a>
            <a className="shennong-nav-link" href="#crops">Crops</a>
            <a className="shennong-nav-link" href="#tools">Tools</a>
            <a className="shennong-nav-link" href="#resources">Resources</a>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <button className="shennong-icon-button" aria-label="Search"><span>⌕</span></button>
            <Button variant="outline" className="rounded-full border-stone-300 bg-white/60 px-5" onClick={() => navigate("/onboarding/farmer")}>Sign in</Button>
            <Button className="shennong-dark-button rounded-full px-6" onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}>Get Started <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>

          <button className="shennong-mobile-menu lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Open navigation">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {menuOpen && (
          <div className="shennong-mobile-nav lg:hidden">
            {["Markets", "Prediction", "Crops", "Tools", "Resources"].map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>)}
            <button onClick={() => { setMenuOpen(false); document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" }); }}>Get Started <ArrowRight className="h-4 w-4" /></button>
          </div>
        )}
      </header>

      <main id="home">
        <section className="shennong-hero shennong-container">
          <div className="shennong-hero-copy">
            <div className="shennong-eyebrow"><Leaf className="h-3.5 w-3.5" /> Agricultural market intelligence</div>
            <h1>Know your market. <em>Plan your crop. Sell with confidence.</em></h1>
            <p>Market prices, crop economics, forecasts, and practical tools built around real agricultural decisions.</p>
            <div className="flex flex-wrap gap-3">
              <Button className="shennong-dark-button rounded-full px-7 h-12" onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}>Explore Markets <ArrowRight className="ml-2 h-4 w-4" /></Button>
              <button className="shennong-outline-action" onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}><span className="shennong-play">▶</span> See how it works</button>
            </div>
          </div>

          <div className="shennong-hero-scene" aria-hidden="true">
            <div className="shennong-scene-glow" />
            <img className="shennong-real-hero-image" src="https://images.unsplash.com/photo-1643171916755-02c26a606f70?auto=format&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800" alt="Agricultural fields and mountains" loading="eager" fetchPriority="high" />
            <div className="shennong-scene-note"><span>From</span><strong>Fields to<br />Better Futures</strong><small>Reliable data and insights for better decisions.</small></div>
            <div className="shennong-signpost"><span>Markets <b>→</b></span><span>Insights <b>→</b></span><span>Decisions <b>→</b></span></div>
          </div>

          <div className="shennong-feature-grid" id="features">
            {[
              ["Market Prices", "Live and historical market prices across regions", <Leaf />],
              ["Price Prediction", "Data-driven forecasts for smarter selling", <BarChart3 />],
              ["Crop Economics", "Estimate costs, profits and break-even prices", <Calculator />],
              ["Resources", "Guides, tools and market insights for better decisions", <Sprout />],
            ].map(([title, description, icon]) => (
              <button key={String(title)} className="shennong-feature-card" onClick={() => document.getElementById("roles")?.scrollIntoView({ behavior: "smooth" })}>
                <span className="shennong-feature-icon">{icon}</span>
                <span className="text-left"><strong>{title}</strong><small>{description}</small></span>
                <ArrowRight className="ml-auto h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="shennong-stat-strip">
            <div><Sprout /><strong>100+</strong><span>Crops tracked</span></div>
            <div><Store /><strong>500+</strong><span>Markets covered</span></div>
            <div><BarChart3 /><strong>Live</strong><span>Market updates</span></div>
            <div><Truck /><strong>For everyone</strong><span>Farmers · Traders · Businesses</span></div>
          </div>
        </section>

        <section id="roles" className="shennong-roles-section">
          <div className="shennong-container">
            <div className="shennong-section-heading">
              <div><span className="shennong-kicker">One platform</span><h2>Built for the people who move agriculture forward.</h2></div>
              <p>Choose your role to enter the tools and workflows that matter to you. Shennong starts locally and is designed to scale across agricultural markets.</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {roles.map((r) => {
                const selected = role === r.id;
                return <button key={r.id} type="button" onClick={() => setRole(r.id)} aria-pressed={selected} className={`shennong-role-card ${selected ? "is-selected" : ""}`}>
                  <span className="shennong-role-icon">{r.icon}</span>
                  <span className="flex items-center gap-2"><strong>{r.title}</strong><small>{r.subtitle}</small></span>
                  <p>{r.description}</p>
                  <span className="shennong-role-arrow"><ArrowRight className="h-4 w-4" /></span>
                </button>;
              })}
            </div>
            <div className="flex flex-col items-center gap-3 py-10">
              <Button onClick={handleNext} disabled={!role} className="shennong-dark-button rounded-full px-9 h-12">Continue as {role ? roles.find((r) => r.id === role)?.title : "..."}<ArrowRight className="ml-2 h-4 w-4" /></Button>
              <p className="text-xs text-stone-500">Your current workflows, dashboards, forecasts, economics and market tools remain unchanged.</p>
            </div>
          </div>
        </section>
      </main>
      <DotFooter />
    </div>
  );
}