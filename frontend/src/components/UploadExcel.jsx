import React, { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import axios from "axios";

export default function UploadExcel({ onUploadSuccess }) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  const uploadFile = async (file) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError("Invalid file format. Please upload an Excel workbook (.xlsx or .xls).");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      const { details, forecasting } = response.data;
      setSuccess({
        products: details.products_imported,
        sales: details.sales_logs_imported,
        mape: forecasting.avg_mape
      });
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload file. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="w-full">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative w-full rounded-2xl border-2 border-dashed p-8 text-center transition-all bg-white shadow-sm ${
          dragActive
            ? "border-emerald-500 bg-emerald-50/30 scale-[1.01]"
            : "border-slate-200 hover:border-slate-400"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".xlsx, .xls"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="rounded-full bg-emerald-50 p-4 border border-emerald-100 text-emerald-600">
            {loading ? (
              <RefreshCw className="h-8 w-8 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-8 w-8" />
            )}
          </div>

          <div>
            <p className="font-semibold text-lg text-slate-800">
              Upload Daily Sales & Inventory Sheet
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Drag and drop your Excel file here, or click to browse
            </p>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onButtonClick}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-medium text-white text-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-sm shadow-emerald-600/10"
          >
            <Upload className="h-4 w-4" />
            Select Excel File
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-3 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm shadow-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm shadow-sm">
          <CheckCircle className="h-5 w-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold block">Upload Complete!</span>
            <span className="text-slate-600">
              Imported <strong>{success.products}</strong> products and <strong>{success.sales}</strong> daily sales logs.
              Demand forecast compiled with average MAPE of <strong>{success.mape.toFixed(1)}%</strong>.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
