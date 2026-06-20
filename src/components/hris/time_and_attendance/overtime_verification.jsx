import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { Eye } from "lucide-react";
import { apiFetch } from "../../../utils/apiClient";
const ViewOtVerification = () => {
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  // filters
  const [organizations, setOrganizations] = useState([]);
  const [organizationId, setOrganizationId] = useState("");
  const [status, setStatus] = useState("AUTHORIZED");
  const [search, setSearch] = useState("");

  /* -------------------- GET ORGANIZATIONS -------------------- */
  const fetchOrganizations = async () => {
    try {
      const res = await apiFetch(`${API_URL}/v1/hris/organizations/organization`, {
      });
      const result = await res.json();
      if (result.success) {
        setOrganizations(result.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* -------------------- GET VERIFY LIST -------------------- */
  const fetchVerifyList = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (organizationId) params.append("organization_id", organizationId);
      if (status) params.append("status", status);
      if (search) params.append("search", search);

      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/verify?${params.toString()}`,
       
      );

      const result = await res.json();
      if (result.success) {
        setData(result.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    fetchVerifyList();
  }, [organizationId, status, search]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "AUTHORIZED":
        return "bg-green-100 text-green-700";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700";
      case "REJECTED":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-6">

        {/* ================= HEADER ================= */}
        <h1 className="text-2xl font-bold text-gray-800">
          Authorized OT Assignments
        </h1>
        <p className="text-gray-500 mb-6">
          View authorized overtime records
        </p>

        {/* ================= FILTERS ================= */}
        <div className="flex flex-wrap gap-4 mb-6">
          {/* Organization */}
          <select
            value={organizationId}
            onChange={(e) => setOrganizationId(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option
                key={org.organization_id}
                value={org.organization_id}
              >
                {org.organization_name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Status</option>
            <option value="AUTHORIZED">Authorized</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-4 py-2 w-64"
          />
        </div>

        {/* ================= TABLE ================= */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm">
                <th className="p-3 text-left">OT Date</th>
                <th className="p-3 text-left">Work</th>
                <th className="p-3 text-left">Start Time</th>
                <th className="p-3 text-left">End Time</th>
                <th className="p-3 text-left">Assigned By</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6">
                    No records found
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.overtime_assignment_group_id}
                    className="border-b hover:bg-blue-50 text-sm"
                  >
                    <td className="p-3">{row.ot_date}</td>
                    <td className="p-3 font-medium">
                      {row.name_of_work}
                    </td>
                    <td className="p-3">{row.planned_start_time}</td>
                    <td className="p-3">{row.planned_end_time}</td>
                    <td className="p-3">{row.assigned_by}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full font-semibold ${getStatusBadge(
                          row.authorization_status
                        )}`}
                      >
                        {row.authorization_status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() =>
                          navigate(
                            `/view-ot-verification?overtime_assignment_group_id=${row.overtime_assignment_group_id}`
                          )
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>Showing 1 – {data.length} of {data.length}</span>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border rounded">&lt;</button>
            <span>Page 1 / 1</span>
            <button className="px-2 py-1 border rounded">&gt;</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ViewOtVerification;
