import React, { useEffect, useState } from "react";
import { apiFetch } from "../../../utils/apiClient";
import Cookies from "js-cookie"; // Already imported, good!
import { MdBusiness, MdOutlineMail, MdOutlineCall } from "react-icons/md";
import { HiLocationMarker } from "react-icons/hi";
import { useNavigate, useLocation } from "react-router-dom";

const ViewOrg = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Popup states
  const [isYMOpen, setIsYMOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null); // Stores the full organization object
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);

  // 🔹 Generate Year/Month Lists
  const years = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = [
    { n: "January", v: 1 },
    { n: "February", v: 2 },
    { n: "March", v: 3 },
    { n: "April", v: 4 },
    { n: "May", v: 5 },
    { n: "June", v: 6 },
    { n: "July", v: 7 },
    { n: "August", v: 8 },
    { n: "September", v: 9 },
    { n: "October", v: 10 },
    { n: "November", v: 11 },
    { v: 12, n: "December" }, // Corrected 'v' position for consistency
  ];

  // 🔹 Fetch Organizations
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            method: "GET",
          }
        );
        const json = await res.json();
        if (json.success) {
          setOrganizations(json.data);
        }
      } catch (error) {
        console.error("❌ Error fetching organizations:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrganizations();
  }, [API_URL]);

  // 🔹 Handlers for popup
  const openYearMonthPicker = (org) => {
    setSelectedOrg(org); // Set the entire organization object
    setIsYMOpen(true);
  };

  const location = useLocation();

  const closeYearMonthPicker = () => {
    setIsYMOpen(false);
    setSelectedOrg(null);
  };

  const applyYearMonth = () => {
    if (!selectedOrg) {
      console.warn("No organization selected for navigation.");
      return;
    }

    // ⭐ STEP 1: Set the selected organization_id to a cookie
    Cookies.set("organization_id", selectedOrg.id, { expires: 7 }); // expires: 7 for 7 days, adjust as needed

    console.log("Setting organization_id cookie:", selectedOrg.id);

    const isIncentiveFlow = location.pathname.includes("incentive-payroll-organization");
    const destination = isIncentiveFlow
      ? `/incentive-payroll-screen?org_id=${selectedOrg.id}&year=${tempYear}&month=${tempMonth}`
      : `/month-end-payroll?org_id=${selectedOrg.id}&year=${tempYear}&month=${tempMonth}`;

    navigate(destination, { replace: true });
    setIsYMOpen(false);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-blue-600"></div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-montserrat">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[25px] font-bold text-slate-800 mb-2">
          Organizations
        </h1>
        <p className="text-gray-600">
          View and manage all registered organizations
        </p>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 cursor-pointer"
            onClick={() => openYearMonthPicker(org)}
          >
            {/* Hover Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            {/* Content */}
            <div className="relative p-6">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg group-hover:bg-white/30 transition-all duration-300">
                  <MdBusiness className="text-white text-3xl group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300 mb-2">
                {org.organization_name}
              </h3>

              {/* Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-white/90">
                  <MdOutlineMail />
                  <span>{org.email || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-white/90">
                  <MdOutlineCall />
                  <span>{org.contact_no || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 group-hover:text-white/90">
                  <HiLocationMarker />
                  <span>{org.address || "N/A"}</span>
                </div>
              </div>

              {/* Status Tag */}
              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    org.status === "active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {org.status?.toUpperCase() || "UNKNOWN"}
                </span>
              </div>
            </div>

            {/* Decorative Circle */}
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
          </div>
        ))}
      </div>

      {/* Year & Month Picker Modal */}
      {isYMOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-5 shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                Pick Year & Month for{" "}
                <span className="text-blue-600">
                  {selectedOrg?.organization_name}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Year</label>
                <select
                  className="border border-gray-300 p-2 rounded-md bg-white"
                  value={tempYear}
                  onChange={(e) => setTempYear(Number(e.target.value))}
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Month</label>
                <select
                  className="border border-gray-300 p-2 rounded-md bg-white"
                  value={tempMonth}
                  onChange={(e) => setTempMonth(Number(e.target.value))}
                >
                  {months.map((m) => (
                    <option key={m.v} value={m.v}>
                      {m.n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                onClick={closeYearMonthPicker}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={applyYearMonth}
              >
                Apply
              </button>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              {tempYear && tempMonth
                ? `Selected: ${tempYear}-${String(tempMonth).padStart(2, "0")} for ${selectedOrg?.organization_name}`
                : "Choose year and month, then Apply."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOrg;