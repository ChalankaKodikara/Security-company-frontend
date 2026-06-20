import React, { useState, useEffect } from "react";
import axios from "axios";

const HistoryLoggedDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyword, setKeyword] = useState("");
  const [historyData, setHistoryData] = useState([]);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (keyword) params.keyword = keyword;

      const res = await axios.get(`${API_URL}/v1/hris/logs/audit-logs`, {
        params,
        headers: {
          "Cache-Control": "no-cache", // avoid 304
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });

      console.log("API response:", res.data);

      // 👇 always ensure historyData is an array
      const logs = Array.isArray(res.data?.data) ? res.data.data : [];
      setHistoryData(logs);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to fetch data");
      setHistoryData([]); // reset
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);

  const avatarBgClass = (seed = "") => {
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
    for (let i = 0; i < seed.length; i++)
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
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

  const filteredData = (Array.isArray(historyData) ? historyData : []).filter((row) => {
    const search = keyword.toLowerCase();
    return (
      String(row.employee_no || "").toLowerCase().includes(search) ||
      String(row.employee_fullname || "").toLowerCase().includes(search)
    );
  });


  return (
    <div className="font-montserrat">
      <p className="text-[25px]">Edit History</p>

      <div className="flex gap-4 mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border rounded p-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border rounded p-2"
        />
        <input
          type="text"
          placeholder="Search by Employee No or Name"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="border rounded p-2"
        />
        <button
          onClick={fetchData}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Search
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow p-2 rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-600 border-b border-t">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-900">Employee No</th>
              <th className="px-6 py-4 font-medium text-gray-900">Editor Name</th>
              <th className="px-6 py-4 font-medium text-gray-900">Field Name</th>
              <th className="px-6 py-4 font-medium text-gray-900">Old Value</th>
              <th className="px-6 py-4 font-medium text-gray-900">New Value</th>
              <th className="px-6 py-4 font-medium text-gray-900">Edited At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-t border-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan="6" className="text-center py-4 text-red-500">
                  Error: {error}
                </td>
              </tr>
            ) : filteredData.length > 0 ? (
              filteredData.map((row) => (
                <tr
                  key={row.id || `${row.employee_no}-${row.edit_timestamp}`}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-3 text-blue-600">{row.employee_no}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs shrink-0 ${avatarBgClass(
                          row.employee_fullname || row.employee_no
                        )}`}
                        title={row.employee_fullname}
                      >
                        {getInitials(row.employee_fullname || row.employee_no)}
                      </div>
                      <div>
                        <div className="font-semibold leading-5">
                          {row.employee_fullname}
                        </div>
                        <div className="text-xs text-gray-500">
                          EMP ID: {row.employee_no}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">{row.field_name || "N/A"}</td>
                  <td className="p-3">{row.old_value || "N/A"}</td>
                  <td className="p-3">{row.new_value || "N/A"}</td>
                  <td className="p-3">{row.edit_timestamp}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4 text-gray-500">
                  No data found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HistoryLoggedDetails;
