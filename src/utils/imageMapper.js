// Dynamic Image & Visual Theme Mapper based on Crop/Market Type
import heroBgImage from "../assets/images/market_hero_bg_1789634276014.jpg";

export const CROP_TYPES = {
  cereals: {
    name: "Cereals & Grains",
    bg: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=1920&auto=format&fit=crop",
    accent: "#a3e635",
    description: "Wheat, Paddy, Maize & Grain Market Futures",
    badge: "Grains & Cereals",
  },
  vegetables: {
    name: "Vegetables & Tubers",
    bg: "https://images.unsplash.com/photo-1595855759920-8658239e7280?q=80&w=1920&auto=format&fit=crop",
    accent: "#4ade80",
    description: "Potato, Onion, Tomato & Perishables Index",
    badge: "Vegetables",
  },
  oilseeds: {
    name: "Oilseeds & Pulses",
    bg: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1920&auto=format&fit=crop",
    accent: "#eab308",
    description: "Mustard, Groundnut, Gram & Oil Commodities",
    badge: "Oilseeds",
  },
  fruits: {
    name: "Horticulture & Fruits",
    bg: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=1920&auto=format&fit=crop",
    accent: "#f97316",
    description: "Mango, Banana, Apple & Fresh Produce",
    badge: "Fruits",
  },
  default: {
    name: "Global Market Intelligence",
    bg: heroBgImage,
    accent: "#bef264",
    description: "Bloomberg-grade analytics for Mandi & Agricultural Exchanges",
    badge: "Intelligence",
  }
};

export function getThemeForType(type = "default") {
  const key = type.toLowerCase();
  if (CROP_TYPES[key]) return CROP_TYPES[key];
  if (key.includes("wheat") || key.includes("maize") || key.includes("paddy") || key.includes("rice")) {
    return CROP_TYPES.cereals;
  }
  if (key.includes("potato") || key.includes("onion") || key.includes("tomato") || key.includes("veg")) {
    return CROP_TYPES.vegetables;
  }
  if (key.includes("mustard") || key.includes("oil") || key.includes("groundnut") || key.includes("gram")) {
    return CROP_TYPES.oilseeds;
  }
  if (key.includes("fruit") || key.includes("mango") || key.includes("apple") || key.includes("banana")) {
    return CROP_TYPES.fruits;
  }
  return CROP_TYPES.default;
}
