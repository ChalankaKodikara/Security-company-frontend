import React, { useEffect, useState } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import {
  MdBusiness,
  MdOutlineMail,
  MdOutlineCall,
  MdDeleteOutline,
} from "react-icons/md";
import { HiLocationMarker } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEdit } from "react-icons/fi";
import usePermissions from "../../../permissions/permission";

const ViewOrg = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const fetchOrganizations = async () => {
    try {
      const userToken = Cookies.get("accessToken");

      const res = await axios.get(
        `${API_URL}/v1/hris/organizations/organization`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        },
      );

      if (res.data.success) {
        setOrganizations(res.data.data);
      }
    } catch (error) {
      console.error("❌ Error fetching organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [API_URL]);

  // Open modal
  const confirmDelete = (org) => {
    setSelectedOrg(org);
    setShowModal(true);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!selectedOrg) return;

    try {
      const userToken = Cookies.get("accessToken");
      const res = await axios.delete(
        `${API_URL}/v1/hris/organizations/delete/${selectedOrg.id}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      if (res.data.success) {
        toast.success(res.data.message || " Organization deleted successfully");
        // remove from state immediately
        setOrganizations((prev) => prev.filter((o) => o.id !== selectedOrg.id));
      } else {
        toast.error(res.data.message || "⚠️ Failed to delete organization");
      }
    } catch (err) {
      console.error("❌ Delete error:", err);
      toast.error("Error deleting organization");
    } finally {
      setShowModal(false);
      setSelectedOrg(null);
    }
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

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="group relative overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300"
          >
            {/* Hover Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative p-6">
              {/* Header Row */}
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-4 rounded-xl shadow-lg group-hover:bg-white/30 transition-all duration-300">
                  <MdBusiness className="text-white text-3xl group-hover:scale-110 transition-transform duration-300" />
                </div>

                <div className="flex items-center gap-2">
                  {hasPermission(10046) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(org);
                      }}
                      className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-full transition-all duration-200"
                      title="Delete Organization"
                    >
                      <MdDeleteOutline size={22} />
                    </button>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate("/view-edit-org", { state: { orgData: org } });
                    }}
                    className="text-yellow-500 hover:text-white hover:bg-yellow-500 p-2 rounded-full transition-all duration-200"
                    title="Edit Organization"
                  >
                    <FiEdit size={22} />
                  </button>
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

              {/* Status */}
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

      {/* 🧩 Delete Confirmation Modal */}
      {showModal && selectedOrg && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Delete Organization
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-red-600">
                {selectedOrg.organization_name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewOrg;
