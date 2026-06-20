"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiFetch } from "../../../utils/apiClient";
import { Trash2 } from "lucide-react";

import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  Upload,
  FileSpreadsheet,
  Hash,
  Type,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* Detect if a column looks numeric */
const isNumericColumn = (rows, colIndex) => {
  const values = rows.slice(1).map((r) => r[colIndex]?.trim());
  return values.every((v) => v === undefined || v === "" || !isNaN(Number(v)));
};

/* Column type icon */
const ColIcon = ({ isNumeric }) =>
  isNumeric ? (
    <Hash size={11} className="opacity-60" />
  ) : (
    <Type size={11} className="opacity-60" />
  );

const ServiceCharge = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [totalCharge, setTotalCharge] = useState("");
  const [lossPercentage, setLossPercentage] = useState("");
  const [excelData, setExcelData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [previewPage, setPreviewPage] = useState(1);
  const previewRowsPerPage = 8;
  const [detailModal, setDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState([]);
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [pagination, setPagination] = useState({
    totalRecords: 0,
    currentPage: 1,
    totalPages: 1,
    pageSize: 5,
  });
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  /*  THEN use it */
  const totalRecords = pagination.totalRecords;
  const totalPages = pagination.totalPages;
  const handleGetFromRMS = () => setTotalCharge("480000");

  const openDeleteModal = (row) => {
    setDeleteTarget(row);
    setDeleteModal(true);
  };
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result || "";
      const rows = text
        .split("\n")
        .filter((r) => r.trim())
        .map((row) => row.split(","));
      setExcelData(rows);
      setPreviewPage(1);
    };
    reader.readAsText(file);
  };
  const fetchServiceCharge = async (page, limit) => {
    try {
      setLoading(true);

      const res = await apiFetch(
        `${API_URL}/v1/hris/serviceCharge/summary?page=${page}&limit=${limit}`,
      );

      const result = await res.json();

      if (result.success) {
        setTableData(result.data);
        setPagination((prev) => ({
          ...prev,
          totalRecords: result.pagination.totalRecords,
          totalPages: result.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch service charge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (row) => {
    try {
      setDetailLoading(true);
      setDetailModal(true);
      setSelectedInfo(row);

      const res = await apiFetch(
        `${API_URL}/v1/hris/serviceCharge?month=${row.month}&year=${row.year}`,
      );

      const result = await res.json();

      if (result.success) {
        setDetailData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch service charge details:", error);
    } finally {
      setDetailLoading(false);
    }
  };
  useEffect(() => {
    fetchServiceCharge(pagination.currentPage, pagination.pageSize);
  }, [pagination.currentPage]);
  /* Preview pagination */
  const dataRows = excelData.slice(1);
  const totalPreviewPages = Math.ceil(dataRows.length / previewRowsPerPage);
  const visibleRows = dataRows.slice(
    (previewPage - 1) * previewRowsPerPage,
    previewPage * previewRowsPerPage,
  );
  const headers = excelData[0] || [];
  const numericCols = headers.map((_, i) => isNumericColumn(excelData, i));
  const handleSaveServiceCharge = async () => {
    try {
      if (!year || !month || !totalCharge) {
        toast.error("Please fill Year, Month and Total Service Charge");
        return;
      }

      if (excelData.length <= 1) {
        toast.error("Please upload a valid CSV file");
        return;
      }

      const expectedHeaders = [
        "employee_id",
        "service_percentage",
        "work_days",
        "no_pay_days",
        "deductions",
      ];

      const uploadedHeaders = excelData[0].map((h) => h.trim());

      const isValid = expectedHeaders.every(
        (header, index) => uploadedHeaders[index] === header,
      );

      if (!isValid) {
        toast.error("Invalid CSV format. Please check column headers.");
        return;
      }

      const employees = excelData.slice(1).map((row) => ({
        employee_id: row[0],
        service_percentage: Number(row[1]),
        work_days: Number(row[2]),
        no_pay_days: Number(row[3]),
        deductions: Number(row[4]),
      }));

      const payload = {
        month: months.indexOf(month) + 1,
        year: Number(year),
        total_service_charge: Number(totalCharge),
        loss_percentage: Number(lossPercentage),
        employees,
      };

      const res = await apiFetch(
        `${API_URL}/v1/hris/serviceCharge/calculate-save`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();

      if (result.success) {
        toast.success("Service charge calculated & saved successfully!");
        setShowModal(false);
        fetchServiceCharge(1, pagination.pageSize);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to save service charge");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/serviceCharge?month=${deleteTarget.month}&year=${deleteTarget.year}`,
        { method: "DELETE" },
      );

      const result = await res.json();

      if (result.success) {
        toast.success("Service charge deleted successfully!");
        setDeleteModal(false);
        setDeleteTarget(null);
        fetchServiceCharge(pagination.currentPage, pagination.pageSize);
      } else {
        toast.error(result.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete service charge");
    }
  };
  return (
    <div className="p-6 min-h-screen bg-gray-50 font-sans">
      {/* HEADER */}
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
          Service Charge Report
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl shadow-lg transition-all"
        >
          Generate Service Charge Report
        </button>
      </div>

      {/* TABLE */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                Month
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                Year
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                Distributed
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                Loss Amount
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                Loss %
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                Net Service Charge
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {tableData.map((row, index) => (
              <tr key={index} className="hover:bg-blue-50/40 transition-colors">
                {/* Month */}
                <td className="px-6 py-4 font-semibold text-gray-800">
                  {months[row.month - 1]}
                </td>

                {/* Year */}
                <td className="px-6 py-4 text-gray-600">{row.year}</td>

                {/* Distributed */}
                <td className="px-6 py-4 text-indigo-600 font-medium">
                  Rs {row.distributed_amount?.toLocaleString()}
                </td>

                {/* Loss Amount */}
                <td className="px-6 py-4 text-red-600 font-medium">
                  Rs {row.loss_amount?.toLocaleString()}
                </td>

                {/* Loss Percentage */}
                <td className="px-6 py-4 text-red-500 font-medium">
                  {row.loss_percentage}%
                </td>

                {/* Net Service Charge */}
                <td className="px-6 py-4 font-bold text-emerald-600 flex items-center gap-1">
                  Rs
                  {row.net_service_charge?.toLocaleString()}
                </td>

                {/* Action */}
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    {/* View */}
                    <button
                      onClick={() => handleView(row)}
                      className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View
                    </button>

                    <button
                      onClick={() => openDeleteModal(row)}
                      className="px-3 py-1.5 text-xs font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 border-t border-gray-100">
          <span className="text-xs text-gray-500">{totalRecords} records</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: Math.max(1, prev.currentPage - 1),
                }))
              }
              disabled={pagination.currentPage === 1}
              className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-medium text-gray-600">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            {totalRecords} records
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
                }))
              }
              disabled={currentPage === totalPages}
              className="p-1 rounded-lg hover:bg-gray-200 disabled:opacity-30 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden"
            >
              {/* Modal accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

              <div className="p-6">
                {/* Close */}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors bg-gray-100 hover:bg-red-50 rounded-full p-1"
                >
                  <X size={16} />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-6">
                  Generate Service Charge
                </h2>

                {/* FORM */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Year
                    </label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Month
                    </label>
                    <select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      className="w-full mt-1.5 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition bg-white"
                    >
                      <option value="">Select Month</option>
                      {months.map((m) => (
                        <option key={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Total Service Charge
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="number"
                      value={totalCharge}
                      onChange={(e) => setTotalCharge(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                    {/* <button
                                            onClick={handleGetFromRMS}
                                            className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                                        >
                                            Get From RMS
                                        </button> */}
                  </div>
                </div>

                <div className="mb-5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Loss Percentage{" "}
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="number"
                      value={lossPercentage}
                      onChange={(e) => setLossPercentage(e.target.value)}
                      placeholder="e.g. 10"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                    />
                  </div>
                </div>

                {/* UPLOAD ZONE */}
                <div className="mb-4">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                    Upload Excel / CSV
                  </label>
                  <label className="group flex items-center gap-3 border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/50 hover:bg-blue-50 px-4 py-3 rounded-xl cursor-pointer transition-all">
                    <div className="bg-blue-100 group-hover:bg-blue-200 rounded-lg p-2 transition-colors">
                      <Upload size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      {fileName ? (
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet
                            size={14}
                            className="text-emerald-500"
                          />
                          <span className="text-sm font-medium text-emerald-700">
                            {fileName}
                          </span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-blue-700">
                            Click to upload file
                          </p>
                          <p className="text-xs text-blue-400">
                            CSV format supported
                          </p>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".csv"
                      hidden
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>

                {/* ===== EXCEL PREVIEW ===== */}
                <AnimatePresence>
                  {excelData.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mb-5"
                    >
                      {/* Preview header bar */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="bg-emerald-100 rounded-md p-1">
                            <BarChart2 size={13} className="text-emerald-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                            Preview
                          </span>
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full font-medium">
                            {dataRows.length} rows · {headers.length} cols
                          </span>
                        </div>
                        {totalPreviewPages > 1 && (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                setPreviewPage((p) => Math.max(1, p - 1))
                              }
                              disabled={previewPage === 1}
                              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 transition"
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="text-xs text-gray-500 font-medium">
                              {previewPage}/{totalPreviewPages}
                            </span>
                            <button
                              onClick={() =>
                                setPreviewPage((p) =>
                                  Math.min(totalPreviewPages, p + 1),
                                )
                              }
                              disabled={previewPage === totalPreviewPages}
                              className="p-0.5 rounded hover:bg-gray-100 disabled:opacity-30 transition"
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Table container */}
                      <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-xs border-collapse">
                            {/* Column headers */}
                            <thead>
                              <tr>
                                {/* Row number header */}
                                <th className="sticky top-0 bg-gray-800 text-gray-400 font-medium px-3 py-2.5 text-center border-r border-gray-700 w-8 z-10">
                                  #
                                </th>
                                {headers.map((h, i) => (
                                  <th
                                    key={i}
                                    className="sticky top-0 bg-gray-800 text-white font-semibold px-4 py-2.5 text-left border-r border-gray-700 last:border-r-0 z-10 whitespace-nowrap"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <ColIcon isNumeric={numericCols[i]} />
                                      <span>{h?.trim() || `Col ${i + 1}`}</span>
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>

                            {/* Data rows */}
                            <tbody>
                              {visibleRows.map((row, rowIdx) => {
                                const absoluteRow =
                                  (previewPage - 1) * previewRowsPerPage +
                                  rowIdx +
                                  1;
                                const isEven = rowIdx % 2 === 0;
                                return (
                                  <motion.tr
                                    key={rowIdx}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: rowIdx * 0.03 }}
                                    className={`group ${isEven ? "bg-white" : "bg-gray-50/70"} hover:bg-blue-50/60 transition-colors`}
                                  >
                                    {/* Row number */}
                                    <td className="px-3 py-2 text-center text-gray-400 font-mono border-r border-gray-100 group-hover:text-gray-500 select-none">
                                      {absoluteRow}
                                    </td>
                                    {headers.map((_, colIdx) => {
                                      const val = row[colIdx]?.trim() ?? "";
                                      const isNum =
                                        numericCols[colIdx] && val !== "";
                                      return (
                                        <td
                                          key={colIdx}
                                          className={`px-4 py-2 border-r border-gray-100 last:border-r-0 whitespace-nowrap ${
                                            isNum
                                              ? "text-right font-mono text-indigo-700 font-medium tabular-nums"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          {isNum
                                            ? Number(val).toLocaleString()
                                            : val || (
                                                <span className="text-gray-300 italic text-xs">
                                                  —
                                                </span>
                                              )}
                                        </td>
                                      );
                                    })}
                                  </motion.tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Bottom status bar */}
                        <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Hash size={10} /> Numeric
                            </span>
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Type size={10} /> Text
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            Showing {(previewPage - 1) * previewRowsPerPage + 1}
                            –
                            {Math.min(
                              previewPage * previewRowsPerPage,
                              dataRows.length,
                            )}{" "}
                            of {dataRows.length}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* SUBMIT */}
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveServiceCharge}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 shadow-md transition-all"
                  >
                    Save Service Charge
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {detailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0, y: 24 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.93, opacity: 0, y: 24 }}
              transition={{ type: "spring", stiffness: 300, damping: 26 }}
              className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Gradient accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-100 rounded-xl p-2">
                    <BarChart2 size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-800">
                      Service Charge Details
                    </h3>
                    <p className="text-xs text-gray-400 font-medium">
                      {months[selectedInfo?.month - 1]} {selectedInfo?.year}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailModal(false)}
                  className="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 border border-gray-200 rounded-full p-1.5"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto">
                {detailLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">
                      Loading records...
                    </p>
                  </div>
                ) : detailData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <div className="bg-gray-100 rounded-full p-4">
                      <FileSpreadsheet size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-500">
                      No data found
                    </p>
                    <p className="text-xs text-gray-400">
                      No records for this period
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Summary chips */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {[
                        {
                          label: "Total Employees",
                          value: detailData.length,
                          color: "blue",
                          icon: <Users size={14} />,
                        },
                        {
                          label: "Total Gross",
                          value:
                            "RS" +
                            detailData
                              .reduce(
                                (s, r) => s + (r.gross_service_charge || 0),
                                0,
                              )
                              .toLocaleString(),
                          color: "indigo",
                          icon: <TrendingUp size={14} />,
                        },
                        {
                          label: "Total Net",
                          value:
                            "RS" +
                            detailData
                              .reduce(
                                (s, r) => s + (r.net_service_charge || 0),
                                0,
                              )
                              .toLocaleString(),
                          color: "emerald",
                          icon: <DollarSign size={14} />,
                        },
                      ].map((stat) => (
                        <div
                          key={stat.label}
                          className={`bg-${stat.color}-50 border border-${stat.color}-100 rounded-xl px-4 py-3 flex items-center gap-3`}
                        >
                          <div
                            className={`bg-${stat.color}-100 rounded-lg p-1.5 text-${stat.color}-600`}
                          >
                            {stat.icon}
                          </div>
                          <div>
                            <p
                              className={`text-xs font-semibold text-${stat.color}-500 uppercase tracking-wide`}
                            >
                              {stat.label}
                            </p>
                            <p
                              className={`text-base font-bold text-${stat.color}-700 tabular-nums`}
                            >
                              {stat.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Table */}
                    <div className="rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              {[
                                { label: "#", align: "center" },
                                { label: "Employee ID", align: "left" },
                                { label: "Work Days", align: "center" },
                                { label: "Effective Days", align: "center" },
                                { label: "Gross", align: "right" },
                                { label: "Deductions", align: "right" },
                                { label: "Net", align: "right" },
                              ].map((col) => (
                                <th
                                  key={col.label}
                                  className={`sticky top-0 bg-gray-800 text-white font-semibold px-4 py-3 text-${col.align} border-r border-gray-700 last:border-r-0 whitespace-nowrap z-10`}
                                >
                                  {col.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {detailData.map((item, idx) => (
                              <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.025 }}
                                className={`group ${
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50/70"
                                } hover:bg-blue-50/60 transition-colors`}
                              >
                                {/* Row number */}
                                <td className="px-3 py-2.5 text-center text-gray-400 font-mono border-r border-gray-100 select-none w-8">
                                  {idx + 1}
                                </td>

                                {/* Employee ID */}
                                <td className="px-4 py-2.5 border-r border-gray-100">
                                  <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-md">
                                    <Hash size={10} />
                                    {item.employee_id}
                                  </span>
                                </td>

                                {/* Work Days */}
                                <td className="px-4 py-2.5 text-center border-r border-gray-100">
                                  <span className="inline-block bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-md tabular-nums">
                                    {item.work_days}
                                  </span>
                                </td>

                                {/* Effective Days */}
                                <td className="px-4 py-2.5 text-center border-r border-gray-100">
                                  <span className="inline-block bg-blue-50 text-blue-600 font-medium px-2 py-0.5 rounded-md tabular-nums">
                                    {item.effective_days}
                                  </span>
                                </td>

                                {/* Gross */}
                                <td className="px-4 py-2.5 text-right border-r border-gray-100 font-mono font-medium text-gray-700 tabular-nums">
                                  {item.gross_service_charge?.toLocaleString() ??
                                    "—"}
                                </td>

                                {/* Deductions */}
                                <td className="px-4 py-2.5 text-right border-r border-gray-100">
                                  <span className="inline-flex items-center gap-0.5 text-rose-600 font-mono font-semibold tabular-nums">
                                    <TrendingDown size={10} />
                                    {item.deductions?.toLocaleString() ?? "—"}
                                  </span>
                                </td>

                                {/* Net */}
                                <td className="px-4 py-2.5 text-right">
                                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-bold font-mono px-2 py-0.5 rounded-md tabular-nums">
                                    Rs
                                    {item.net_service_charge?.toLocaleString() ??
                                      "—"}
                                  </span>
                                </td>
                              </motion.tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Bottom bar */}
                      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2 flex items-center justify-between">
                        <span className="text-xs text-gray-400 font-medium">
                          {detailData.length} employee
                          {detailData.length !== 1 ? "s" : ""}
                        </span>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />{" "}
                            Net
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-rose-400 rounded-full inline-block" />{" "}
                            Deductions
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/60 flex justify-end">
                <button
                  onClick={() => setDetailModal(false)}
                  className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Accent bar */}
              <div className="h-1 w-full bg-gradient-to-r from-red-500 to-rose-500" />

              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Delete Service Charge
                </h3>

                <p className="text-sm text-gray-600 mb-6">
                  Are you sure you want to delete service charge for{" "}
                  <span className="font-semibold text-gray-800">
                    {months[deleteTarget?.month - 1]} {deleteTarget?.year}
                  </span>
                  ? This action cannot be undone.
                </p>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition shadow"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />
    </div>
  );
};

export default ServiceCharge;
