import React from "react";
import { Package, TrendingUp, AlertTriangle, RefreshCw } from "lucide-react";

export default function MetricCards({ summary }) {
  const {
    total_skus = 0,
    critical_count = 0,
    reorder_soon_count = 0,
    avg_mape = 0
  } = summary || {};

  const accuracy = Math.max(0, 100 - avg_mape);

  const metrics = [
    {
      title: "Processed SKUs",
      value: total_skus,
      subtitle: "Active catalog items",
      icon: Package,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      textColor: "text-slate-800"
    },
    {
      title: "Forecast Accuracy",
      value: `${accuracy.toFixed(1)}%`,
      subtitle: `MAPE: ${avg_mape.toFixed(1)}% (Target < 15%)`,
      icon: TrendingUp,
      color: accuracy >= 85 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-amber-600 bg-amber-50 border-amber-100",
      textColor: "text-slate-800"
    },
    {
      title: "Critical Risks",
      value: critical_count,
      subtitle: "Stock out within 3 days",
      icon: AlertTriangle,
      color: critical_count > 0 ? "text-rose-600 bg-rose-50 border-rose-100 animate-pulse" : "text-slate-500 bg-slate-50 border-slate-100",
      textColor: critical_count > 0 ? "text-rose-700 font-semibold" : "text-slate-850"
    },
    {
      title: "Reorder Soon",
      value: reorder_soon_count,
      subtitle: "Stock out within 7 days",
      icon: RefreshCw,
      color: reorder_soon_count > 0 ? "text-amber-600 bg-amber-50 border-amber-100" : "text-slate-500 bg-slate-50 border-slate-100",
      textColor: "text-slate-800"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {metrics.map((m, i) => {
        const Icon = m.icon;
        return (
          <div
            key={i}
            className="glass-panel bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between glass-card-hover shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">{m.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-2">{m.value}</h3>
              </div>
              <div className={`p-3 rounded-xl border ${m.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4 border-t border-slate-100 pt-3">
              {m.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
