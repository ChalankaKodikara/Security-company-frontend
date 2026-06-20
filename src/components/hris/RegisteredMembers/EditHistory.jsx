import React, { useEffect, useState } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { motion } from "framer-motion";
import { FiDownload } from "react-icons/fi";
import { fetchEditLogs } from "../../Services/EditLogs/EditLogs";
import Papa from "papaparse";
import Select from "react-select";

const EditHistory = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [totalRecords, setTotalRecords] = useState(0); // Add this state
  const [showValuePopup, setShowValuePopup] = useState(false);
  const [popupValue, setPopupValue] = useState("");
  const [popupTitle, setPopupTitle] = useState("");
  const [totalPages, setTotalPages] = useState(0);
  const [memberOptions, setMemberOptions] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [editLogs, setEditLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [filters, setFilters] = useState({
    member_no: "",
    member_name: "",
    epf_no: "",
    branch_code: "",
  });
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [selectedFields, setSelectedFields] = useState([
    "date",
    "time",
    "editor",
    "memberId",
    "member",
    "fieldName",
    "oldValue",
    "newValue",
    "branchCode",
  ]);

  const FIELD_OPTIONS = [
    { key: "date", label: "Application Date" },
    { key: "time", label: "Time" },
    { key: "editor", label: "Editor Role" },
    { key: "memberId", label: "Member ID" },
    { key: "member", label: "Member Name" },
    { key: "fieldName", label: "Field Name" },
    { key: "oldValue", label: "Old Value" },
    { key: "newValue", label: "New Value" },
    { key: "branchCode", label: "Branch Code" },
  ];
  useEffect(() => {
    const loadEditLogs = async () => {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("accessToken="))
          ?.split("=")[1];
        const result = await fetchEditLogs(1, 100, token);
        if (result.success) {
          const formattedData = result.data.map((log) => {
            const date = new Date(log.edited_at);
            return {
              date: date.toLocaleDateString(),
              time: date.toLocaleTimeString(),
              editor: log.edited_by || "N/A",
              memberId: log.member?.member_no || log.member_no,
              member: log.member?.member_full_name || "N/A",
              fieldName: log.field_name,
              oldValue: log.old_value,
              newValue: log.new_value,
              branchCode: log.bank?.bank_code || "N/A",
            };
          });
          setEditLogs(formattedData);
          setTotalPages(result.totalPages || 1);
          setTotalPages(result.totalPages || 1);
        }
      } catch (error) {
        console.error("Error fetching edit logs:", error);
      }
    };

    loadEditLogs();
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const fetchFilteredEditLogs = async (page = 1) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        ...filters,
      });

      const response = await fetch(
        `${API_URL}/editLog/filtered-edit-logs?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        const formattedData = result.data.map((log) => {
          const date = new Date(log.edited_at);
          return {
            date: date.toLocaleDateString(),
            time: date.toLocaleTimeString(),
            editor: log.edited_by || "N/A",
            memberId: log.member?.member_no || log.member_no,
            member: log.member?.member_full_name || "N/A",
            fieldName: log.field_name,
            oldValue: log.old_value,
            newValue: log.new_value,
            branchCode: log.official?.branch?.branch_code || "N/A",
          };
        });

        setEditLogs(formattedData);
        setTotalPages(result.totalPages || 1);
        setTotalPages(result.totalPages || 1);
        setTotalRecords(result.totalRecords || 0);
      }
    } catch (error) {
      console.error("Error fetching edit logs:", error);
    }
  };

  useEffect(() => {
    fetchFilteredEditLogs(currentPage);
  }, [filters, currentPage]);

  const fetchMembersByName = async (inputValue) => {
    if (!inputValue) return;
    setIsLoadingMembers(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];
      const logged_user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="))
        ?.split("=")[1];
      const logged_user_role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1];

      const url = new URL(
        `${process.env.REACT_APP_FRONTEND_URL}/member/search-employees`
      );
      url.searchParams.append("query", inputValue);
      url.searchParams.append("logged_user", logged_user);
      url.searchParams.append("logged_user_role", logged_user_role);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();
      if (result.success) {
        const options = result.data.map((emp) => ({
          label: emp.member_full_name,
          value: emp.member_no,
        }));
        setMemberOptions(options);
      }
    } catch (err) {
      console.error("❌ Failed to fetch members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const truncate = (text, length = 20) => {
    if (!text) return "—";
    return text.length > length ? text.slice(0, length) + "..." : text;
  };

  const handleExport = async () => {
    try {
      // Fetch the raw API data again for export (if needed)
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];
      const response = await fetch(
        `${API_URL}/editLog/filtered-edit-logs?page=1&limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const apiResponse = await response.json();

      if (!apiResponse.success) {
        console.error("❌ Failed to fetch logs for export.");
        return;
      }

      // Create modified export structure
      const modifiedExportData = {
        ...apiResponse,
        currentPage: null,
        totalPages: null,
        data: apiResponse.data.map((row) => {
          const newRow = {};
          selectedFields.forEach((field) => {
            // Handle nested fields
            switch (field) {
              case "member":
                newRow["member"] = row.member?.member_full_name || "";
                break;
              case "memberId":
                newRow["memberId"] =
                  row.member?.member_no || row.member_no || "";
                break;
              case "branchCode":
                newRow["branchCode"] = row.official?.branch?.branch_code || "";
                break;
              case "date":
                newRow["date"] = new Date(row.edited_at).toLocaleDateString();
                break;
              case "time":
                newRow["time"] = new Date(row.edited_at).toLocaleTimeString();
                break;
              default:
                newRow[field] = row[field] || "";
                break;
            }
          });
          return newRow;
        }),
      };

      // Convert to CSV
      const csv = Papa.unparse(modifiedExportData.data);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Edit_History_Export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setShowExportPopup(false);
    } catch (error) {
      console.error("❌ Error exporting data:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl mb-4">Member Edit Details</h1>
        <div className="bg-white p-5 rounded-md mt-5 shadow">
          <div className="flex flex-wrap gap-6 text-gray-700">
            <input
              placeholder="Member ID"
              className="border border-gray-300 rounded-md p-2 w-[180px]"
              value={filters.member_no}
              onChange={(e) =>
                setFilters({ ...filters, member_no: e.target.value })
              }
            />

            <div className="w-[310px]">
              <Select
                isClearable
                isLoading={isLoadingMembers}
                options={memberOptions}
                placeholder="Search by name"
                onInputChange={(value, { action }) => {
                  if (action === "input-change") fetchMembersByName(value);
                }}
                onChange={(selected) => {
                  if (selected) {
                    setFilters((prev) => ({
                      ...prev,
                      member_no: selected.value,
                    }));
                  } else {
                    setFilters((prev) => ({ ...prev, member_no: "" }));
                  }
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="flex justify-end">
              <button
                className="bg-primary text-white px-4 py-2 rounded-md mt-2 cursor-pointer transition"
                onClick={() => {
                  setFilters({
                    member_no: "",
                    epf_no: "",
                    branch_code: "",
                  });
                  setCurrentPage(1);
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <hr className="text-gray-300 mt-5" />

          <div className="flex justify-end items-center mb-4">
            <button
              className="flex items-center px-4 py-2 text-sm bg-gray-200 text-gray-500 border-gray-200 border-2 rounded-md hover:bg-gray-400 hover:text-white duration-200 mr-5 mt-3"
              onClick={() => setShowExportPopup(true)}
            >
              <FiDownload className="mr-2" />
              Export to Excel
            </button>
          </div>

          <table className="w-full text-left text-sm mt-5">
            <thead className="text-gray-500 bg-gray-100 uppercase">
              <tr>
                <th className="p-3">Application Date</th>
                <th className="p-3">TIME</th>
                <th className="p-3">EDITOR ROLE</th>
                <th className="p-3">MEMBER ID</th>
                <th className="p-3">MEMBER NAME</th>
                <th className="p-3">FIELD NAME</th>
                <th className="p-3">OLD VALUE</th>
                <th className="p-3">NEW VALUE</th>
                <th className="p-3">BRANCH CODE</th>
              </tr>
            </thead>
            <tbody>
              {editLogs.map((item, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-300 hover:bg-gray-50"
                >
                  <td className="p-3 py-4">{item.date}</td>
                  <td className="p-3 py-4">{item.time}</td>
                  <td className="p-3 py-4">{item.editor}</td>
                  <td className="p-3 py-4">{item.memberId}</td>
                  <td className="p-3 py-4">{item.member}</td>
                  <td className="p-3 py-4">{item.fieldName}</td>
                  <td className="p-3 py-4">
                    {item.oldValue?.length > 20 ? (
                      <>
                        {item.oldValue.slice(0, 20)}...
                        <button
                          className="text-blue-500 ml-2 underline text-xs"
                          onClick={() => {
                            setPopupTitle("Old Value");
                            setPopupValue(item.oldValue);
                            setShowValuePopup(true);
                          }}
                        >
                          View
                        </button>
                      </>
                    ) : (
                      item.oldValue || "—"
                    )}
                  </td>
                  <td className="p-3 py-4">
                    {item.newValue?.length > 20 ? (
                      <>
                        {item.newValue.slice(0, 20)}...
                        <button
                          className="text-blue-500 ml-2 underline text-xs"
                          onClick={() => {
                            setPopupTitle("New Value");
                            setPopupValue(item.newValue);
                            setShowValuePopup(true);
                          }}
                        >
                          View
                        </button>
                      </>
                    ) : (
                      item.newValue || "—"
                    )}
                  </td>
                  <td className="p-3 py-4">{item.branchCode}</td>
                </tr>
              ))}

              <div className="text-sm text-gray-500 mt-2 ml-2">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                {(currentPage - 1) * ITEMS_PER_PAGE + editLogs.length} of{" "}
                {totalRecords} entries
              </div>
            </tbody>
          </table>

          <div className="flex gap-1 flex-wrap">
            <button
              className="px-3 py-1 border rounded-md hover:bg-gray-100"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => {
                // Show current, first, last, and near pages
                const isNear =
                  Math.abs(pageNum - currentPage) <= 2 ||
                  pageNum === 1 ||
                  pageNum === totalPages;

                if (!isNear) return null;

                return (
                  <button
                    key={pageNum}
                    className={`px-3 py-1 border rounded-md ${currentPage === pageNum
                      ? "bg-primary text-white"
                      : "hover:bg-gray-100"
                      }`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              }
            )}

            {currentPage < totalPages - 3 && (
              <span className="px-2 text-gray-500">...</span>
            )}

            <button
              className="px-3 py-1 border rounded-md hover:bg-gray-100"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>

        {showValuePopup && (
          <div className="fixed inset-0 bg-black opacity-90 z-50 flex items-center justify-center">
            <div className="bg-white rounded-md shadow-md p-6 max-w-lg w-full">
              <h2 className="text-lg font-semibold mb-4">{popupTitle}</h2>
              <div className="text-gray-700 text-sm whitespace-pre-wrap break-words max-h-[300px] overflow-y-auto">
                {popupValue}
              </div>
              <div className="mt-4 text-right">
                <button
                  className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                  onClick={() => setShowValuePopup(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {showExportPopup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-95 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg w-[450px] shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              Select Fields to Export
            </h2>

            <div className="grid grid-cols-2 gap-y-2 gap-x-4 max-h-[250px] overflow-y-auto">
              {FIELD_OPTIONS.map(({ key, label }) => (
                <label key={key} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(key)}
                    onChange={() => {
                      setSelectedFields((prev) =>
                        prev.includes(key)
                          ? prev.filter((f) => f !== key)
                          : [...prev, key]
                      );
                    }}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setShowExportPopup(false)}
              >
                Cancel
              </button>
              <button
                className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleExport}
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default EditHistory;
