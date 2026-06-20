import React, { useEffect, useState } from 'react';
import {  FaCheck } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import axios from 'axios';
import 'react-toastify/dist/ReactToastify.css';
import { IoEyeOutline } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import Cookies from "js-cookie";
import Select from 'react-select'; // Import react-select

const LoanReimbursementTable = () => {
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const token = Cookies.get("accessToken"); // Get auth token

    const [data, setData] = useState([]);
    const [searchId, setSearchId] = useState(''); // Used for general search (employee_no, name)
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState(null);
    const [loanTypeFilter, setLoanTypeFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All');
    const [loanTypes, setLoanTypes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedReimbursement, setSelectedReimbursement] = useState(null);
    const [adminRemark, setAdminRemark] = useState('');
    const [actionType, setActionType] = useState('approved'); // or 'rejected'
    const navigate = useNavigate();

    const handleViewClick = (id) => {
        navigate(`/reimbursement-application/${id}`, { state: { viewOnly: true } });
    };

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchId, selectedOrganizationFilter, loanTypeFilter, statusFilter]);

    // Fetch main data
    useEffect(() => {
        fetchData();
    }, [searchId, selectedOrganizationFilter, loanTypeFilter, statusFilter, currentPage, limit, API_URL, token]);

    const fetchData = async () => {
        try {
            const params = {
                page: currentPage,
                limit,
            };

            if (searchId) params.search = searchId; // General search
            if (selectedOrganizationFilter) params.organization = selectedOrganizationFilter.value;
            if (loanTypeFilter !== 'All') params.loan_type = loanTypeFilter;
            if (statusFilter !== 'All') params.status = statusFilter.toLowerCase();

            const res = await axios.get(`${API_URL}/v1/hris/reimbursement-application/applications`, {
                params,
                headers: {
                    Authorization: `Bearer ${token}`, // Include auth token
                },
            });

            const { data: responseData, totalCount: count } = res.data;

            setData(Array.isArray(responseData) ? responseData : []);
            setTotalCount(count || 0);
            setTotalPages(Math.ceil((count || 0) / limit));
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        }
    };

    // Fetch Organizations
    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const res = await axios.get(`${API_URL}/v1/hris/organizations/organization`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (res.data.success && Array.isArray(res.data.data)) {
                    setOrganizationOptions(res.data.data.map(org => ({
                        value: org.id,
                        label: org.organization_name
                    })));
                }
            } catch (error) {
                console.error('Error fetching organizations:', error);
                toast.error('Failed to load organizations');
            }
        };
        fetchOrganizations();
    }, [API_URL, token]);

    // Fetch Loan Types (now dependent on selected organization)
    useEffect(() => {
        const fetchLoanTypes = async () => {
            if (!selectedOrganizationFilter) {
                setLoanTypes(['All']); // Clear if no organization selected
                setLoanTypeFilter('All'); // Reset loan type filter
                return;
            }

            try {
                const res = await axios.get(`${API_URL}/v1/hris/organizations/loan-types`, {
                    params: { organizationId: selectedOrganizationFilter.value }, // Pass organization ID
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const options = res.data.map((item) => item.name);
                setLoanTypes(['All', ...options]); // prepend "All" option
            } catch (error) {
                console.error('Error fetching loan types:', error);
                toast.error('Failed to load loan types');
                setLoanTypes(['All']); // Fallback to 'All'
            }
        };

        fetchLoanTypes();
    }, [API_URL, token, selectedOrganizationFilter]); // Added selectedOrganizationFilter to dependencies


    const handlePageClick = (page) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            setCurrentPage(page);
        }
    };

    const handleApprove = async () => {
        try {
            if (!selectedReimbursement) return;

            await axios.put(
                `${API_URL}/v1/hris/reimbursement-application/update-status/${selectedReimbursement.id}`,
                {
                    status: actionType,
                    admin_remark: adminRemark || `${actionType === 'approved' ? 'Approved' : 'Rejected'} by admin`,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`, // Include auth token
                    },
                }
            );

            toast.success(`Reimbursement ${actionType === 'approved' ? 'approved' : 'rejected'} successfully.`);

            // Reset modal and refresh table
            setShowModal(false);
            setSelectedReimbursement(null);
            setAdminRemark('');
            fetchData();
        } catch (error) {
            toast.error('Failed to update reimbursement status.');
            console.error(error);
        }
    };

    return (
        <div className="mx-5 mt-5 font-montserrat">
            <p className="text-[24px] mb-8">
                Payroll Navigation / Reimbursement
            </p>
            <ToastContainer />
            <h2 className="text-xl font-semibold mb-4">Filters</h2> {/* Updated title */}

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex flex-col w-60">
                    <label className="text-sm text-gray-600 mb-1">Search Employee</label>
                    <input
                        type="text"
                        placeholder="ID or Name"
                        value={searchId}
                        onChange={(e) => setSearchId(e.target.value)}
                        className="border border-gray-300 p-2 rounded-md"
                    />
                </div>

                <div className="flex flex-col w-60">
                    <label className="text-sm text-gray-600 mb-1">Organization</label>
                    <Select
                        options={organizationOptions}
                        value={selectedOrganizationFilter}
                        onChange={(opt) => setSelectedOrganizationFilter(opt)}
                        isClearable
                        placeholder="Select Organization"
                        className="text-sm"
                        styles={{ menu: (base) => ({ ...base, zIndex: 50 }) }}
                    />
                </div>

                <div className="flex flex-col w-60">
                    <label className="text-sm text-gray-600 mb-1">Loan Type</label>
                    <select
                        value={loanTypeFilter}
                        onChange={(e) => setLoanTypeFilter(e.target.value)}
                        className="border border-gray-300 p-2 rounded-md"
                        disabled={!selectedOrganizationFilter} // Disable if no organization selected
                    >
                        {loanTypes.map((type, idx) => (
                            <option key={idx} value={type}>
                                {type}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col w-60">
                    <label className="text-sm text-gray-600 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 p-2 rounded-md"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Approved">Approved</option>
                        <option value="Pending">Pending</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                <div className="flex-grow flex justify-end items-end"> {/* Added items-end */}
                    <Link to="/reimbursement-application">
                        <button className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
                            Application Form
                        </button>
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto bg-white shadow rounded-lg mt-4"> {/* Added margin-top */}
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-gray-600 border-b">
                        <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Employee</th>
                            <th className="p-3">Loan Type</th>
                            <th className="p-3">Loan Amount</th>
                            <th className="p-3">Loan Duration<br />(in Months)</th>
                            <th className="p-3">Interest Rate (%)</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="text-center py-4">No data found.</td>
                            </tr>
                        ) : (
                            data.map((emp, idx) => (
                                <tr key={emp.id || idx} className="border-b hover:bg-gray-50"> {/* Using emp.id for key */}
                                    <td className="p-3 text-blue-600">{emp.employee_no}</td>
                                    <td className="p-3">
                                        <div className="font-semibold">{emp.employee_name || 'N/A'}</div>
                                        <div className="text-xs text-gray-500">EMP ID: {emp.employee_no || 'N/A'}</div>
                                    </td>
                                    <td className="p-3">{emp.loan_type || 'N/A'}</td>
                                    <td className="p-3">Rs. {parseFloat(emp.loan_amount || 0).toLocaleString()}</td>
                                    <td className="p-3">{emp.loan_duration_months || 'N/A'}</td>
                                    <td className="p-3">{emp.interest_rate ?? 'N/A'}%</td> {/* Used nullish coalescing */}
                                    <td className="p-3">
                                        <span
                                            className={`font-medium ${emp.status?.toLowerCase() === 'approved'
                                                ? 'text-green-500'
                                                : emp.status?.toLowerCase() === 'rejected'
                                                ? 'text-red-500'
                                                : 'text-orange-500' // Pending
                                                }`}
                                        >
                                            {emp.status ? emp.status.charAt(0).toUpperCase() + emp.status.slice(1) : 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-3 flex gap-3 items-center">
                                        {emp.status?.toLowerCase() === 'pending' && (
                                            <>
                                                <button
                                                    className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200"
                                                    onClick={() => {
                                                        setSelectedReimbursement(emp);
                                                        setActionType('approved');
                                                        setShowModal(true);
                                                    }}
                                                    title="Approve"
                                                >
                                                    <FaCheck />
                                                </button>

                                                <button
                                                    className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200 ml-2"
                                                    onClick={() => {
                                                        setSelectedReimbursement(emp);
                                                        setActionType('rejected');
                                                        setShowModal(true);
                                                    }}
                                                    title="Reject"
                                                >
                                                    ✖
                                                </button>
                                            </>
                                        )}

                                        <button
                                            className="p-2 bg-gray-200 rounded-md hover:bg-gray-300"
                                            onClick={() => handleViewClick(emp.id)}
                                            title="View Details"
                                        >
                                            <IoEyeOutline />
                                        </button>

                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {showModal && selectedReimbursement && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="bg-white rounded-md p-6 w-full max-w-md shadow-lg relative">
                            <button
                                className="absolute top-2 right-2 text-gray-500 hover:text-black"
                                onClick={() => setShowModal(false)}
                            >
                                &times;
                            </button>
                            <h2 className="text-xl font-semibold text-center mb-2 capitalize">
                                {actionType}?
                            </h2>
                            <p className="text-center text-gray-600 mb-4">
                                Are you sure you want to {actionType} this reimbursement?
                            </p>
                            <p className="text-center font-bold text-lg text-gray-800 mb-4">
                                {selectedReimbursement.employee_name}
                            </p>

                            <input
                                className="border border-gray-300 p-2 rounded-md w-full mb-4"
                                placeholder={`Add remark here`}
                                value={adminRemark}
                                onChange={(e) => setAdminRemark(e.target.value)}
                            />

                            <div className="flex justify-center gap-4">
                                <button
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
                                    onClick={() => setShowModal(false)}
                                >
                                    No
                                </button>
                                <button
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                                    onClick={handleApprove}
                                >
                                    Yes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * limit + 1} to{' '}
                    {Math.min(currentPage * limit, totalCount)} of {totalCount} entries
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => handlePageClick(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Previous
                    </button>
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => handlePageClick(i + 1)}
                            className={`px-3 py-1 rounded-md ${currentPage === i + 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                    <button
                        onClick={() => handlePageClick(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-md bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoanReimbursementTable;