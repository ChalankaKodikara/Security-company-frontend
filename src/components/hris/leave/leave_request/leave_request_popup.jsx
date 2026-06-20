/** @format */
import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import { FaRegFilePdf } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../../utils/apiClient";

const LeaveRequestPopup = ({ leaveId, onClose }) => {
  const [leaveDetails, setLeaveDetails] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [approvedStatus, setApprovedStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [emails, setEmails] = useState("");
  const [coveringEmployees, setCoveringEmployees] = useState([]);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const token = Cookies.get("accessToken");

  useEffect(() => {
    fetchLeaveDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveId]);

  const fetchLeaveDetails = async () => {
    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/leave/getleavebyid?id=${leaveId}`,
      );
      const res = await response.json();

      if (!res.success) {
        toast.error("❌ Failed to load leave details");
        return;
      }

      setLeaveDetails(res.leave);
      setCoveringEmployees(res.covering_employees || []);
      setApprovedStatus(res.leave.approved_status_1 || "");
      setRemarks(res.leave.remarks || "");
    } catch (error) {
      console.error("Error fetching leave details:", error);
      toast.error("❌ Failed to fetch leave details");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = {
      approved_status_1: approvedStatus,
      remarks: remarks,
      emails: emails.split(","),
    };

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/leave/updateLeaveStatus?leaveid=${leaveId}`,
        {
          method: "PUT",

          body: JSON.stringify(body),
        },
      );

      const resText = await response.text();

      if (response.ok) {
        toast.success(" Leave status updated successfully!");
        setTimeout(() => onClose(), 3000);
      } else {
        let details = "";
        try {
          const errJson = JSON.parse(resText);
          details = errJson.details || errJson.error || response.statusText;
        } catch {
          details = resText || response.statusText;
        }
        toast.error(`❌ Failed: ${details}`);
        setTimeout(() => onClose(), 4000);
      }
    } catch (error) {
      console.error("Error updating leave status:", error);
      toast.error(`❌ Error: ${error.message}`);
      setTimeout(() => onClose(), 4000);
    }
  };

  const handleDownloadFile = async () => {
    if (!leaveDetails?.leave_file_path) {
      toast.error("File not available");
      return;
    }

    try {
      const fileUrl = leaveDetails.leave_file_path;

      const response = await apiFetch(
        `${API_URL}/v1/hris/download/file/common-2?file_url=${encodeURIComponent(fileUrl)}`,
        {
          method: "GET",
        },
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();

      // File name (prefer backend name, fallback to URL)
      const fileName =
        leaveDetails.leave_file_name ||
        fileUrl.split("/").pop() ||
        "leave-document";

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("❌ Error downloading leave document");
    }
  };

  if (!isFormOpen) return null;

  return (
    <div className="flex justify-center items-center h-full">
      <div className="rounded-lg w-full relative">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold mb-6">Action</h2>
        </div>

        {leaveDetails ? (
          <form onSubmit={handleSubmit}>
            {/* ---- Employee Info ---- */}
            <div className="grid gap-5 items-center mt-5 grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee ID:
                </label>
                <input
                  type="text"
                  value={leaveDetails.employee_no}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee Name:
                </label>
                <input
                  type="text"
                  value={leaveDetails.employee_fullname}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department:
                </label>
                <input
                  type="text"
                  value={leaveDetails.department || "N/A"}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* ---- Dates ---- */}
            <div className="grid gap-5 items-center mt-5 grid-cols-1 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Requested Date:
                </label>
                <input
                  type="text"
                  value={leaveDetails.requested_date}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Leave Category:
                </label>
                <input
                  type="text"
                  value={leaveDetails.category_name}
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Day Type:
                </label>
                <input
                  type="text"
                  value={
                    leaveDetails.is_half_day === 0
                      ? "Full Day Leave"
                      : "Half Day Leave"
                  }
                  readOnly
                  className="mt-1 block w-full px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            {/* ---- Reason ---- */}
            <div className="flex gap-5 items-center mt-6">
              <label>Reason:</label>
              <input
                type="text"
                value={leaveDetails.reason}
                readOnly
                className="border p-2 w-[50%] rounded-md"
              />
            </div>

            {/* ---- Covering Employees ---- */}
            {coveringEmployees.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Covering Employees
                </h3>

                <div className="space-y-2">
                  {coveringEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="flex items-center justify-between 
                     p-3 border rounded-md bg-gray-50"
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {emp.covering_employee_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {emp.covering_employee_no} •{" "}
                          {emp.covering_employee_email}
                        </div>
                      </div>

                      <div className="text-xs font-semibold capitalize">
                        <span
                          className={`px-2 py-1 rounded-full ${
                            emp.status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : emp.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {emp.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leaveDetails.leave_file_path && (
              <div className="flex items-center justify-between mt-6 p-3 border rounded-md bg-gray-50">
                {/* Left: Icon + File Name */}
                <div className="flex items-center gap-2">
                  <FaRegFilePdf className="text-red-500 w-5 h-5" />
                  <span className="text-sm text-gray-700 font-medium">
                    {leaveDetails.leave_file_name || "Leave Document"}
                  </span>
                </div>

                <button
                  onClick={handleDownloadFile}
                  className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1.5 rounded-md shadow-sm hover:bg-blue-600 transition text-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4v12m0 0l-3-3m3 3l3-3m-9 6h12"
                    />
                  </svg>
                  Download
                </button>
              </div>
            )}

            {/* ---- Action ---- */}
            <div className="flex gap-6 mt-6">
              <label>Action:</label>
              <div className="flex gap-4">
                <label>
                  <input
                    type="checkbox"
                    checked={approvedStatus === "APPROVED"}
                    onChange={() => setApprovedStatus("APPROVED")}
                  />{" "}
                  Approve
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={approvedStatus === "COMMUNICATE"}
                    onChange={() => setApprovedStatus("COMMUNICATE")}
                  />{" "}
                  Communicate
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={approvedStatus === "REJECTED"}
                    onChange={() => setApprovedStatus("REJECTED")}
                  />{" "}
                  Reject
                </label>
              </div>
            </div>

            {approvedStatus === "COMMUNICATE" && (
              <div className="flex gap-5 items-center mt-5">
                <label>Remark:</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="border p-2 w-[50%] rounded-md"
                />
              </div>
            )}

            {/* ---- Submit ---- */}
            <div className="flex mt-5 gap-5">
              <button
                type="submit"
                className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Send
              </button>
            </div>
          </form>
        ) : (
          <div>Loading...</div>
        )}
      </div>

      {/* Toasts */}
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
    </div>
  );
};

export default LeaveRequestPopup;
