import React, { useState } from "react";
import { Search, AlertTriangle, HelpCircle, CheckCircle, ChevronRight } from "lucide-react";

export default function StockTable({ products, onSelectProduct, selectedSku }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("ALL"); // ALL, CRITICAL, REORDER, SAFE

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));

    if (activeFilter === "ALL") return matchesSearch;
    if (activeFilter === "CRITICAL") return matchesSearch && p.reorder_status === "Critical";
    if (activeFilter === "REORDER") return matchesSearch && p.reorder_status === "Reorder Soon";
    if (activeFilter === "SAFE") return matchesSearch && p.reorder_status === "Safe";
    return matchesSearch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Critical":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Critical
          </span>
        );
      case "Reorder Soon":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Reorder Soon
          </span>
        );
      case "Safe":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Safe
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-100">
            Unknown
          </span>
        );
    }
  };

  return (
    <div className="glass-panel bg-white rounded-2xl border border-slate-200 flex flex-col h-full overflow-hidden shadow-sm">
      {/* Header section with Search and Filters */}
      <div className="p-6 border-b border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            Inventory & Reorder Log
          </h2>
          
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-emerald-500 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 shadow-sm"
            />
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 pt-2">
          {["ALL", "CRITICAL", "REORDER", "SAFE"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeFilter === filter
                  ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              {filter === "ALL" && "All SKUs"}
              {filter === "CRITICAL" && "🔴 Critical"}
              {filter === "REORDER" && "🟡 Reorder"}
              {filter === "SAFE" && "🟢 Safe"}
            </button>
          ))}
        </div>
      </div>

      {/* Table section */}
      <div className="flex-1 overflow-y-auto max-h-[480px]">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-white">
            No products found matching the criteria.
          </div>
        ) : (
          <table className="w-full border-collapse text-left bg-white">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold text-slate-500 bg-slate-50/50">
                <th className="py-4.5 px-6">Product Details</th>
                <th className="py-4.5 px-6">Category</th>
                <th className="py-4.5 px-6">Current Stock</th>
                <th className="py-4.5 px-6">Unit Price</th>
                <th className="py-4.5 px-6">Status</th>
                <th className="py-4.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isSelected = selectedSku === p.sku;
                return (
                  <tr
                    key={p.sku}
                    onClick={() => onSelectProduct(p)}
                    className={`group hover:bg-slate-50/50 transition-colors cursor-pointer text-sm ${
                      isSelected ? "bg-emerald-50/30 border-l-2 border-l-emerald-600" : ""
                    }`}
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {p.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{p.sku}</div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{p.category || "General"}</td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-800">
                        {p.current_stock}
                      </span>{" "}
                      <span className="text-xs text-slate-500">{p.unit}</span>
                    </td>
                    <td className="py-4 px-6 text-slate-600">₹{p.price.toFixed(2)}</td>
                    <td className="py-4 px-6">{getStatusBadge(p.reorder_status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                            : "bg-white border-slate-200 text-slate-500 group-hover:text-slate-700 group-hover:border-slate-300"
                        }`}
                      >
                        Forecast
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
