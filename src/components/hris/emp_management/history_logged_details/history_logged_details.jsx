/** @format */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { apiFetch } from "../../../../utils/apiClient";
const HistoryLoggedDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyword, setKeyword] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (keyword) params.keyword = keyword;

      const query = new URLSearchParams(params).toString();

      const res = await apiFetch(
        `${API_URL}/v1/hris/logs/audit-logs?${query}`
      );

      const data = await res.json();

      console.log("API response:", data);

      if (data.success && Array.isArray(data.data)) {
        setHistoryData(data.data);
        setTotalPages(Math.ceil((data.count || 0) / limit));
      } else {
        setHistoryData([]);
        setTotalPages(1);
      }

    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch data");
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [page, limit]);

  const avatarBgClass = (seed) => {
    const safeSeed = typeof seed === "string" ? seed : String(seed || "x");

    const palette = [
      "bg-sky-500",
      "bg-indigo-500",
      "bg-emerald-500",
      "bg-rose-500",
      "bg-amber-500",
      "bg-teal-500",
      "bg-fuchsia-500",
      "bg-cyan-500",
    ];

    let hash = 0;
    for (let i = 0; i < safeSeed.length; i++) {
      hash = (hash * 31 + safeSeed.charCodeAt(i)) >>> 0;
    }

    return palette[hash % palette.length];
  };


  const getInitials = (fullName = "") => {
    const tokens = String(fullName)
      .replace(/[^\p{L}\p{N}\s'-]/gu, "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (tokens.length === 0) return "??";
    if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
    return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
  };

  // Strip domain + employees/profile_pictures/EMPXXXX/ path
  const stripFilePrefix = (value = "") => {
    if (!value) return "N/A";
    try {
      return value.replace(
        /^https:\/\/[^/]+\.s3\.ap-southeast-1\.amazonaws\.com\/employees\/profile_pictures\/[^/]+\//i,
        ""
      );
    } catch {
      return value;
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="font-montserrat"
    >
      {/* PAGE TITLE */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
          Audit Logs – Edit History
        </h1>
        <p className="text-gray-500 text-sm">Track all employee profile changes</p>
      </div>

      {/* FILTER PANEL */}
      <div className="p-5 mb-6 bg-white/70 backdrop-blur-xl border border-gray-200 shadow-lg rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

          {/* Start Date */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Keyword Search */}
          <div>
            <label className="text-[12px] font-semibold text-gray-600">Search</label>
            <input
              type="text"
              placeholder="Employee No / Name"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Search Button */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setPage(1);
                fetchData();
              }}
              className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 shadow hover:bg-blue-700 transition-all"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <tr>
              {[
                "Employee No",
                "Editor Name",
                "Field Name",
                "Old Value",
                "New Value",
                "Edited At",
              ].map((head) => (
                <th key={head} className="py-3 px-4 text-left font-semibold tracking-wide">
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : historyData.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  No results found
                </td>
              </tr>
            ) : (
              historyData.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01, backgroundColor: "#f9fafb" }}
                  transition={{ duration: 0.2 }}
                  className="border-b border-gray-100"
                >
                  {/* Employee No */}
                  <td className="py-3 px-4 text-blue-600 font-medium">
                    {row.employee_no}
                  </td>

                  {/* Editor Name + Avatar */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm ring-2 ring-offset-2 ring-offset-white ${avatarBgClass(
                          row.employee_fullname
                        )}`}
                      >
                        {getInitials(row.employee_fullname || row.employee_no || "User")
                        }
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{row.employee_fullname}</p>
                        <p className="text-xs text-gray-500">{row.employee_no}</p>
                      </div>
                    </div>
                  </td>

                  {/* Field Name */}
                  <td className="py-3 px-4 text-gray-700">{row.field_name}</td>

                  {/* Old Value */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md shadow-sm">
                      {stripFilePrefix(row.old_value)}
                    </span>
                  </td>

                  {/* New Value */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md shadow-sm">
                      {stripFilePrefix(row.new_value)}
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 px-4 text-gray-600">{row.edit_timestamp}</td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center mt-6">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={`px-4 py-2 rounded-lg ${page === 1
              ? "bg-gray-300 text-gray-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Prev
          </button>

          <span className="text-sm">
            Page <b>{page}</b> of <b>{totalPages}</b>
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className={`px-4 py-2 rounded-lg ${page === totalPages
              ? "bg-gray-300 text-gray-600"
              : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
          >
            Next
          </button>
        </div>

        {/* Limit selector */}
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white shadow"
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </div>
    </motion.div>
  );

};

export default HistoryLoggedDetails;
