import { useLocation } from "react-router-dom";
import { useEffect } from "react";

import { DotFooter } from "@/components/DotFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="32" height="32" fill="none">
              <rect width="40" height="40" rx="8" fill="#F0FDF4" />
              <rect x="5" y="5" width="13.5" height="13.5" rx="2.5" fill="#15803D" />
              <rect x="21.5" y="5" width="13.5" height="13.5" rx="2.5" fill="#0284C7" />
              <rect x="5" y="21.5" width="13.5" height="13.5" rx="2.5" fill="#38BDF8" />
              <rect x="21.5" y="21.5" width="13.5" height="13.5" rx="2.5" fill="#16A34A" />
              <path d="M20 16 L24 20 L20 24 L16 20 Z" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.2" />
            </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-2">404</h1>
          <p className="text-lg text-muted-foreground mb-6">The requested page does not exist in Shennong.</p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs"
          >
            Return to Shennong
          </a>
        </div>
      </div>
      <DotFooter />
    </div>
  );
};

export default NotFound;
