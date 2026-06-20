/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import Navbar from "../../navbar/navbar";
import { CiCirclePlus } from "react-icons/ci";
import { IoIosCloudUpload } from "react-icons/io";
import FileUpload from "../employee_quick_onboard/upload_files";
import Cookies from "js-cookie";

const Emp_edit = ({ employee, onClose }) => {
  const employee_no = employee.employee_no;
  const [currentDate] = useState(moment().format("MMMM Do YYYY"));
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));
  const [employeeData, setEmployeeData] = useState({
    employee_no: employee.employee_no || "",
    employee_fullname: employee.employee_fullname || "",
    employee_name_initial: employee.employee_name_initial || "",
    employee_calling_name: employee.employee_calling_name || "",
    employee_nic: employee.employee_nic || "",
    employee_dob: employee.employee_dob || "",
    employee_gender: employee.employee_gender || "Male",
    employee_marital_status: employee.employee_marital_status || "Single",
    employee_contact_no: employee.employee_contact_no || "",
    employee_permanent_address: employee.employee_permanent_address || "",
    employee_temporary_address: employee.employee_temporary_address || "",
    employee_email: employee.employee_email || "",
    employee_dependent_details: employee.employee_dependent_details || [],
    date_of_appointment: employee.date_of_appointment || "",
    employee_basic_salary: employee.employee_basic_salary || "",
    employee_active_status: employee.employee_active_status || "ACTIVE",
    employee_account_no: employee.employee_account_no || "",
    employee_account_name: employee.employee_account_name || "",
    employee_bank_name: employee.employee_bank_name || "",
    employee_branch_name: employee.employee_branch_name || "",
    department_designation_id: "",
    supervisor_fullname: employee.supervisor
      ? employee.supervisor.supervisor_fullname
      : "",
    timetable_name: employee.timetable ? employee.timetable.TimetableName : "",
  });

  const [timetables, setTimetables] = useState([]);

  const [selectedDepartment, setSelectedDepartment] = useState(
    employeeData.department || ""
  ); // Default to the employee's department
  const [filteredDesignations, setFilteredDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [nextOfKinSections, setNextOfKinSections] = useState([{}]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditable, setIsEditable] = useState(false);
  const [files, setFiles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(
    employee.supervisor ? employee.supervisor.supervisor_id : ""
  );
  const [selectedTimetableId, setSelectedTimetableId] = useState(
    employee.timetable ? employee.timetable.TimetableID : ""
  );

  const [isActive, setIsActive] = useState(
    employeeData.employee_active_status === "ACTIVE"
  );

  const token = Cookies.get("accessToken");

  useEffect(() => {
    setIsActive(employeeData.employee_active_status === "ACTIVE");
  }, [employeeData]);

  const handleActiveToggle = () => {
    setIsActive(!isActive);
    setEmployeeData((prevData) => ({
      ...prevData,
      employee_active_status: !isActive ? "ACTIVE" : "INACTIVE",
    }));
  };

  const handleDependentChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDependents = employeeData.employee_dependent_details.map(
      (dep, i) => (i === index ? { ...dep, [name]: value } : dep)
    );
    setEmployeeData((prevState) => ({
      ...prevState,
      employee_dependent_details: updatedDependents,
    }));
  };

  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  // Fetch designations and departments on component load
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/designations/getdesignation`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();

        // Extract unique departments and set them
        const departmentList = Array.from(
          new Set(result.map((item) => item.department))
        );
        setDepartments(departmentList);
        setDesignations(result);

        // Set default department from employee data
        if (employeeData.department) {
          setSelectedDepartment(employeeData.department);

          // Filter designations based on employee's department
          const filtered = result.filter(
            (designation) => designation.department === employeeData.department
          );
          setFilteredDesignations(filtered);
        }
      } catch (error) {
        console.error("Error fetching designations:", error);
      }
    };

    fetchDesignations();
  }, [employeeData.department]);
  // Handle department change
  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value;
    setSelectedDepartment(selectedDept);

    // Clear designation when department changes
    setEmployeeData((prevData) => ({
      ...prevData,
      department: selectedDept,
      designation: "",
    }));

    // Filter designations based on the selected department
    const filtered = designations.filter(
      (designation) => designation.department === selectedDept
    );
    setFilteredDesignations(filtered);
  };

  // Handle designation selection change
  const handleDesignationChange = (e) => {
    const selectedDesignation = e.target.value;

    // Find the corresponding department_designation_id based on the selected designation
    const selectedDesignationData = designations.find(
      (designation) => designation.designation === selectedDesignation
    );

    setEmployeeData((prevData) => ({
      ...prevData,
      designation: selectedDesignation,
      department_designation_id: selectedDesignationData
        ? selectedDesignationData.id
        : null, // Set the ID
    }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetch(
      `${API_URL}/v1/hris/employees/getemployeebyid?employee_no=${employee_no}
      `,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((response) => response.json())
      .then((data) => {
        setEmployeeData(data);
        setSelectedTimetableId(data.timetable?.TimetableID || ""); // Pre-select the timetable

        console.log("Employee Data: ", data);
        setNextOfKinSections(data.employee_dependent_details || [{}]);
        setUploadedFiles(data.employee_upload_files || []);
      })
      .catch((error) => console.error("Error fetching employee data:", error));
  }, [employee_no]);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await fetch(
          `${API_URL}/download?employee_no=${employee_no}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();

        if (data.success) {
          setFiles(data.files);
        } else {
          console.error("Error fetching files:", data.error);
        }
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };

    fetchFiles();
  }, [employee_no]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmployeeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/supervisors/getSupervisors`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        setSupervisors(result);
      } catch (error) {
        console.error("Error fetching supervisors:", error);
      }
    };

    const fetchTimetables = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/timetable/gettimetable`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        setTimetables(result);
      } catch (error) {
        console.error("Error fetching timetables:", error);
      }
    };

    fetchSupervisors();
    fetchTimetables();
  }, []);
  const handleSubmit = (e) => {
    e.preventDefault();

    const putData = {
      editor: "admin_user",
      employee_no: employeeData.employee_no,
      employee_fullname: employeeData.employee_fullname,
      employee_name_initial: employeeData.employee_name_initial,
      employee_calling_name: employeeData.employee_calling_name,
      employee_nic: employeeData.employee_nic,
      employee_dob: employeeData.employee_dob,
      employee_gender: employeeData.employee_gender,
      employee_marital_status: employeeData.employee_marital_status,
      employee_contact_no: employeeData.employee_contact_no,
      employee_permanent_address: employeeData.employee_permanent_address,
      employee_temporary_address: employeeData.employee_temporary_address,
      employee_email: employeeData.employee_email,
      employee_dependent_details: employeeData.employee_dependent_details,
      date_of_appointment: employeeData.date_of_appointment,
      employee_basic_salary: employeeData.employee_basic_salary,
      employee_active_status: employeeData.employee_active_status,
      employee_account_no: employeeData.employee_account_no,
      employee_account_name: employeeData.employee_account_name,
      employee_bank_name: employeeData.employee_bank_name,
      employee_branch_name: employeeData.employee_branch_name,
      department_designation_id: employeeData.department_designation_id,
      supervisor_id: selectedSupervisorId, // Ensure this is the supervisor ID, not the supervisor's name.
      timetable_id: selectedTimetableId, // Ensure this is the timetable ID.
    };
    console.log("Submitting the following data:", putData);

    // Send the PUT request
    fetch(`${API_URL}/v1/hris/employees/updateemployee`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(putData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setSuccessMessage("Employee updated successfully");
          setIsEditable(false);
          setTimeout(() => {
            setSuccessMessage("");
            onClose();
          }, 2000);
        } else {
          setSuccessMessage("Failed to update employee");
        }
      })
      .catch((error) => console.error("Error updating employee:", error));
  };

  const handleClosepopup = () => {
    onClose();
  };

  const handleAddSection = () => {
    setNextOfKinSections([...nextOfKinSections, {}]);
    setEmployeeData((prevState) => ({
      ...prevState,
      employee_dependent_details: [...prevState.employee_dependent_details, {}],
    }));
  };

  const handleRemoveFile = (index) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const response = await fetch(
          `${API_URL}/v1/hris/timetable/gettimetable`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        setTimetables(result);
      } catch (error) {
        console.error("Error fetching timetables:", error);
      }
    };

    fetchTimetables();
  }, []);

  const handleSupervisorChange = (e) => {
    const supervisorId = e.target.value; // This is now an ID, not a name.
    setSelectedSupervisorId(supervisorId);

    // Optionally update supervisor name in the state if needed elsewhere in the UI
    const selectedSupervisor = supervisors.find(
      (sup) => sup.id.toString() === supervisorId
    );
    if (selectedSupervisor) {
      setEmployeeData((prevData) => ({
        ...prevData,
        supervisor_fullname: selectedSupervisor.supervisor_fullname,
      }));
    }
  };

  const handleTimetableChange = (e) => {
    const timetableId = e.target.value;
    setSelectedTimetableId(timetableId);

    const selectedTimetable = timetables.find(
      (timetable) => timetable.TimetableID === parseInt(timetableId, 10)
    );

    setEmployeeData((prevData) => ({
      ...prevData,
      timetable_name: selectedTimetable ? selectedTimetable.TimetableName : "",
    }));
  };

  return (
    <div className="mx-10 mt-5">
      <div className="mt-6 flex justify-between">
        <div className="">
          <p className="text-[30px] font-semibold">Employee Edit</p>

          <p>
            Employee Management, Employee Edit Details{" "}
            <span className="text-primary_purple">Employee Edit</span>
          </p>
        </div>

        <button
          onClick={handleClosepopup}
          className="text-red-500 hover:text-gray-700 transition duration-300"
        >
          Close
        </button>
      </div>
      <button
        onClick={() => setIsEditable(!isEditable)}
        className="bg-[#8764A0] p-2 rounded-md text-white mb-4  w-[100px] ml-[90%]"
      >
        {isEditable ? "Cancel" : "Edit"}
      </button>
      <form onSubmit={handleSubmit} className="max-w-6xl p-8">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-[30px] font-bold mb-8">Personal Details</h1>
          <div>
            {isEditable && (
              <label
                className="switch"
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "3.5em",
                  height: "2em",
                  fontSize: "17px",
                }}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={handleActiveToggle}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  className="slider"
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    inset: 0,
                    background: isActive ? "#b84fce" : "#d4acfb",
                    borderRadius: "50px",
                    transition: "all 0.4s cubic-bezier(0.23, 1, 0.320, 1)",
                  }}
                ></span>
                <span
                  className="slider-circle"
                  style={{
                    position: "absolute",
                    height: isActive ? "2em" : "1.4em",
                    width: isActive ? "2em" : "1.4em",
                    left: isActive ? "1.6em" : "0.3em",
                    bottom: isActive ? "0" : "0.3em",
                    backgroundColor: "white",
                    borderRadius: "50px",
                    boxShadow: "0 0px 20px rgba(0,0,0,0.4)",
                    transition:
                      "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                  }}
                ></span>
              </label>
            )}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px]">
          <div>
            <label className="block text-gray-700">Employee ID</label>
            <input
              type="text"
              name="employee_no"
              value={employeeData.employee_no}
              onChange={handleChange}
              readOnly
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">
              Employee Name (Full Name)
            </label>
            <input
              type="text"
              name="employee_fullname"
              value={employeeData.employee_fullname}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Name with Initials</label>
            <input
              type="text"
              name="employee_name_initial"
              value={employeeData.employee_name_initial}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px] mt-10">
          <div>
            <label className="block text-gray-700">Calling Name</label>
            <input
              type="text"
              name="employee_calling_name"
              value={employeeData.employee_calling_name}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">
              NIC (National Identity Card)
            </label>
            <input
              type="text"
              name="employee_nic"
              value={employeeData.employee_nic}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Date of Birth</label>
            <input
              type="date"
              name="employee_dob"
              value={moment(employeeData.employee_dob).format("YYYY-MM-DD")}
              onChange={handleChange}
              readOnly={!isEditable}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px] mt-10">
          <div>
            <label className="block text-gray-700">Gender</label>
            <select
              name="employee_gender"
              value={employeeData.employee_gender}
              onChange={handleChange}
              disabled={!isEditable}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
            >
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Marital Status</label>
            <select
              name="employee_marital_status"
              value={employeeData.employee_marital_status}
              onChange={handleChange}
              disabled={!isEditable}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-purple-500"
            >
              <option>Married</option>
              <option>Single</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Contact Number</label>
            <input
              type="text"
              name="employee_contact_no"
              value={employeeData.employee_contact_no}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px] mt-10">
          <div>
            <label className="block text-gray-700">Permanent Address</label>
            <input
              type="text"
              name="employee_permanent_address"
              value={employeeData.employee_permanent_address}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Temporary Address</label>
            <input
              type="text"
              name="employee_temporary_address"
              value={employeeData.employee_temporary_address}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Email Address</label>
            <input
              type="email"
              name="employee_email"
              value={employeeData.employee_email}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
        </div>
        {nextOfKinSections.map((_, index) => (
          <React.Fragment key={index}>
            <h1 className="text-[30px] font-bold col-span-3 mt-8">
              Next Of Kin {index + 1} Details
            </h1>
            <div className="grid grid-cols-1 gap-y-[30px] text-[20px]">
              <div>
                <label className="block text-gray-700">Relationship</label>
                <select
                  name="employee_dependent_relationship"
                  value={
                    employeeData.employee_dependent_details[index]
                      ?.employee_dependent_relationship || ""
                  }
                  onChange={(e) => handleDependentChange(index, e)}
                  disabled={!isEditable}
                  className="w-full border border-gray-300 p-2 rounded mt-2"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700">Name</label>
                <input
                  type="text"
                  name="employee_dependent_name"
                  value={
                    employeeData.employee_dependent_details[index]
                      ?.employee_dependent_name || ""
                  }
                  onChange={(e) => handleDependentChange(index, e)}
                  readOnly={!isEditable}
                  className="w-full border border-gray-300 p-2 rounded mt-2"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  NIC (National Identity Card)
                </label>
                <input
                  type="text"
                  name="employee_dependent_nic"
                  value={
                    employeeData.employee_dependent_details[index]
                      ?.employee_dependent_nic || ""
                  }
                  onChange={(e) => handleDependentChange(index, e)}
                  readOnly={!isEditable}
                  className="w-full border border-gray-300 p-2 rounded mt-2"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  DoB (Date of Birth)
                </label>
                <input
                  type="date"
                  name="employee_dependent_dob"
                  value={
                    employeeData.employee_dependent_details[index]
                      ?.employee_dependent_dob
                      ? moment(
                          employeeData.employee_dependent_details[index]
                            .employee_dependent_dob
                        ).format("YYYY-MM-DD")
                      : ""
                  }
                  onChange={(e) => handleDependentChange(index, e)}
                  readOnly={!isEditable}
                  className="w-full border border-gray-300 p-2 rounded mt-2"
                />
              </div>
            </div>
          </React.Fragment>
        ))}
        {nextOfKinSections.length < 5 && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handleAddSection}
              className="p-3 border border-[#8764A0] rounded-[25px] text-[#8764A0]"
              disabled={!isEditable}
            >
              <div className="flex gap-2 items-center">
                <div>Add Another</div>
                <CiCirclePlus />
              </div>
            </button>
          </div>
        )}
        <h1 className="text-[30px] font-bold mb-8 mt-10">Employment Details</h1>
        <div className="grid grid-cols-2 gap-y-[30px] gap-x-[60px] text-[20px]">
          <div>
            <label className="block text-gray-700">Department</label>
            <select
              name="department"
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              disabled={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            >
              <option value="">Select Department</option>
              {departments.map((department, index) => (
                <option key={index} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700">Designation</label>
            <select
              name="designation"
              value={employeeData.designation}
              onChange={handleDesignationChange}
              disabled={!isEditable || !selectedDepartment}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            >
              <option value="">Select Designation</option>
              {filteredDesignations.map((designation) => (
                <option key={designation.id} value={designation.designation}>
                  {designation.designation}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700">Date of Appointment</label>
            <input
              type="date"
              name="date_of_appointment"
              value={moment(employeeData.date_of_appointment).format(
                "YYYY-MM-DD"
              )}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Basic Salary</label>
            <input
              type="text"
              name="employee_basic_salary"
              value={employeeData.employee_basic_salary}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>

          <div>
            <label className="block text-gray-700">Supervisor</label>
            {!isEditable ? (
              // Show supervisor name when not in edit mode
              <p className="p-2 border border-gray-300 rounded">
                {employee.supervisor?.supervisor_fullname ||
                  "No supervisor assigned"}
              </p>
            ) : (
              // Show dropdown with the current supervisor pre-selected when in edit mode
              <select
                name="supervisor_id"
                value={selectedSupervisorId}
                onChange={handleSupervisorChange}
                className="w-full border border-gray-300 p-2 rounded"
              >
                <option value="">Select Supervisor</option>
                {supervisors.map((supervisor) => (
                  <option key={supervisor.id} value={supervisor.id}>
                    {supervisor.supervisor_fullname}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-gray-700">Timetable</label>
            {!isEditable ? (
              // Show timetable name when not in edit mode
              <p className="p-2 border border-gray-300 rounded">
                {employeeData?.timetable?.TimetableName ||
                  "No timetable assigned"}
              </p>
            ) : (
              // Show dropdown with the current timetable pre-selected when in edit mode
              <select
                name="timetable_id"
                value={
                  selectedTimetableId ||
                  employeeData?.timetable?.TimetableID ||
                  ""
                }
                onChange={handleTimetableChange}
                className="w-full border border-gray-300 p-2 rounded"
              >
                {/* Pre-select the current timetable */}
                {employeeData?.timetable?.TimetableID && (
                  <option value={employeeData.timetable.TimetableID}>
                    {employeeData.timetable.TimetableName}
                  </option>
                )}

                {/* List all available timetables */}
                {timetables.length > 0 &&
                  timetables.map((timetable) => (
                    <option
                      key={timetable.TimetableID}
                      value={timetable.TimetableID}
                    >
                      {timetable.TimetableName}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>
        <h1 className="text-[30px] font-bold mb-8 mt-10">Bank Details</h1>
        <div className="grid grid-cols-2 gap-y-[30px] gap-x-[60px] text-[20px]">
          <div>
            <label className="block text-gray-700">Account Number</label>
            <input
              type="text"
              name="employee_account_no"
              value={employeeData.employee_account_no}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Account Name</label>
            <input
              type="text"
              name="employee_account_name"
              value={employeeData.employee_account_name}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Bank Name</label>
            <input
              type="text"
              name="employee_bank_name"
              value={employeeData.employee_bank_name}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
          <div>
            <label className="block text-gray-700">Bank Branch</label>
            <input
              type="text"
              name="employee_branch_name"
              value={employeeData.employee_branch_name}
              onChange={handleChange}
              readOnly={!isEditable}
              className="w-full border border-gray-300 p-2 rounded mt-2"
            />
          </div>
        </div>
        <h1 className="text-[30px] font-bold mb-8 mt-10">Personal Documents</h1>
        {isEditable && (
          <button
            type="button"
            onClick={handleOpenModal}
            className="p-3 border border-[#8764A0] rounded-[25px] text-[#8764A0]"
            disabled={!isEditable}
          >
            <div className="flex gap-2 items-center">
              <div className="text-[15px] font-bold">Click Here to Upload</div>
              <IoIosCloudUpload />
            </div>
          </button>
        )}
        {/* Display uploaded files after a file has been uploaded */}
        {uploadedFiles.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xl font-bold mb-2">Selected Files</h3>
            <ul>
              {uploadedFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between p-2 border rounded-lg mb-2 bg-yellow-100"
                >
                  <span>{file.name}</span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="bg-red-500 text-white px-3 py-1 rounded"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {employeeData.employee_upload_files &&
          employeeData.employee_upload_files.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xl font-bold mb-2">Uploaded Files</h3>
              <ul>
                {employeeData.employee_upload_files.map((file, index) => (
                  <li key={index} className="mt-2">
                    <a
                      href={file.employee_upload_path}
                      download={file.original_file_name}
                    >
                      {file.original_file_name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        {isEditable && (
          <div className="mt-5">
            <button
              type="submit"
              onClick={handleSubmit}
              className="bg-[#8764A0] p-2 rounded-md text-white w-[150px]"
            >
              Submit
            </button>
            {successMessage && (
              <span className="ml-4 text-green-500">{successMessage}</span>
            )}
          </div>
        )}
      </form>

      {isModalOpen && (
        <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-200 bg-opacity-80 z-50">
          <div className="bg-white rounded-lg p-8">
            <FileUpload
              setUploadedFiles={setUploadedFiles}
              uploadedFiles={uploadedFiles}
              onClose={handleCloseModal}
            />
            <button
              className="mt-4 bg-red-500 p-3 text-white py-2"
              onClick={handleCloseModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emp_edit;
