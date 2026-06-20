/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import { saveAs } from "file-saver";
import { MdOutlineFileDownload } from "react-icons/md";
import Select from "react-select";
import Cookies from "js-cookie";

const AbsenceReportSection = ({ selectedDate }) => {
    const [absenteeData, setAbsenteeData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [filterDate, setFilterDate] = useState(
        selectedDate || moment().format("YYYY-MM-DD")
    );
    const [employeeNo, setEmployeeNo] = useState("");
    const [departmentDesignationId, setDepartmentDesignationId] = useState("");
    const [workingOffice, setWorkingOffice] = useState("");
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const rowsPerPage = 10;
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    // 🔹 Fetch organizations
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const token = Cookies.get("accessToken");
                const res = await fetch(`${API_URL}/v1/hris/organizations/organization`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                    credentials: "include",
                });
                const json = await res.json();
                if (json.success && Array.isArray(json.data)) {
                    setOrganizationOptions(
                        json.data.map((org) => ({
                            value: org.id,
                            label: org.organization_name,
                        }))
                    );
                }
            } catch (err) {
                console.error("Failed to fetch organizations", err);
            }
        };

        fetchOrganizations();
    }, [API_URL]);

    // 🔹 Fetch absentee data
    useEffect(() => {
        const fetchAbsenteeData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    date: moment(filterDate).format("YYYY-MM-DD"),
                    page: currentPage,
                    limit: rowsPerPage,
                });

                if (employeeNo) params.append("search", employeeNo);
                if (departmentDesignationId)
                    params.append("department_designation_id", departmentDesignationId);
                if (workingOffice) params.append("working_office", workingOffice);
                if (selectedOrganization)
                    params.append("organization", selectedOrganization);

                const response = await fetch(
                    `${API_URL}/v1/hris/new-attendence/absentees?${params.toString()}`
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                setAbsenteeData(result.data || []);
                setTotalPages(result.totalPages || 0);
                setTotalRecords(result.total || 0);
            } catch (err) {
                setError(err.message);
                setAbsenteeData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchAbsenteeData();
    }, [
        filterDate,
        currentPage,
        employeeNo,
        departmentDesignationId,
        workingOffice,
        selectedOrganization,
    ]);

    // 🔹 Avatar helpers
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
        const first = tokens[0][0] || "";
        const last = tokens[tokens.length - 1][0] || "";
        return (first + last).toUpperCase();
    };

    // 🔹 CSV Export
    const exportToCSV = async () => {
        if (totalRecords === 0) {
            alert("No data available to export.");
            return;
        }

        setIsExporting(true);

        try {
            const params = new URLSearchParams({
                date: moment(filterDate).format("YYYY-MM-DD"),
            });
            if (employeeNo) params.append("search", employeeNo);
            if (departmentDesignationId)
                params.append("department_designation_id", departmentDesignationId);
            if (workingOffice) params.append("working_office", workingOffice);
            if (selectedOrganization)
                params.append("organization", selectedOrganization);

            const response = await fetch(
                `${API_URL}/v1/hris/new-attendence/absentees?${params.toString()}`
            );
            if (!response.ok) {
                throw new Error("Failed to fetch full data for export.");
            }
            const result = await response.json();
            const allData = result.data || [];

            if (allData.length === 0) {
                alert("No data found for the selected filters.");
                return;
            }

            const headers = [
                "Employee No",
                "Employee Name",
                "Calling Name",
                "Department Designation ID",
                "Working Office",
                "Branch",
            ];
            const csvRows = [headers.join(",")];

            for (const row of allData) {
                const values = [
                    row.employee_no,
                    row.employee_fullname,
                    row.employee_calling_name,
                    row.department_designation_id,
                    row.working_office,
                    row.branch,
                ].map((value) => `"${String(value || "N/A").replace(/"/g, '""')}"`);
                csvRows.push(values.join(","));
            }

            const csvString = csvRows.join("\n");
            const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
            saveAs(blob, `absentee_report_${moment().format("YYYY-MM-DD")}.csv`);
        } catch (err) {
            console.error("CSV Export Error:", err);
            alert("An error occurred while exporting the data.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mt-5 overflow-y-auto font-montserrat">
            <p className="text-[25px]">Absence Report</p>
            <div className="p-5 rounded-xl">
                {/* 🔹 Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700">Date</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full mt-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="self-end">
                        <input
                            type="text"
                            placeholder="Search by Employee Name..."
                            value={employeeNo}
                            onChange={(e) => setEmployeeNo(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="self-end">
                        <input
                            type="text"
                            placeholder="Filter by Dept/Designation ID..."
                            value={departmentDesignationId}
                            onChange={(e) => setDepartmentDesignationId(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="self-end">
                        <input
                            type="text"
                            placeholder="Filter by Working Office..."
                            value={workingOffice}
                            onChange={(e) => setWorkingOffice(e.target.value)}
                            className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="self-end">
                        <Select
                            options={organizationOptions}
                            placeholder="Select Organization"
                            value={
                                organizationOptions.find(
                                    (opt) => opt.value === Number(selectedOrganization)
                                ) || null
                            }
                            onChange={(opt) =>
                                setSelectedOrganization(opt ? opt.value : "")
                            }
                            isClearable
                            className="basic-single"
                            classNamePrefix="select"
                        />
                    </div>
                </div>

                {/* 🔹 Table */}
                <div className="overflow-x-auto bg-white shadow rounded-xl">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-gray-600 border-b border-t">
                            <tr>
                                <th className="px-6 py-4">Employee No</th>
                                <th className="px-6 py-4">Employee Name</th>
                                <th className="px-6 py-4">Calling Name</th>
                                <th className="px-6 py-4">Dept/Designation ID</th>
                                <th className="px-6 py-4">Working Office</th>
                                <th className="px-6 py-4">Branch</th>
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
                            ) : absenteeData.length > 0 ? (
                                absenteeData.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-blue-600">{row.employee_no}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${avatarBgClass(
                                                        row.employee_fullname || row.employee_no
                                                    )}`}
                                                >
                                                    {getInitials(row.employee_fullname || row.employee_no)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold">
                                                        {row.employee_fullname}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        EMP ID: {row.employee_no}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-3">{row.employee_calling_name || "N/A"}</td>
                                        <td className="p-3">
                                            {row.department_designation_id || "N/A"}
                                        </td>
                                        <td className="p-3">{row.working_office || "N/A"}</td>
                                        <td className="p-3">{row.branch || "N/A"}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="text-center py-4 text-gray-500"
                                    >
                                        No data found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* 🔹 Pagination */}
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-gray-700">
                        Showing{" "}
                        {totalRecords > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0} to{" "}
                        {Math.min(currentPage * rowsPerPage, totalRecords)} of{" "}
                        {totalRecords} results
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1 || loading}
                            className="px-4 py-2 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-sm text-gray-700">
                            Page {currentPage} of {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={
                                currentPage === totalPages || totalPages === 0 || loading
                            }
                            className="px-4 py-2 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>

                {/* 🔹 Export */}
                <div className="flex justify-start mt-4">
                    <button
                        onClick={exportToCSV}
                        disabled={isExporting}
                        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 flex items-center gap-2 disabled:opacity-50"
                    >
                        <MdOutlineFileDownload size={20} />
                        <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AbsenceReportSection;
