import React, { useState, useEffect } from "react";
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { LineChart, Calendar, Award } from "lucide-react";
import axios from "axios";

export default function ForecastChart({ selectedProduct }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedProduct) return;
    
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await axios.get(`${API_BASE_URL}/api/forecast/${selectedProduct.sku}`);
        setChartData(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch forecast details for this product.");
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [selectedProduct]);

  if (!selectedProduct) {
    return (
      <div className="glass-panel rounded-2xl border border-slate-200 p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full min-h-[350px]">
        <LineChart className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
        <p className="text-base font-medium">Select a SKU from the table to load its forecasting model</p>
        <p className="text-xs text-slate-500 mt-1">Displays 21 days of history and 7 days of demand forecasting</p>
      </div>
    );
  }

  const accuracy = chartData ? Math.max(0, 100 - chartData.mape) : 100;

  // Custom tooltips to show actual vs forecasted values clearly
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const formattedDate = new Date(label).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
      });
      
      const actual = payload.find(p => p.dataKey === "actual_quantity")?.value;
      const forecast = payload.find(p => p.dataKey === "forecasted_quantity")?.value;
      const lower = payload.find(p => p.dataKey === "bounds")?.payload.lower_bound;
      const upper = payload.find(p => p.dataKey === "bounds")?.payload.upper_bound;

      return (
        <div className="p-4 rounded-xl border border-slate-200 bg-white/95 backdrop-blur shadow-xl text-xs space-y-1.5">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {formattedDate}
          </p>
          {actual !== undefined && actual !== null && (
            <p className="text-emerald-600 font-medium">
              Actual Sales: <strong className="text-slate-800">{actual.toFixed(1)} {selectedProduct.unit}</strong>
            </p>
          )}
          {forecast !== undefined && forecast !== null && forecast > 0 && (
            <>
              <p className="text-purple-600 font-medium">
                Forecasted Sales: <strong className="text-slate-800">{forecast.toFixed(1)} {selectedProduct.unit}</strong>
              </p>
              {lower !== undefined && upper !== undefined && (
                <p className="text-slate-500 font-medium">
                  Confidence Range: {lower.toFixed(1)} - {upper.toFixed(1)}
                </p>
              )}
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-200 p-6 flex flex-col h-full min-h-[350px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demand Forecasting Chart</span>
          <h2 className="text-lg font-bold text-slate-850 mt-1">{selectedProduct.name}</h2>
          <span className="text-xs text-slate-500 font-mono mt-0.5 block">SKU: {selectedProduct.sku}</span>
        </div>
        
        {chartData && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-semibold">
            <Award className="h-4 w-4" />
            <span>Accuracy: {accuracy.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">
          <span className="animate-pulse">Loading forecasting models...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center text-rose-400 text-sm">
          {error}
        </div>
      ) : chartData ? (
        <div className="flex-1 w-full h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={chartData.data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
              
              <XAxis
                dataKey="date"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                tickFormatter={(tick) => {
                  const d = new Date(tick);
                  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                }}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: "11px", color: "#475569" }}
              />

              {/* Confidence Interval Shading */}
              <Area
                name="Confidence Interval"
                dataKey="bounds"
                stroke="none"
                fill="#a855f7"
                fillOpacity={0.06}
                // We define custom bounds data accessor
                data={chartData.data.map(item => ({
                  ...item,
                  bounds: item.forecasted_quantity > 0 ? [item.lower_bound, item.upper_bound] : null
                }))}
              />

              {/* Actual Sales Line */}
              <Line
                name="Actual Daily Sales"
                type="monotone"
                dataKey="actual_quantity"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 2, stroke: "#10b981", strokeWidth: 1 }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />

              {/* Forecasted Line */}
              <Line
                name="7-Day Demand Forecast"
                type="monotone"
                dataKey="forecasted_quantity"
                stroke="#a855f7"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 3, stroke: "#a855f7", strokeWidth: 1, fill: "#ffffff" }}
                activeDot={{ r: 6 }}
                connectNulls={true}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : null}
    </div>
  );
}
