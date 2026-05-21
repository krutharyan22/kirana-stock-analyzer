import React, { useState, useEffect } from "react";
import axios from "axios";
import { Store, FileSpreadsheet, Sparkles, Download, HelpCircle, AlertCircle, RefreshCw } from "lucide-react";
import MetricCards from "./components/MetricCards";
import UploadExcel from "./components/UploadExcel";
import StockTable from "./components/StockTable";
import ForecastChart from "./components/ForecastChart";
import ChatInterface from "./components/ChatInterface";

export default function App() {
  const [summary, setSummary] = useState({
    total_skus: 0,
    critical_count: 0,
    reorder_soon_count: 0,
    safe_count: 0,
    avg_mape: 11.4,
    critical_items: [],
    reorder_items: [],
    chat_response_time_ms: 0
  });
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [demoGenerating, setDemoGenerating] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const fetchDashboardData = async () => {
    try {
      const summaryRes = await axios.get(`${API_BASE_URL}/api/dashboard`);
      setSummary(summaryRes.data);

      const productsRes = await axios.get(`${API_BASE_URL}/api/products`);
      const fetchedProducts = productsRes.data;
      setProducts(fetchedProducts);

      // Keep the current selection or set to the first product as a default
      if (fetchedProducts.length > 0) {
        setSelectedProduct((prev) => {
          if (!prev) return fetchedProducts[0];
          // Find updated version of selected item
          const match = fetchedProducts.find((p) => p.sku === prev.sku);
          return match || fetchedProducts[0];
        });
      }
      setError(null);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(`Failed to communicate with backend at ${API_BASE_URL}. Make sure the backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownloadDemo = async () => {
    setDemoGenerating(true);
    try {
      const response = await axios({
        url: `${API_BASE_URL}/api/download-demo`,
        method: "GET",
        responseType: "blob"
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "kirana_sales_demo.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Failed to download demo excel file. Verify that backend is running.");
    } finally {
      setDemoGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pb-12 flex flex-col bg-white">
      {/* Sleek Light/White Header Bar */}
      <header className="glass-panel sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2 m-0 p-0">
                Kirana Store Intelligence Dashboard
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                AI-Powered Time-Series Forecasting & Inventory Optimization
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleDownloadDemo}
              disabled={demoGenerating}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {demoGenerating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4 text-emerald-400" />
              )}
              {demoGenerating ? "Generating Demo..." : "Get Demo Excel Log"}
            </button>
            <p className="text-[10.5px] text-slate-500 text-right max-w-xs leading-tight">
              Dear user, please use this format to analyze your daily sales log and track your inventory stock.
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl w-full mx-auto px-6 mt-8 flex-1 flex flex-col gap-6">
        {error && (
          <div className="flex items-center gap-3 p-5 rounded-2xl border border-red-200 bg-red-50 text-red-700 text-sm">
            <AlertCircle className="h-6 w-6 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold block">Connection Error</span>
              <span className="text-red-600">{error}</span>
            </div>
            <button
              onClick={() => {
                setLoading(true);
                fetchDashboardData();
              }}
              className="px-3.5 py-1.5 bg-red-100 hover:bg-red-200 text-red-800 rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-20 gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Initializing forecasting models and database...</p>
          </div>
        ) : (
          <>
            {/* Top Stat Summary Cards */}
            <MetricCards summary={summary} />

            {/* Empty State / Get Started Banner if no products imported */}
            {products.length === 0 && (
              <div className="flex flex-col gap-6 items-center">
                <div className="glass-panel rounded-2xl border border-slate-200 p-12 text-center max-w-2xl mx-auto flex flex-col items-center justify-center space-y-4 bg-white">
                  <FileSpreadsheet className="h-12 w-12 text-emerald-600 animate-bounce" />
                  <h3 className="text-lg font-bold text-slate-800">No Sales Data Found</h3>
                  <p className="text-sm text-slate-600 max-w-md">
                    To get started, download our pre-configured demo Excel sheet with 90 days of Kirana daily logs, then upload it using the dropzone.
                  </p>
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <button
                      onClick={handleDownloadDemo}
                      disabled={demoGenerating}
                      className="flex items-center gap-2 px-5 py-2.5 font-semibold text-sm rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download Sample Log
                    </button>
                    <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
                      Dear user, please use this format to analyze your daily sales log and track your inventory stock.
                    </p>
                  </div>
                </div>
                <div className="w-full max-w-2xl">
                  <UploadExcel onUploadSuccess={fetchDashboardData} />
                </div>
              </div>
            )}

            {/* Dashboard Workspace Grid */}
            {products.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Side Section: Upload & Stock List (60% width) */}
                <div className="lg:col-span-7 flex flex-col gap-6 h-full">
                  <UploadExcel onUploadSuccess={fetchDashboardData} />
                  <StockTable
                    products={products}
                    selectedSku={selectedProduct?.sku}
                    onSelectProduct={(p) => setSelectedProduct(p)}
                  />
                </div>

                {/* Right Side Section: Forecast Chart & AI Chat (40% width) */}
                <div className="lg:col-span-5 flex flex-col gap-6 h-full">
                  <ForecastChart selectedProduct={selectedProduct} />
                  <ChatInterface onChatExecuted={fetchDashboardData} />
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
