import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HeroPage() {
  const [, setLocation] = useLocation();

  const handleEnterDashboard = () => {
    setLocation("/dashboard");
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50">
      <div className="text-center flex flex-col items-center px-4">
        <h1 className="text-6xl md:text-8xl font-extrabold bg-gradient-to-r from-emerald-500 to-cyan-500 bg-clip-text text-transparent" data-testid="heading-hero">
          Nashik Digital Twin
        </h1>
        <p className="text-lg md:text-2xl text-slate-600 mt-4" data-testid="text-hero-subtitle">
          Real-Time City Monitoring & Analytics
        </p>
        <Button
          size="lg"
          onClick={handleEnterDashboard}
          className="mt-8 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:scale-105 transition-transform"
          data-testid="button-enter-dashboard"
        >
          Enter Digital Twin
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
