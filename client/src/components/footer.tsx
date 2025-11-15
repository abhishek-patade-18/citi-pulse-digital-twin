import { Database, Code, Activity, MapPin } from "lucide-react";

function TechBadge({ icon: Icon, name }: { icon: any; name: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg">
      <Icon size={16} className="text-slate-500" />
      <span className="text-xs font-medium text-slate-600">{name}</span>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="flex justify-between items-center p-6 border-t border-emerald-100 mt-12" data-testid="footer">
      <div className="flex items-center gap-4">
        <p className="text-sm font-semibold text-slate-700">Built with:</p>
        <div className="flex items-center gap-2">
          <TechBadge icon={Code} name="React" />
          <TechBadge icon={Database} name="TypeScript" />
          <TechBadge icon={Activity} name="Chart.js" />
          <TechBadge icon={MapPin} name="Mapbox" />
        </div>
      </div>
      <p className="text-sm text-slate-500" data-testid="text-copyright">
        Nashik City Digital Twin © 2025 - A Smart City Monitoring Platform
      </p>
    </footer>
  );
}
