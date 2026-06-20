/** @format */

import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { saveAs } from "file-saver";
import { MdOutlineFileDownload } from "react-icons/md";

const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

function Bankslipreport() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Defaults similar to your screenshot: month=08, year=current, valueDate=today's day
  const [month, setMonth] = useState(moment().format("MM"));
  const [year, setYear] = useState(moment().format("YYYY"));
  const [valueDate, setValueDate] = useState(moment().format("DD")); // day of month (e.g., "29")

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slipText, setSlipText] = useState("");

  const monthName = useMemo(() => {
    const m = monthOptions.find((m) => m.value === month);
    return m ? m.label : month;
  }, [month]);

  const fetchSlip = async () => {
    if (!API_URL) {
      setError("REACT_APP_FRONTEND_URL is not set.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (month) params.set("month", month);
      if (year) params.set("year", year);
      if (valueDate) params.set("valueDate", String(parseInt(valueDate, 10))); // send as number-like

      const res = await fetch(
        `${API_URL}/v1/hris/payroll/bank-slip?${params.toString()}`,
        {
          headers: { Accept: "text/plain,*/*" },
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setSlipText(text ?? "");
    } catch (e) {
      setSlipText("");
      setError(e?.message || "Failed to fetch bank slip.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, valueDate]);

  const handleExport = () => {
    if (!slipText) return;
    const fname = `BankSlip_${monthName}-${year}.txt`; // e.g., BankSlip_August-2025.txt
    const blob = new Blob([slipText], { type: "text/plain;charset=utf-8;" });
    saveAs(blob, fname);
  };

  return (
    <div className="mt-5 font-montserrat rounded-xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[25px]">Bank Slip (Raw)</p>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchSlip}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Fetching..." : "Refresh"}
          </button>
          <button
            onClick={handleExport}
            disabled={!slipText || loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            title="Export as .txt"
          >
            <MdOutlineFileDownload className="text-xl" />
            Export .txt
          </button>
        </div>
      </div>

      {/* Query controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-gray-700">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {monthOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Year</label>
          <input
            type="number"
            min="1900"
            max="2100"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {/* <div>
          <label className="text-sm font-medium text-gray-700">
            Value Date (Day)
          </label>
          <input
            type="number"
            min="1"
            max="31"
            value={valueDate}
            onChange={(e) => setValueDate(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div> */}
        <div className="self-end">
          <button
            onClick={() => {
              setMonth(moment().format("MM"));
              setYear(moment().format("YYYY"));
              setValueDate(moment().format("DD"));
            }}
            className="w-full border border-gray-300 rounded px-4 py-2 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Raw response viewer (no columns, preserve exactly) */}
      <div className="bg-white shadow p-3 rounded-xl">
        {error ? (
          <div className="text-red-600 text-sm">{error}</div>
        ) : loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : slipText ? (
          <pre className="whitespace-pre overflow-auto font-mono text-[12.5px] leading-5 max-h-[60vh]">
            {slipText}
          </pre>
        ) : (
          <div className="text-gray-500 text-sm">No data.</div>
        )}
      </div>
    </div>
  );
}

export default Bankslipreport;
