import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { toast } from "react-toastify";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../../utils/apiClient";
const AuthorizedOvertime = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const authorizedByEmployeeNo = Cookies.get("username");
  const organizationId = params.get("org_id") || "";
  const search = params.get("search") || "";
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authId, setAuthId] = useState(null);
  const [authStatus, setAuthStatus] = useState("");
  const [authRemarks, setAuthRemarks] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [authorizationStatus, setAuthorizationStatus] = useState("PENDING");
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate();

  const openAuthorizeModal = (id, status) => {
    setAuthId(id);
    setAuthStatus(status);
    setAuthRemarks("");
    setShowAuthModal(true);
  };

  const handleView = (overtimeAssignmentGroupId) => {
    navigate(
      `/view-ot-authorization?overtime_assignment_group_id=${overtimeAssignmentGroupId}`
    );
  };

  const handleAuthorizeSubmit = async () => {
    if (!authRemarks.trim()) {
      toast.error("Remarks are required");
      return;
    }

    try {
      setAuthSubmitting(true);

      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignments/${authId}/authorize`,
        {
          method: "PUT",
         
          body: JSON.stringify({
            status: authStatus,
            authorized_by_employee_no: authorizedByEmployeeNo,
            authorization_remarks: authRemarks,
          }),
        }
      );

      const result = await res.json();

      if (res.ok && result.success) {
        toast.success(
          authStatus === "AUTHORIZED"
            ? "OT approved successfully"
            : "OT rejected successfully"
        );

        setShowAuthModal(false);
        fetchAuthorizedAssignments(); // refresh table
      } else {
        toast.error(result.message || "Authorization failed");
      }
    } catch (err) {
      console.error("Authorize error:", err);
      toast.error("Something went wrong");
    } finally {
      setAuthSubmitting(false);
    }
  };

  const fetchAuthorizedAssignments = async () => {
    try {
      setLoading(true);
      const token = Cookies.get("accessToken");

      const query = new URLSearchParams({
        page: currentPage,
        limit: rowsPerPage,
      });

      // 🔹 filters
      if (selectedOrg) {
        query.append("organization_id", selectedOrg);
      }

      if (searchText) {
        query.append("search", searchText);
      }

      if (authorizationStatus !== "ALL") {
        query.append("authorization_status", authorizationStatus);
      }

      const res = await apiFetch(
        `${API_URL}/v1/hris/overtime/assignments-by-status?${query.toString()}`,
       
      );

      const result = await res.json();

      if (result.success) {
        setData(result.data || []);
        setTotalRecords(result.pagination?.total || 0);
        setTotalPages(
          Math.max(1, Math.ceil((result.pagination?.total || 0) / rowsPerPage))
        );
      }
    } catch (err) {
      console.error("Fetch OT error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthorizedAssignments();
  }, [selectedOrg, searchText, authorizationStatus, currentPage]);

  const fetchOrganizations = async () => {
    try {

      const res = await apiFetch(`${API_URL}/v1/hris/organizations/organization`, {
      });

      const result = await res.json();

      if (result.success) {
        setOrganizations(result.data || []);
      }
    } catch (err) {
      console.error("Fetch organizations error:", err);
    }
  };
  useEffect(() => {
    fetchOrganizations();
  }, []);

  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Authorized OT Assignments
        </h1>
        <p className="text-gray-600 text-lg">
          View authorized overtime records
        </p>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
        <div className="flex gap-4 mb-6 p-5">
          {/* Organization Dropdown */}
          <select
            value={selectedOrg}
            onChange={(e) => {
              setSelectedOrg(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All Organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.organization_name}
              </option>
            ))}
          </select>

          {/* Authorization Status */}
          <select
            value={authorizationStatus}
            onChange={(e) => {
              setAuthorizationStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          >
            <option value="">All</option>
            <option value="AUTHORIZED">Authorized</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search..."
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setCurrentPage(1);
            }}
            className="border rounded-lg px-4 py-2"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                {[
                  "Employee No",
                  "Employee Name",
                  "OT Date",
                  "Work",
                  "Reason",
                  "Start Time",
                  "Action",
                ].map((h) => (
                  <th key={h} className="px-6 py-4 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan="11" className="text-center py-10">
                    Loading...
                  </td>
                </tr>
              ) : data.length > 0 ? (
                data.map((row, index) => (
                  <motion.tr key={row.overtime_assignment_group_id}>
                    <td className="px-6 py-4">{row.ot_date}</td>
                    <td className="px-6 py-4">{row.name_of_work}</td>
                    <td className="px-6 py-4">{row.planned_start_time}</td>
                    <td className="px-6 py-4">{row.planned_end_time}</td>
                    <td className="px-6 py-4">{row.assigned_by}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                        {row.authorization_status}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 text-blue-600 cursor-pointer"
                      onClick={() =>
                        handleView(row.overtime_assignment_group_id)
                      }
                    >
                      <MdOutlineRemoveRedEye size={20} />
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-12">
                    <Users size={50} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-600 text-lg">
                      No authorized OT found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && totalRecords > 0 && (
          <div className="p-6 bg-gray-50 flex justify-between items-center border-t">
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * rowsPerPage + 1} –
              {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
              {totalRecords}
            </span>

            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft /> Prev
              </button>

              <span>
                Page {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                Next <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showAuthModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold mb-4">
                {authStatus === "AUTHORIZED" ? "Approve OT" : "Reject OT"}
              </h3>

              {/* Authorized By */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">
                  Authorized By
                </label>
                <input
                  type="text"
                  value={authorizedByEmployeeNo}
                  disabled
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100"
                />
              </div>

              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-1">
                  Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows="3"
                  value={authRemarks}
                  onChange={(e) => setAuthRemarks(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthorizeSubmit}
                  disabled={authSubmitting}
                  className={`px-4 py-2 rounded-lg text-white ${
                    authStatus === "AUTHORIZED"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {authSubmitting
                    ? "Submitting..."
                    : authStatus === "AUTHORIZED"
                    ? "Approve"
                    : "Reject"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AuthorizedOvertime;
