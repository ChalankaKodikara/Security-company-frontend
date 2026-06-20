import React, { useState } from "react";
import { apiFetch } from "../../../utils/apiClient";
const ServiceChargeFetcher = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(30);
    const [employeeId, setEmployeeId] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [employeeName, setEmployeeName] = useState("");
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        setData(null);

        try {
            const queryParams = new URLSearchParams({
                page,
                limit,
                employee_id: employeeId,
                start_date: startDate,
                end_date: endDate,
                employee_name: employeeName,
            });

            const response = await apiFetch(`${API_URL}/v1/hris/serviceCharge/getServiceCharge?${queryParams}`);
            const result = await response.json();

            if (response.ok) {
                setData(result);
            } else {
                setError(result.message || "Failed to fetch data.");
            }
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("An error occurred while fetching data.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="mx-5 mt-5 font-montserrat">
            <p className="text-[24px] mb-5">Service Charge Fetcher</p>
            <div className="shadow-lg p-5 rounded-lg bg-white w-[65%]">
                <div>
                    <p className="text-[24px] mb-4">Enter Parameters</p>
                </div>

                {/* Input Fields */}
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Page
                        </label>
                        <input
                            type="number"
                            className="border border-gray-300 rounded px-3 py-2 w-64"
                            value={page}
                            onChange={(e) => setPage(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Limit
                        </label>
                        <input
                            type="number"
                            className="border border-gray-300 rounded px-3 py-2 w-64"
                            value={limit}
                            onChange={(e) => setLimit(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employee ID
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 rounded px-3 py-2 w-64"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            className="border border-gray-300 rounded px-3 py-2 w-64"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            className="border border-gray-300 rounded px-3 py-2 w-64"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employee Name
                        </label>
                        <input
                            type="text"
                            className="border border-gray-300 rounded px-3 py-2 w-64"
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                        />
                    </div>
                </div>

                {/* Generate Button */}
                <div className="flex items-center justify-end mt-5">
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                        {isLoading ? "Loading..." : "Generate"}
                    </button>
                </div>

                {/* Result Section */}
                <div className="mt-5">
                    {error && <p className="text-red-500">{error}</p>}
                    {data && data.success && (
                        <div className="mt-5">
                            <h3 className="text-lg font-bold mb-4">Service Charge Details:</h3>
                            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 font-medium text-gray-900">ID</th>
                                        <th className="px-6 py-3 font-medium text-gray-900">Employee ID</th>
                                        <th className="px-6 py-3 font-medium text-gray-900">Full Name</th>
                                        <th className="px-6 py-3 font-medium text-gray-900">Date</th>
                                        <th className="px-6 py-3 font-medium text-gray-900">Value</th>
                                        <th className="px-6 py-3 font-medium text-gray-900">Percentage</th>
                                        <th className="px-6 py-3 font-medium text-gray-900">Total Service Charge</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    <tr>
                                        <td className="px-6 py-4">{data.data.id}</td>
                                        <td className="px-6 py-4">{data.data.employee_id}</td>
                                        <td className="px-6 py-4">{data.data.employee_fullname}</td>
                                        <td className="px-6 py-4">{new Date(data.data.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">{data.data.value}</td>
                                        <td className="px-6 py-4">{data.data.percentage}%</td>
                                        <td className="px-6 py-4">{data.data.total_service_charge}</td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Pagination Info */}
                            <div className="mt-4">
                                <p>Total Records: {data.pagination.total}</p>
                                <p>Page {data.pagination.currentPage} of {data.pagination.totalPages}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceChargeFetcher;
