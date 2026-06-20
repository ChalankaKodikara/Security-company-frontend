import React, { useEffect, useState, useRef } from "react";
import Select from "react-select";
import { AiOutlineClose } from "react-icons/ai";
import Cookies from "js-cookie";
import Logo from "../../../assets/logo.jpeg";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const RequestPayslip = () => {
    const [employees, setEmployees] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchFilter, setSearchFilter] = useState("");
    const [organizationOptions, setOrganizationOptions] = useState([]);
    const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState("");
    const [components, setComponents] = useState([]);
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalRecords, setTotalRecords] = useState(0);
    const [employeePayroll, setEmployeePayroll] = useState(null);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmployeeLoading, setIsEmployeeLoading] = useState(false);

    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const payslipRef = useRef(null);

    const handleDownloadPDF = async () => {
        const element = payslipRef.current;

        if (!element || !employeePayroll) {
            alert("Please open a payslip before downloading.");
            return;
        }

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: "#ffffff",
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;
            let position = 0;

            pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);

            while (imgHeight + position > pdfHeight) {
                position -= pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
            }

            pdf.save(
                `Payslip-${employeePayroll.employee_no || selectedEmployee?.employee_no || "employee"}.pdf`
            );
        } catch (error) {
            console.error("Download PDF failed:", error);
            alert("Unable to download payslip as PDF. Check the console for details.");
        }
    };

    useEffect(() => {
        const fetchOrganizations = async () => {
            try {
                const authToken = Cookies.get("accessToken");

                const res = await fetch(`${API_URL}/v1/hris/organizations/organization`, {
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
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
            } catch (error) {
                console.error("Failed to fetch organizations", error);
            }
        };

        fetchOrganizations();
    }, [API_URL]);

    useEffect(() => {
        const fetchComponents = async () => {
            try {
                const authToken = Cookies.get("accessToken");

                const response = await fetch(`${API_URL}/v1/hris/payroll/columns`, {
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                });

                const data = await response.json();

                if (Array.isArray(data)) {
                    setComponents(
                        data.map((comp) => ({
                            value: comp.suggested_name,
                            label: comp.suggested_name,
                        }))
                    );
                } else {
                    setComponents([]);
                }
            } catch (error) {
                console.error("Error fetching components:", error);
                setComponents([]);
            }
        };

        fetchComponents();
    }, [API_URL]);

    useEffect(() => {
        const fetchEmployeesData = async () => {
            setIsLoading(true);

            try {
                const authToken = Cookies.get("accessToken");

                const params = new URLSearchParams({
                    page: currentPage,
                    limit: itemsPerPage,
                });

                if (searchFilter.trim()) {
                    params.append("search", searchFilter.trim());
                }

                if (selectedOrganizationFilter) {
                    params.append("organization", selectedOrganizationFilter);
                }

                const response = await fetch(
                    `${API_URL}/v1/hris/payroll/getallwithname?${params.toString()}`,
                    {
                        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                    }
                );

                const data = await response.json();

                if (data.success && Array.isArray(data.data)) {
                    setEmployees(data.data);
                    setTotalRecords(data.totalRecords || data.data.length);
                } else {
                    setEmployees([]);
                    setTotalRecords(0);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
                setEmployees([]);
                setTotalRecords(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEmployeesData();
    }, [API_URL, currentPage, searchFilter, selectedOrganizationFilter, itemsPerPage]);

    useEffect(() => {
        const employeesToFilter = Array.isArray(employees) ? employees : [];

        if (
            selectedComponents.length === 0 ||
            selectedComponents.some((comp) => comp.value === "All")
        ) {
            setFilteredData(employeesToFilter);
        } else {
            const filtered = employeesToFilter.filter((employee) => {
                const employeeComponents = [
                    ...(Array.isArray(employee.allowances) ? employee.allowances : []),
                    ...(Array.isArray(employee.deductions) ? employee.deductions : []),
                ].filter(Boolean);

                return selectedComponents.some((selectedComp) =>
                    employeeComponents.some(
                        (comp) => comp.suggested_name === selectedComp.value
                    )
                );
            });

            setFilteredData(filtered);
        }

        setCurrentPage(1);
    }, [employees, selectedComponents]);

    const handleEmployeeDetails = async (employee_no) => {
        setIsEmployeeLoading(true);

        const selected = employees.find((emp) => emp.employee_no === employee_no) || null;
        setSelectedEmployee(selected || { employee_no, employee_fullname: "" });

        try {
            const authToken = Cookies.get("accessToken");

            const response = await fetch(
                `${API_URL}/v1/hris/payroll/getallbyemployee?employee_no=${employee_no}`,
                {
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                setEmployeePayroll(data.data || null);
                setShowModal(true);
            } else {
                throw new Error(data.message || "Unable to load salary slip");
            }
        } catch (error) {
            console.error("Error fetching salary slip:", error);
            alert("Failed to load salary slip. Please try again.");
        } finally {
            setIsEmployeeLoading(false);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        setEmployeePayroll(null);
        setSelectedEmployee(null);
    };

    const formatMoney = (value) => Number(value || 0).toFixed(2);

    const InfoRow = ({ label, value }) => (
        <div className="grid grid-cols-[150px_10px_1fr]">
            <span>{label}</span>
            <span>:</span>
            <span>{value}</span>
        </div>
    );

    const SlipSection = ({ title, children }) => (
        <div className="w-[380px] mb-7">
            <h3 className="font-bold mb-2">{title}</h3>
            <div className="space-y-1">{children}</div>
        </div>
    );

    const MoneyRow = ({ label, value, plus = false, bold = false }) => (
        <div className={`grid grid-cols-[190px_30px_1fr] ${bold ? "font-bold" : ""}`}>
            <span>{label}</span>
            <span>{plus ? "+" : ""}</span>
            <span className="text-right">{formatMoney(value)}</span>
        </div>
    );

    const displayedTotalPages = Math.max(
        1,
        Math.ceil((filteredData.length || 0) / itemsPerPage)
    );

    const currentDisplayedData = Array.isArray(filteredData)
        ? filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        : [];

    const totalAllowance = Object.values(employeePayroll?.allowances || {}).reduce(
        (sum, allowance) => sum + parseFloat(allowance.value || 0),
        0
    );

    const totalDeduction = Object.values(employeePayroll?.deductions || {}).reduce(
        (sum, deduction) => sum + parseFloat(deduction.value || 0),
        0
    );

    const netSalary =
        parseFloat(employeePayroll?.basic_salary || 0) + totalAllowance - totalDeduction;

    return (
        <div className="mx-5 mt-5">
            <p className="text-[24px]">Payroll Navigation / Request Payslip</p>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                        Search Employee
                    </label>
                    <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Enter Employee ID or Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-200"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                        Organization
                    </label>
                    <Select
                        options={organizationOptions}
                        value={
                            organizationOptions.find(
                                (opt) => opt.value === selectedOrganizationFilter
                            ) || null
                        }
                        onChange={(opt) => setSelectedOrganizationFilter(opt ? opt.value : "")}
                        isClearable
                        placeholder="Select Organization"
                    />
                </div>

                <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                        Salary Component
                    </label>
                    <Select
                        options={[{ value: "All", label: "All Components" }, ...components]}
                        isMulti
                        value={selectedComponents}
                        onChange={setSelectedComponents}
                        placeholder="Select Components"
                    />
                </div>
            </div>

            <div className="mt-5 overflow-x-auto bg-white shadow-lg p-2 rounded-md">
                <table className="w-full border-collapse text-left text-sm text-gray-500">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-2 font-medium text-gray-900">Employee ID</th>
                            <th className="px-6 py-2 font-medium text-gray-900">Employee Name</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                        {isLoading ? (
                            <tr>
                                <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                                    Loading employees...
                                </td>
                            </tr>
                        ) : currentDisplayedData.length === 0 ? (
                            <tr>
                                <td colSpan="2" className="px-6 py-4 text-center text-gray-500">
                                    No employees found matching the filters.
                                </td>
                            </tr>
                        ) : (
                            currentDisplayedData.map((employee) => (
                                <tr
                                    key={employee.employee_no}
                                    className="hover:bg-blue-50 cursor-pointer"
                                    onClick={() => handleEmployeeDetails(employee.employee_no)}
                                >
                                    <td className="px-6 py-3 font-medium text-gray-900">
                                        {employee.employee_no}
                                    </td>
                                    <td className="px-6 py-3 text-gray-700">
                                        {employee.employee_fullname || "N/A"}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1 || isLoading}
                >
                    Previous
                </button>

                <p>
                    Page {currentPage} of {displayedTotalPages} Total Records: {totalRecords}
                </p>

                <button
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, displayedTotalPages))
                    }
                    disabled={currentPage === displayedTotalPages || isLoading}
                >
                    Next
                </button>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
                    <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-auto shadow-xl p-10">
                        <div className="relative text-[12px] text-black bg-white">
                            <AiOutlineClose
                                className="absolute right-0 top-0 cursor-pointer text-2xl z-10"
                                onClick={handleClose}
                            />

                            <button
                                onClick={handleDownloadPDF}
                                className="absolute right-10 top-0 z-10 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Download PDF
                            </button>

                            <div
                                ref={payslipRef}
                                className="relative min-h-[520px] text-[12px] text-black bg-white p-6"
                            >
                                <img
                                    src={Logo}
                                    alt="MMG Watermark"
                                    className="absolute inset-0 m-auto w-72 opacity-15 pointer-events-none"
                                />

                                <div className="mb-10 flex items-center gap-20">
                                    <img
                                        src={Logo}
                                        alt="MMG Logo"
                                        className="w-[250px] h-auto"
                                    />
                                </div>

                                {isEmployeeLoading ? (
                                    <div className="py-20 text-center text-gray-600">
                                        Loading salary slip...
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-20 mb-10">
                                            <div className="space-y-1">
                                                <InfoRow label="Payment Month" value="January 2026" />
                                                <InfoRow
                                                    label="Employee Number"
                                                    value={
                                                        employeePayroll?.employee_no ||
                                                        selectedEmployee?.employee_no ||
                                                        "N/A"
                                                    }
                                                />
                                                
                                            </div>

                                            <div className="space-y-1">
                                                <InfoRow
                                                    label="Employee Name"
                                                    value={
                                                        employeePayroll?.employee_fullname ||
                                                        selectedEmployee?.employee_fullname ||
                                                        "N/A"
                                                    }
                                                />
                                                <InfoRow
                                                    label="Work Location"
                                                    value={employeePayroll?.work_location || "Direct"}
                                                />
                                            </div>
                                        </div>

                                        <SlipSection title="Basic Salary">
                                            <MoneyRow
                                                label="Basic Salary"
                                                value={employeePayroll?.basic_salary}
                                            />
                                        </SlipSection>

                                        <SlipSection title="Allowances">
                                            {Object.values(employeePayroll?.allowances || {}).length ===
                                            0 ? (
                                                <div className="text-sm text-gray-600">
                                                    No allowances found
                                                </div>
                                            ) : (
                                                Object.values(employeePayroll.allowances).map(
                                                    (allowance, index) => (
                                                        <MoneyRow
                                                            key={`allowance-${index}`}
                                                            label={
                                                                allowance.suggested_name ||
                                                                `Allowance ${index + 1}`
                                                            }
                                                            value={allowance.value}
                                                            plus
                                                        />
                                                    )
                                                )
                                            )}
                                        </SlipSection>

                                        <SlipSection title="Deductions">
                                            {Object.values(employeePayroll?.deductions || {}).length ===
                                            0 ? (
                                                <div className="text-sm text-gray-600">
                                                    No deductions found
                                                </div>
                                            ) : (
                                                Object.values(employeePayroll.deductions).map(
                                                    (deduction, index) => (
                                                        <MoneyRow
                                                            key={`deduction-${index}`}
                                                            label={
                                                                deduction.suggested_name ||
                                                                `Deduction ${index + 1}`
                                                            }
                                                            value={deduction.value}
                                                        />
                                                    )
                                                )
                                            )}
                                        </SlipSection>

                                        <div className="w-[380px] mb-7">
                                            <MoneyRow label="Total Allowance" value={totalAllowance} />
                                            <MoneyRow label="Total Deduction" value={totalDeduction} />
                                            <MoneyRow label="Net Paid" value={netSalary} bold />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequestPayslip;