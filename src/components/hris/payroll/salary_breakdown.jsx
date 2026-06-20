import React, { useState, useEffect } from "react";
import Select from "react-select";
import { AiOutlineClose } from "react-icons/ai";
import Cookies from "js-cookie";

const SalaryBreakdown = () => {
  const [employees, setEmployees] = useState([]); // Stores data fetched from backend (paginated, searched, org-filtered)
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filteredData, setFilteredData] = useState([]); // Stores data after client-side component filtering

  // Filter states (for backend API)
  const [searchFilter, setSearchFilter] = useState("");
  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [selectedOrganizationFilter, setSelectedOrganizationFilter] = useState("");

  // Filter states (for client-side)
  const [components, setComponents] = useState([]); // All available components for the multi-select
  const [selectedComponents, setSelectedComponents] = useState([]); // Selected components for client-side filtering

  // Pagination states from API response
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [employeePayroll, setEmployeePayroll] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // For loading indicator

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [currency, setCurrency] = useState(Cookies.get("currency") || "LKR");
  const [symbol, setSymbol] = useState(Cookies.get("symbol") || "LKR");

  useEffect(() => {
    setCurrency(Cookies.get("currency") || "LKR");
    setSymbol(Cookies.get("symbol") || "Rs");
  }, []);

  // Fetch Organizations for dropdown
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
      } catch (err) {
        console.error("Failed to fetch organizations", err);
      }
    };
    fetchOrganizations();
  }, [API_URL]);

  // Fetch all available salary components for the multi-select filter
  useEffect(() => {
    const fetchComponents = async () => {
      try {
        const authToken = Cookies.get("accessToken");
        const response = await fetch(`${API_URL}/v1/hris/payroll/columns`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        });
        if (!response.ok) {
          throw new Error("Failed to fetch components");
        }
        const data = await response.json();
        const options = data.map((comp) => ({
          value: comp.suggested_name, // Use suggested_name for multi-select filtering
          label: comp.suggested_name,
        }));
        setComponents(options);
      } catch (error) {
        console.error("Error fetching components:", error);
        setComponents([]);
      }
    };

    fetchComponents();
  }, [API_URL]);

  // Main Effect: Fetch Employees with server-side filters (Search, Organization, Pagination)
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
          `${API_URL}/v1/hris/payroll/getallwithname?${params.toString()}`, // Endpoint with search, organization, pagination
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`Error fetching employee data: ${response.statusText}`);
        }
        const data = await response.json();

        // Assuming data.data, data.totalRecords, data.totalPages are returned by the API
        if (data.data && Array.isArray(data.data)) {
          setEmployees(data.data || []); // Raw data from API (already paginated, searched, org-filtered)
          setTotalRecords(data.totalRecords || data.data.length);
          setTotalPages(data.totalPages || 1);
        } else {
          setEmployees([]);
          setTotalRecords(0);
          setTotalPages(1);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setEmployees([]);
        setTotalRecords(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEmployeesData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, currentPage, searchFilter, selectedOrganizationFilter]); // Rerun when these filters/page change


  // Client-side Effect: Filter `employees` by `selectedComponents`
  useEffect(() => {
    // Ensure employees is an array before filtering
    const employeesToFilter = Array.isArray(employees) ? employees : [];

    if (selectedComponents.length === 0 || selectedComponents.some(comp => comp.value === "All")) {
      setFilteredData(employeesToFilter); // Show all if no components selected or "All" is chosen
    } else {
      const filtered = employeesToFilter.filter((employee) => {
        // Concatenate allowances and deductions to check against selected components
        const employeeComponents = [
          ...(Array.isArray(employee.allowances) ? employee.allowances : []),
          ...(Array.isArray(employee.deductions) ? employee.deductions : []),
        ].filter(Boolean); // Filter out any null/undefined entries

        return selectedComponents.some((selectedComp) =>
          employeeComponents.some((comp) => comp.suggested_name === selectedComp.value)
        );
      });
      setFilteredData(filtered);
    }
    setCurrentPage(1); // Reset to first page when client-side filters change
  }, [selectedComponents, employees]); // Rerun when components selected or backend data changes


  // Handler for applying filters (only triggers backend fetch)
  const handleApplyFilters = () => {
    setCurrentPage(1); // Reset to first page for new backend search/filters
    // The useEffect for fetchEmployeesData will be triggered by currentPage, searchFilter, selectedOrganizationFilter changes
  };

  const handleEmployeeDetails = async (employee_no) => {
    const selected = employees.find((emp) => emp.employee_no === employee_no);
    if (!selected) {
      alert("Employee not found!");
      return;
    }

    setSelectedEmployee(selected);
    try {
      const authToken = Cookies.get("accessToken");
      const response = await fetch(
        `${API_URL}/v1/hris/payroll/getallbyemployee?employee_no=${employee_no}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEmployeePayroll(data.data); // Extract the data property from response
        setShowModal(true);
      } else {
        alert("Failed to fetch employee details. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching employee details:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setEmployeePayroll(null);
  };

  // Pagination logic for displayed data (client-side filteredData)
  const displayedTotalPages = Math.ceil((Array.isArray(filteredData) ? filteredData.length : 0) / itemsPerPage);
  const currentDisplayedData = (Array.isArray(filteredData) ? filteredData : []).slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="mx-5 mt-5">
      <p className="text-[24px]">Payroll Navigation / Salary Breakdown</p>

      {/* Filters */}
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
            onChange={(opt) =>
              setSelectedOrganizationFilter(opt ? opt.value : "")
            }
            isClearable
            placeholder="Select Organization"
            className="basic-single"
            classNamePrefix="select"
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
            className="basic-multi-select"
            classNamePrefix="select"
          />
        </div>
{/* 
        <div className="flex items-end">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-full"
            onClick={handleApplyFilters}
            disabled={isLoading}
          >
            Apply Filters
          </button>
        </div> */}
      </div>

      {/* Employee Table */}
      <div className="mt-5 overflow-x-auto bg-white shadow-lg p-2 rounded-md">
        <table className="w-full border-collapse  text-left text-sm text-gray-500">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-2 font-medium text-gray-900">ID</th>
              <th className="px-6 py-2 font-medium text-gray-900">Employee</th>
              <th className="px-6 py-2 font-medium text-gray-900">
                Available Salary Components
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  Loading employees...
                </td>
              </tr>
            ) : currentDisplayedData.length === 0 ? (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-gray-500">
                  No employees found matching the filters.
                </td>
              </tr>
            ) : (
              currentDisplayedData.map((employee) => (
                <tr
                  key={employee.employee_no}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleEmployeeDetails(employee.employee_no)}
                >
                  <td className="px-6 py-2">{employee.employee_no}</td>
                  <td className="px-6 py-2">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.employee_fullname || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {employee.employee_email || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-2">
                    <div className="flex flex-wrap gap-2">
                      {(Array.isArray(employee.allowances) ? employee.allowances : [])
                        .filter((allowance) => allowance)
                        .map((allowance, index) => (
                          <span
                            key={`allowance-${index}`}
                            className="px-2 py-1 rounded bg-green-100 text-green-600"
                          >
                            {allowance.suggested_name}
                          </span>
                        ))}
                      {(Array.isArray(employee.deductions) ? employee.deductions : [])
                        .filter((deduction) => deduction)
                        .map((deduction, index) => (
                          <span
                            key={`deduction-${index}`}
                            className="px-2 py-1 rounded bg-red-100 text-red-600"
                          >
                            {deduction.suggested_name}
                          </span>
                        ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1 || isLoading}
        >
          Previous
        </button>
        <p>
          Page {currentPage} of {displayedTotalPages} (Total Records: {totalRecords})
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

      {/* Modal */}
      {showModal && employeePayroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div
            className="bg-white rounded-lg p-5 w-[1200px] h-[80%] overflow-auto"
          >
            <div className="flex justify-end">
              <AiOutlineClose
                className="cursor-pointer text-2xl"
                onClick={handleClose}
              />
            </div>
            <div>
              <div className="flex justify-center">
                <h2 className="text-xl font-bold">Employee Salary Breakdown</h2>
              </div>
            </div>
            <div className="flex items-center mt-10">
              <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                {selectedEmployee?.employee_fullname
                  ?.split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase() || "??"}
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium text-gray-900">
                  {selectedEmployee?.employee_fullname || "N/A"}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedEmployee?.employee_email || "N/A"}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 mt-10">
              <div className="border border-gray-300 p-5 rounded-xl shadow-lg">
                <div className="mb-4">
                  <h3 className="font-semibold text-green-600 bg-green-200 w-fit px-4 py-2 rounded-lg">
                    Payroll Allowance
                  </h3>
                </div>
                <div className="space-y-4">
                  {employeePayroll?.allowances &&
                    Object.values(employeePayroll.allowances).map(
                      (allowance, index) => (
                        <div
                          key={`allowance-${index}`}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <label className="block text-gray-700 mb-1">
                              Component Name
                            </label>
                            <input
                              className="border border-gray-300 p-2 rounded-lg w-full"
                              value={allowance.suggested_name || "N/A"}
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 mb-1">
                              Amount
                            </label>
                            <input
                              className="border border-gray-300 p-2 rounded-lg w-full"
                              value={`${symbol} ${allowance.value || 0}`}
                              readOnly
                            />
                          </div>
                        </div>
                      )
                    )}
                </div>
                <div className="mt-4 font-semibold text-lg flex justify-between">
                  <p>Total Allowance</p>
                  <p>
                    : {symbol}
                    {Object.values(employeePayroll.allowances || {}).reduce(
                      (sum, a) => sum + parseFloat(a.value || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
              <div className="border border-gray-300 p-5 rounded-xl shadow-lg">
                <div className="mb-4">
                  <h3 className="font-semibold text-red-600 bg-red-200 w-fit px-4 py-2 rounded-lg">
                    Payroll Deduction
                  </h3>
                </div>
                <div className="space-y-4">
                  {employeePayroll?.deductions &&
                    Object.values(employeePayroll.deductions).map(
                      (deduction, index) => (
                        <div
                          key={`deduction-${index}`}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div>
                            <label className="block text-gray-700 mb-1">
                              Component Name
                            </label>
                            <input
                              className="border border-gray-300 p-2 rounded-lg w-full"
                              value={deduction.suggested_name || "N/A"}
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block text-gray-700 mb-1">
                              Amount
                            </label>
                            <input
                              className="border border-gray-300 p-2 rounded-lg w-full"
                              value={`${symbol} ${deduction.value || 0}`}
                              readOnly
                            />
                          </div>
                        </div>
                      )
                    )}
                </div>
                <div className="mt-4 font-semibold text-lg flex justify-between">
                  <p>Total Deduction</p>
                  <p>
                    : {symbol}{" "}
                    {Object.values(employeePayroll.deductions || {}).reduce(
                      (sum, d) => sum + parseFloat(d.value || 0),
                      0
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <div className="p-5 rounded-lg shadow-lg bg-white w-[350px]">
                <div className="text-gray-600 flex justify-between">
                  <span>Basic Salary:</span>
                  <span className="text-gray-500">
                    {`${symbol}${employeePayroll?.basic_salary || 0}`}
                  </span>
                </div>
                <div className="text-gray-600 flex justify-between mt-2">
                  <span>Total Allowance:</span>
                  <span className="text-green-600 font-bold">
                    {`${symbol}${Object.values(
                      employeePayroll?.allowances || {}
                    ).reduce(
                      (sum, allowance) =>
                        sum + parseFloat(allowance.value || 0),
                      0
                    )}`}
                  </span>
                </div>
                <div className="text-gray-600 flex justify-between mt-2">
                  <span>Total Deduction:</span>
                  <span className="text-red-600 font-bold">
                    {`${symbol}${Object.values(
                      employeePayroll?.deductions || {}
                    ).reduce(
                      (sum, deduction) =>
                        sum + parseFloat(deduction.value || 0),
                      0
                    )}`}
                  </span>
                </div>
                <div className="text-black flex justify-between font-bold text-lg mt-3 border-t pt-3">
                  <span>Net Salary:</span>
                  <span className="text-black font-bold">
                    {`${symbol}${
                      parseFloat(employeePayroll?.basic_salary || 0) +
                      Object.values(employeePayroll?.allowances || {}).reduce(
                        (sum, allowance) =>
                          sum + parseFloat(allowance.value || 0),
                        0
                      ) -
                      Object.values(employeePayroll?.deductions || {}).reduce(
                        (sum, deduction) =>
                          sum + parseFloat(deduction.value || 0),
                        0
                      )
                    }`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryBreakdown;