import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Live Map", path: "/map" },
  { name: "Alerts", path: "/alerts" },
  { name: "Analytics", path: "/analytics" },
  { name: "Sensors", path: "/sensors" },
];

export default function Navbar() {
  const [location] = useLocation();

  return (
    <nav className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="hover-elevate active-elevate-2" data-testid="link-home">
            <h2 className="text-2xl font-bold" data-testid="text-app-title">
              Nashik City Digital Twin
            </h2>
          </Link>
          
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
              >
                <button
                  className={cn(
                    "px-4 py-2 rounded-lg font-semibold transition-all hover-elevate active-elevate-2",
                    location === item.path
                      ? "bg-white/30 shadow-md"
                      : "bg-white/10 hover:bg-white/20"
                  )}
                  data-testid={`button-nav-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {item.name}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
