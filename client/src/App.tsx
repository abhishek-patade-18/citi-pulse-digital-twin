import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import HeroPage from "@/pages/hero";
import DashboardPage from "@/pages/dashboard";
import MapPage from "@/pages/map";
import AlertsPage from "@/pages/alerts";
import AnalyticsPage from "@/pages/analytics";
import SensorsPage from "@/pages/sensors";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen text-slate-800 font-sans bg-gradient-to-br from-slate-50 via-emerald-50 to-cyan-50">
      <Navbar />
      <main className="p-6 md:p-8">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HeroPage} />
      <Route path="/dashboard">
        <AppLayout>
          <DashboardPage />
        </AppLayout>
      </Route>
      <Route path="/map">
        <AppLayout>
          <MapPage />
        </AppLayout>
      </Route>
      <Route path="/alerts">
        <AppLayout>
          <AlertsPage />
        </AppLayout>
      </Route>
      <Route path="/analytics">
        <AppLayout>
          <AnalyticsPage />
        </AppLayout>
      </Route>
      <Route path="/sensors">
        <AppLayout>
          <SensorsPage />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
