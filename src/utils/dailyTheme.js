// Light & Atmospheric Daily Agriculture Themes (Inspired by Fundora Design)
// Beautiful, bright, misty agricultural landscapes with high legibility

const DAILY_THEMES = [
  {
    id: "tea-terrace",
    name: "Misty Tea Terraces",
    subtitle: "Highland & Plantation Analytics",
    image: "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=2000&auto=format&fit=crop",
    accentBg: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    gradientOverlay: "from-white/90 via-emerald-50/40 to-white/95",
  },
  {
    id: "golden-wheat",
    name: "Sunrise Wheat Fields",
    subtitle: "Cereal & Grain Commodity Index",
    image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=2000&auto=format&fit=crop",
    accentBg: "bg-amber-500",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    gradientOverlay: "from-white/90 via-amber-50/40 to-white/95",
  },
  {
    id: "green-valleys",
    name: "Lush Green Valleys",
    subtitle: "Sustainable Maize & Paddy",
    image: "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?q=80&w=2000&auto=format&fit=crop",
    accentBg: "bg-green-500",
    badgeClass: "bg-green-100 text-green-800 border border-green-200",
    gradientOverlay: "from-white/90 via-green-50/40 to-white/95",
  },
  {
    id: "misty-paddy",
    name: "Morning Paddy Fields",
    subtitle: "Direct Mandi Trading Floor",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=2000&auto=format&fit=crop",
    accentBg: "bg-teal-500",
    badgeClass: "bg-teal-100 text-teal-800 border border-teal-200",
    gradientOverlay: "from-white/90 via-teal-50/40 to-white/95",
  }
];

export function getTodayTheme(overrideOffset = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  
  const index = Math.abs(dayOfYear + overrideOffset) % DAILY_THEMES.length;
  const theme = DAILY_THEMES[index];

  return {
    ...theme,
    dayOfYear,
    dateFormatted: now.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }),
  };
}

export { DAILY_THEMES };
