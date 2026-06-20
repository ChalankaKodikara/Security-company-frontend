/** @format */

import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Select from "react-select";
import Cookies from "js-cookie";
import debounce from "lodash.debounce";

const API_URL = process.env.REACT_APP_FRONTEND_URL;

/** utils */
const fmtDate = (v) => (!v ? "—" : v);
const getInitials = (fullName = "") => {
  const tokens = String(fullName).trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return "??";
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
};
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
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
};

/** Exportable fields */
const EXPORTABLE_FIELDS = [
  "employee_no",
  "employee_fullname",
  "employee_name_initial",
  "employee_calling_name",
  "employee_dob",
  "employee_gender",
  "employee_marital_status",
  "employee_contact_no",
  "employee_permanent_address",
  "employee_temporary_address",
  "employee_email",
  "personal_email",
  "date_of_appointment",
  "employee_basic_salary",
  "employee_active_status",
  "employee_account_no",
  "employee_account_name",
  "employee_bank_name",
  "employee_branch_name",
  "nationality",
  "religion",
  "working_office",
  "branch",
  "employment_type",
  "epf_no",
  "employee_bank_code",
  "employee_bank_branch_code",
  "grade_id",
  "employee_land_no",
  "department_name",
  "designation_name",
  "supervisor_id",
  "supervisor_employee_no",
  "supervisor_fullname",
  "supervisor_email",
  "supervisor_contact_no",
];

const labelize = (key) =>
  String(key)
    .replace(/_/g, " ")
    .replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1));
const csvCell = (v) => {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

export default function EmployeeReport() {
  const token = Cookies.get("accessToken");

  // filters
  const [search, setSearch] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [designationId, setDesignationId] = useState("");

  // lists
  const [organizations, setOrganizations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  // data
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // export modal
  const [showExport, setShowExport] = useState(false);
  const [selectedCols, setSelectedCols] = useState([...EXPORTABLE_FIELDS]);

  /** Load Organizations */
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (data?.success) {
          setOrganizations(
            data.data.map((org) => ({
              value: org.id,
              label: org.organization_name,
            })),
          );
        }
      } catch (e) {
        console.error("Failed to fetch organizations", e);
      }
    };
    fetchOrganizations();
  }, [token]);

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!organizationId) {
        setDepartments([]);
        return;
      }

      try {
        const { data } = await axios.get(
          `${API_URL}/v1/hris/organizations/departments`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { organization_id: organizationId }, //  pass org ID as query param
          },
        );

        if (data?.success && Array.isArray(data.data)) {
          setDepartments(
            data.data.map((d) => ({
              value: d.id,
              label: d.name,
              description: d.description,
            })),
          );
        } else {
          setDepartments([]);
        }
      } catch (e) {
        console.error("❌ Failed to fetch departments:", e);
        setDepartments([]);
      }
    };

    fetchDepartments();
  }, [token, organizationId]);

  useEffect(() => {
    const fetchDesignations = async () => {
      if (!organizationId) {
        setDesignations([]);
        return;
      }

      try {
        const { data } = await axios.get(
          `${API_URL}/v1/hris/organizations/designations`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { organization_id: organizationId }, //  pass org ID as param
          },
        );

        if (data?.success && Array.isArray(data.data)) {
          setDesignations(
            data.data.map((d) => ({
              value: d.id,
              label: `${d.title} — ${d.Department?.name || "No Dept"}`, // show department name inline
              departmentId: d.departmentId,
              departmentName: d.Department?.name,
            })),
          );
        } else {
          setDesignations([]);
        }
      } catch (e) {
        console.error("❌ Failed to fetch designations:", e);
        setDesignations([]);
      }
    };

    fetchDesignations();
  }, [token, organizationId]);

  /** Fetch employee data */
  const fetchData = async (query = search) => {
    setError("");
    try {
      const url = `${API_URL}/v1/hris/employees/getemployeebasicdetails-report`;
      const params = {
        search: query,
        organization: organizationId, //  Added organization filter
        department_id: departmentId,
        designation_id: designationId,
        page,
        limit,
      };
      const { data } = await axios.get(url, { params });
      if (data?.success) {
        const list = Array.isArray(data.data) ? data.data : [];
        setRows(list);
        const pg = data.pagination || {};
        setTotalRecords(pg.total ?? list.length);
        setTotalPages(pg.totalPages ?? 1);
      } else {
        setRows([]);
        setTotalRecords(0);
        setTotalPages(1);
        setError("Failed to load data");
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Request failed");
      setRows([]);
      setTotalRecords(0);
      setTotalPages(1);
    }
  };

  /** Debounced search */
  const debouncedSearch = useCallback(
    debounce((value) => {
      setPage(1);
      fetchData(value);
    }, 600),
    [organizationId, departmentId, designationId, limit],
  );

  useEffect(() => {
    fetchData();
  }, [page, limit, organizationId, departmentId, designationId]);

  /** Reset filters */
  const onReset = () => {
    setSearch("");
    setOrganizationId("");
    setDepartmentId("");
    setDesignationId("");
    setPage(1);
    setLimit(10);
    fetchData("");
  };

  /** EXPORT CSV */
  const handleExport = async () => {
    if (!selectedCols.length) return;
    try {
      const url = `${API_URL}/v1/hris/employees/getemployeebasicdetails-report`;
      const columnsParam = selectedCols.join(",");
      const bigLimit = totalRecords > 0 ? totalRecords : 10000;
      const params = {
        search,
        organization: organizationId, //  include organization
        department_id: departmentId,
        designation_id: designationId,
        columns: columnsParam,
        page: 1,
        limit: bigLimit,
      };
      const { data } = await axios.get(url, { params });
      const list = Array.isArray(data?.data) ? data.data : [];
      const header = selectedCols.map(labelize).join(",");
      const lines = list.map((row) =>
        selectedCols.map((k) => csvCell(row?.[k] ?? "")).join(","),
      );
      const csv = [header, ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const dlUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = dlUrl;
      a.download = "employee-report.csv";
      a.click();
      URL.revokeObjectURL(dlUrl);
      setShowExport(false);
    } catch (e) {
      console.error("Export failed", e);
    }
  };

  const toggleCol = (key) =>
    setSelectedCols((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  const selectAll = () => setSelectedCols([...EXPORTABLE_FIELDS]);
  const clearAll = () => setSelectedCols([]);

  return (
    <div className="mt-5 font-montserrat">
      <p className="text-[25px] my-5">Employee Report</p>
      {/* Filters */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* 🔍 Search */}
          <input
            className="border rounded px-3 py-2"
            placeholder="Search by name, employee no, EPF..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />

          {/* 🏢 Organization */}
          <Select
            options={organizations}
            placeholder="Select Organization"
            isClearable
            value={
              organizations.find((o) => o.value === Number(organizationId)) ||
              null
            }
            onChange={(opt) => setOrganizationId(opt ? opt.value : "")}
          />

          <Select
            options={departments}
            placeholder="Select Department"
            isClearable
            isDisabled={!organizationId} //  Disable if no organization selected
            value={
              departments.find((o) => o.value === Number(departmentId)) || null
            }
            onChange={(opt) => setDepartmentId(opt ? opt.value : "")}
          />

          <Select
            options={designations}
            placeholder="Select Designation"
            isClearable
            isDisabled={!organizationId} //  Disable if no organization selected
            value={
              designations.find((o) => o.value === Number(designationId)) ||
              null
            }
            onChange={(opt) => setDesignationId(opt ? opt.value : "")}
          />
        </div>

        <div className="flex flex-wrap gap-3 mt-4 items-center">
          <button
            className="px-4 py-2 border rounded hover:bg-gray-50"
            onClick={onReset}
          >
            Reset
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              className="px-4 py-2 bg-[#2495FE] text-white rounded"
              onClick={() => setShowExport(true)}
            >
              Export CSV
            </button>
            <span className="text-sm text-gray-600">Limit</span>
            <select
              className="border rounded px-2 py-2"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto bg-white rounded-lg border">
        <table className="w-full text-sm text-left">
          <thead className="bg-white text-gray-600 border-b border-t">
            <tr>
              <th className="p-3">Employee No</th>
              <th className="p-3">Employee Full Name</th>
              <th className="p-3">Designation</th>
              <th className="p-3">Department</th>
              <th className="p-3">Contact No</th>
              <th className="p-3">Branch</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-red-600">
                  {error}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-blue-600">{r.employee_no || "—"}</td>
                  <td className="p-3 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${avatarBgClass(
                        r.employee_fullname || "",
                      )}`}
                    >
                      {getInitials(r.employee_fullname || "")}
                    </div>
                    <div>{r.employee_fullname || "—"}</div>
                  </td>
                  <td className="p-3">{r.designation_name || "—"}</td>
                  <td className="p-3">{r.department_name || "—"}</td>
                  <td className="p-3">{r.employee_contact_no || "—"}</td>
                  <td className="p-3">{r.branch_name || "—"}</td>
                  <td className="p-3">{r.employee_active_status || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pager */}
      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <div>
          Showing page {page} of {totalPages} ({totalRecords} records)
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Select Columns to Export
              </h3>
              <button
                className="px-3 py-1 rounded hover:bg-gray-100"
                onClick={() => setShowExport(false)}
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <button
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                  onClick={selectAll}
                >
                  Select All
                </button>
                <button
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                  onClick={clearAll}
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {EXPORTABLE_FIELDS.map((key) => (
                  <label
                    key={key}
                    className="flex items-center gap-2 text-sm bg-gray-100 p-1 rounded-md text-black"
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={selectedCols.includes(key)}
                      onChange={() => toggleCol(key)}
                    />
                    <span>{labelize(key)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 border-t flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 border rounded hover:bg-gray-50"
                onClick={() => setShowExport(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-[#2495FE] text-white rounded hover:opacity-90"
                onClick={handleExport}
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
