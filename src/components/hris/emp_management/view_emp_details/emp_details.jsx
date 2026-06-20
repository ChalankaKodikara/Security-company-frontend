/** @format */

import React, { useState, useEffect } from "react";
import { LuEye } from "react-icons/lu";
import { FaEdit } from "react-icons/fa";
import { MdOutlineFileDownload } from "react-icons/md";
import { CiSearch } from "react-icons/ci";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import Navigator from "./navigatorUpdate";
import Personal_DocEdit from "./personal_doc_edit";
import Personal_DetailsEdit from "./personal_details_Update";
import NextOfKingsEdit from "./next_of_kings_edit";
import Employment_DetailsEdit from "./employment_details_edit";
import Bank_DetailsEdit from "./bank_details_Edit";
import Personal_DocView from "./personal_doc_view";
import Personal_DetailsView from "./personal_details_view";
import NextOfKingsView from "./next_of_kings_view";
import Employment_DetailsView from "./employment_details_view";
import Bank_DetailsView from "./bank_details_view";
import Cookies from "js-cookie";

import { useSelector, useDispatch } from "react-redux";
import {
  saveEmployeeData,
  resetEmployeeState,
  updateEmployeeData,
} from "../../../../reducers/employeeSlice"; // Import saveEmployeeData

const EmployeeTable = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const dispatch = useDispatch();
  const employeeData = useSelector((state) => state.employee.employee_details);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [searchById, setSearchById] = useState("");
  const [searchByName, setSearchByName] = useState("");
  const [showExportPopup, setShowExportPopup] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const userId = Cookies.get("employee_no");
  const token = Cookies.get("accessToken");

  const [selectedEmployee, setSelectedEmployee] = useState({});
  const [selectedFields, setSelectedFields] = useState({
    ID: true,
    Employee: true,
    "Calling Name": true,
    NIC: true,
    Department: true,
    Designation: true,
    Phone: true,
  });
  const rowsPerPage = 18;
  // Toggle field selection
  const handleFieldChange = (field) => {
    setSelectedFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchSelectedEmployeeData = async (employeeNo) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/getemployeebyid?employee_no=${employeeNo}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      dispatch(saveEmployeeData(data)); // Save the selected employee data
      setSelectedEmployee(data);
      console.log("get data ", data);
    } catch (error) {
      console.error("Error fetching employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (employeeNo) => {
    setIsEditModalOpen(true);
    fetchSelectedEmployeeData(employeeNo);
  };

  const handleViewClick = (employeeNo) => {
    setIsViewModalOpen(true);
    fetchSelectedEmployeeData(employeeNo);
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState(""); // Error message state
  const [completedSteps, setCompletedSteps] = useState([]);

  // Handle export logic

  const handleExport = async () => {
    // Get selected columns
    const selectedColumns = Object.keys(selectedFields).filter(
      (field) => selectedFields[field]
    );

    // Create a new workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Employee Data");

    // Add header row
    worksheet.addRow(selectedColumns);

    // Map selected fields to employee data
    filteredEmployees.forEach((employee) => {
      const rowData = selectedColumns.map((field) => {
        switch (field) {
          case "ID":
            return employee.employee_no;
          case "Employee":
            return employee.employee_fullname;
          case "Calling Name":
            return employee.employee_calling_name;
          case "NIC":
            return employee.employee_nic;
          case "Department":
            return employee.department_name;
          case "Designation":
            return employee.designation_name;
          case "Phone":
            return employee.employee_contact_no;
          default:
            return "";
        }
      });
      worksheet.addRow(rowData);
    });

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFCCCCCC" },
      };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // Generate Excel file and trigger download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "EmployeeData.xlsx");

    setShowExportPopup(false); // Close popup after export
  };

  // Fetch employees data
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/employees/getemployeebasicdetails`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setEmployees(data);
        setFilteredEmployees(data);

        // Extract unique departments from the data
        const uniqueDepartments = [
          ...new Set(data.map((employee) => employee.department_name)),
        ];
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error("Error fetching employee data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // Apply filters
  const applyFilters = () => {
    let filtered = employees;

    if (selectedDepartment) {
      filtered = filtered.filter(
        (employee) => employee.department_name === selectedDepartment
      );
    }

    if (searchById) {
      filtered = filtered.filter((employee) =>
        employee.employee_no.toLowerCase().includes(searchById.toLowerCase())
      );
    }

    if (searchByName) {
      filtered = filtered.filter((employee) =>
        employee.employee_calling_name
          .toLowerCase()
          .includes(searchByName.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
    setCurrentPage(1); // Reset to first page after filtering
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage);

  // Get rows for the current page
  const currentRows = filteredEmployees.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleModalClose = () => {
    dispatch(resetEmployeeState()); // Reset the employee data in Redux
    setCurrentStep(1);
    setIsEditModalOpen(false); // Close the modal
  };

  const handleViewModalClose = () => {
    dispatch(resetEmployeeState()); // Reset the employee data in Redux
    setCurrentStep(1);
    setIsViewModalOpen(false); // Close the modal
  };

  const handleNextStep = (currentFormValid) => {
    if (currentFormValid) {
      setCompletedSteps((prevCompleted) =>
        prevCompleted.includes(currentStep)
          ? prevCompleted
          : [...prevCompleted, currentStep]
      );
      setCurrentStep((prevStep) => prevStep + 1);
    }
  };
  // console.log("select Employee", selectedEmployee);

  // console.log("employye data ", employeeData);

  const transformEmployeeData = (data) => {
    console.log("data", data);
    return {
      editor: userId,
      employee_no: data.employee_no,
      employee_fullname: data.employee_fullname,
      employee_name_initial: data.employee_name_initial,
      employee_calling_name: data.employee_calling_name,
      employee_dob: data.employee_dob,
      employee_gender: data.employee_gender,
      employee_marital_status: data.employee_marital_status,
      employee_contact_no: data.employee_contact_no,
      employee_permanent_address: data.employee_permanent_address,
      employee_temporary_address: data.employee_temporary_address,
      employee_email: data.employee_email,
      personal_email: data.personal_email, // Add if exists or adjust field name
      phone_number: data.phone_number, // Add if exists or adjust field name
      nationality: data.employee_nationality,
      religion: data.employee_religion,
      working_office: data.employee_working_office,
      branch: parseInt(data.branch_Id, 10),
      employment_type: parseInt(data.employment_type_Id, 10), // Assuming employment_type is an ID
      employee_dependent_details: data.employee_dependent_details.map(
        (dep) => ({
          employee_dependent_name: dep.employee_dependent_name,
          employee_dependent_relationship: dep.employee_dependent_relationship,
          employee_dependent_dob: dep.employee_dependent_dob, // Make sure this field exists
        })
      ),
      date_of_appointment: data.date_of_appointment,
      employee_basic_salary: parseFloat(data.employee_basic_salary).toFixed(2),
      employee_active_status: data.employee_active_status,
      employee_account_no: data.employee_account_no,
      employee_account_name: data.employee_account_name,
      employee_bank_name: data.employee_bank_name,
      employee_branch_name: data.employee_branch_name,
      department_designation_id: parseInt(data.department_designation_id, 10),
      supervisor_id: parseInt(data.supervisor.supervisor_id, 10),
      timetable_id: parseInt(data.timetable.TimetableID, 10),
    };
  };

  const handleUpdateEmployeeData = async () => {
    const transformedData = transformEmployeeData(employeeData);
    console.log("send Data", transformedData);

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/updateemployee`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(transformedData),
        }
      );

      const result = await response.json();

      if (result.success) {
        const bankDetailsUploadSuccess = await handleFileUploadBankDetails(
          transformedData.employee_no
        );
        const personalDocsUploadSuccess = await handleFileUpload(
          transformedData.employee_no
        );

        setTimeout(() => {
          if (bankDetailsUploadSuccess && personalDocsUploadSuccess) {
            window.alert("Employee data and all files uploaded successfully.");

            // Clear employeeSlice state
            dispatch(resetEmployeeState());
            setIsEditModalOpen(false);

            // Option 1: Reset currentStep
            setCurrentStep(1);

            // Option 2: Refresh the page (optional)
            // window.location.reload();
          } else {
            window.alert(
              "Employee data submitted but some files failed to upload."
            );
          }
        }, 2000);
      } else {
        const errorMessage =
          result.error || result.message || "Failed to submit employee data";
        setErrorMessage(errorMessage);
      }
    } catch (error) {
      console.error("Error submitting employee data:", error);
      setErrorMessage("Error submitting employee data. Please try again.");
    }
  };

  // Handle Bank Details Upload
  const handleFileUploadBankDetails = async (employeeNo) => {
    const formData = new FormData();
    const file = employeeData.employee_bank_details_uploaded_file;
    if (file) {
      formData.append("file", file);
    }
    formData.append("employee_no", employeeNo);

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/uploadEmployeeBankFiles`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Bank Details uploaded successfully.");
        return true; // Upload success
      } else {
        console.error(
          "Bank Details failed to upload. Status:",
          response.status
        );
        return false; // Upload failed
      }
    } catch (error) {
      console.error("Error uploading bank details:", error);
      return false; // Upload failed
    }
  };

  // Handle Personal Documents Upload
  const handleFileUpload = async (employeeNo) => {
    const formData = new FormData();
    if (employeeData.employee_personal_document) {
      formData.append("files", employeeData.employee_personal_document);
    }
    formData.append("employee_no", employeeNo);

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/uploadEmployeeFiles`,
        {
          method: "POST",
          body: formData,
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("Personal documents uploaded successfully.");
        return true; // Upload success
      } else {
        console.error(
          "Personal Documents failed to upload. Status:",
          response.status
        );
        return false; // Upload failed
      }
    } catch (error) {
      console.error("Error uploading personal documents:", error);
      return false; // Upload failed
    }
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Personal_DetailsEdit
            data={employeeData.personal_details}
            setData={(data) =>
              dispatch(saveEmployeeData({ personal_details: data }))
            }
            handleNextStep={handleNextStep}
          />
        );
      case 2:
        return (
          <NextOfKingsEdit
            data={employeeData.employee_dependent_details}
            setData={(data) =>
              dispatch(saveEmployeeData({ employee_dependent_details: data }))
            }
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 3:
        return (
          <Employment_DetailsEdit
            data={{
              department_id: employeeData.department || null,
              employee_working_office: employeeData.working_office || null,
              branch: employeeData.branch || null,
              branch_Id: employeeData.branch_Id || null,
              supervisor: employeeData.supervisor || null,
              timetable: employeeData.timetable || null,
              employment_type: employeeData.employment_type || null,
              employment_type_Id: employeeData.employment_type_Id || null,
              employee_basic_salary: employeeData.employee_basic_salary || null,
              date_of_appointment: employeeData.date_of_appointment || null,
              department_designation_id:
                employeeData.department_designation_id || null,
            }} // Pass only employment details
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 4:
        return (
          <Bank_DetailsEdit
            data={{
              employee_account_no: employeeData.employee_account_no || null,
              employee_account_name: employeeData.employee_account_name || null,
              employee_bank_name: employeeData.employee_bank_name || null,
              employee_branch_name: employeeData.employee_branch_name || null,
              employee_visa_category:
                employeeData.employee_visa_category || null,
              employee_visa_office: employeeData.employee_visa_office || null,
              employee_bank_details_uploaded_file:
                employeeData.employee_bank_details_uploaded_file || null,
            }} // Pass only bank details
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 5:
        return (
          <Personal_DocEdit
            data={{
              employee_personal_document:
                employeeData.employee_personal_document,
            }} // Pass only personal docs
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleUpdateEmployeeData}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
            errorMessage={errorMessage}
          />
        );
      default:
        return <Personal_DetailsEdit onNext={handleNextStep} />;
    }
  };

  const renderStepViewComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <Personal_DetailsView
            data={employeeData.personal_details}
            setData={(data) =>
              dispatch(saveEmployeeData({ personal_details: data }))
            }
            handleNextStep={handleNextStep}
          />
        );
      case 2:
        return (
          <NextOfKingsView
            data={employeeData.employee_dependent_details}
            setData={(data) =>
              dispatch(saveEmployeeData({ employee_dependent_details: data }))
            }
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 3:
        return (
          <Employment_DetailsView
            data={{
              department_id: employeeData.department || null,
              employee_working_office: employeeData.working_office || null,
              branch: employeeData.branch || null,
              branch_Id: employeeData.branch_Id || null,
              supervisor: employeeData.supervisor || null,
              timetable: employeeData.timetable || null,
              employment_type: employeeData.employment_type || null,
              employment_type_Id: employeeData.employment_type_Id || null,
              employee_basic_salary: employeeData.employee_basic_salary || null,
              date_of_appointment: employeeData.date_of_appointment || null,
              department_designation_id:
                employeeData.department_designation_id || null,
            }} // Pass only employment details
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 4:
        return (
          <Bank_DetailsView
            data={{
              employee_account_no: employeeData.employee_account_no || null,
              employee_account_name: employeeData.employee_account_name || null,
              employee_bank_name: employeeData.employee_bank_name || null,
              employee_branch_name: employeeData.employee_branch_name || null,
              employee_visa_category:
                employeeData.employee_visa_category || null,
              employee_visa_office: employeeData.employee_visa_office || null,
              employee_bank_details_uploaded_file:
                employeeData.employee_bank_details_uploaded_file || null,
            }} // Pass only bank details
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleNextStep}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
          />
        );
      case 5:
        return (
          <Personal_DocView
            data={{
              employee_personal_document:
                employeeData.employee_personal_document,
            }} // Pass only personal docs
            setData={(data) => dispatch(saveEmployeeData(data))}
            handleNextStep={handleViewModalClose}
            handlePrevStep={() => setCurrentStep((prev) => prev - 1)}
            errorMessage={errorMessage}
          />
        );
      default:
        return <Personal_DetailsView onNext={handleNextStep} />;
    }
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg overflow-y-hidden">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          View Employee Details
        </h2>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <input
          type="text"
          value={searchById}
          onChange={(e) => setSearchById(e.target.value)}
          placeholder="Search by employee ID"
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          value={searchByName}
          onChange={(e) => setSearchByName(e.target.value)}
          placeholder="Search by calling name"
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select by department</option>
          {departments.map((dept, index) => (
            <option key={index} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <button
          onClick={applyFilters}
          className="px-2 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 w-[100px] flex items-center justify-center gap-2"
        >
          <CiSearch />
          Search
        </button>
      </div>

      <button
        className="px-4 py-2 text-white bg-[#2495FE] bg-opacity-55 rounded hover:bg-blue-600 flex justify-end mb-2"
        onClick={() => setShowExportPopup(true)} // Open popup on click
      >
        <div className="flex items-center gap-3 justify-end">
          <div>
            <MdOutlineFileDownload />
          </div>
          <div className="z-1000">Export</div>
        </div>
      </button>
      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="table-container">
            <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">ID</th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Employee
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Calling Name
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">NIC</th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Department
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Designation
                  </th>
                  <th className="px-6 py-4 font-medium text-gray-900">Phone</th>
                  <th className="px-6 py-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 border-t border-gray-200">
                {currentRows.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {employee.employee_no || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-blue-300 flex items-center justify-center text-white font-bold">
                          {(employee.employee_fullname || "N/A")
                            .split(" ")
                            .map((name) => name[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.employee_fullname || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.employee_email || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {employee.employee_calling_name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {employee.employee_nic || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {employee.department_name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {employee.designation_name || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      {employee.employee_contact_no || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-4 items-center">
                        <div
                          onClick={() => handleViewClick(employee.employee_no)}
                        >
                          <LuEye />
                        </div>
                        <div
                          onClick={() => handleEditClick(employee.employee_no)}
                        >
                          <FaEdit />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center rounded-lg bg-gray-800 bg-opacity-50 z-50">
            <div className="bg-white  w-[80%] max-h-[90%] overflow-hidden">
              {/* Navigator at the top */}
              <div>
                <Navigator
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  isClosed={handleModalClose}
                />
              </div>
              {/* Main content area */}
              <div className="p-10 overflow-y-auto h-[calc(90%-60px)]">
                {renderStepComponent()}
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {isViewModalOpen && (
          <div className="fixed inset-0 flex items-center justify-center rounded-lg bg-gray-800 bg-opacity-50 z-50">
            <div className="bg-white  w-[80%] max-h-[90%] overflow-hidden">
              {/* Navigator at the top */}
              <div>
                <Navigator
                  currentStep={currentStep}
                  completedSteps={completedSteps}
                  isClosed={handleViewModalClose}
                />
              </div>
              {/* Main content area */}
              <div className="p-10 overflow-y-auto h-[calc(90%-60px)]">
                {renderStepViewComponent()}
              </div>
            </div>
          </div>
        )}

        {showExportPopup && (
          <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-[400px]">
              <h2 className="text-lg font-semibold mb-4">
                Select Fields to Export
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(selectedFields).map((field, index) => (
                  <label key={field} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedFields[field]}
                      onChange={() => handleFieldChange(field)}
                    />
                    {field}
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                  onClick={() => setShowExportPopup(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleExport}
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <span className="text-sm text-gray-700">
            Showing{" "}
            <span className="font-medium">
              {(currentPage - 1) * rowsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-medium">
              {Math.min(currentPage * rowsPerPage, filteredEmployees.length)}
            </span>{" "}
            of <span className="font-medium">{filteredEmployees.length}</span>{" "}
            entries
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            className={`px-3 py-1 rounded ${
              currentPage === 1 ? "bg-gray-200" : "bg-blue-500 text-white"
            }`}
            disabled={currentPage === 1}
          >
            Previous
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
            const page = index + 1 + Math.floor((currentPage - 1) / 5) * 5;
            return (
              page <= totalPages && (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded ${
                    currentPage === page
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200"
                  }`}
                >
                  {page}
                </button>
              )
            );
          })}

          {currentPage + 5 <= totalPages && (
            <button
              onClick={() => setCurrentPage(currentPage + 5)}
              className="px-3 py-1 rounded bg-blue-500 text-white"
            >
              See More
            </button>
          )}

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? "bg-gray-200"
                : "bg-blue-500 text-white"
            }`}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;
