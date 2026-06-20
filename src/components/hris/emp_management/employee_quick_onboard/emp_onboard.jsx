/** @format */

import React, { useState, useEffect } from "react";
import { CiCirclePlus } from "react-icons/ci";
import { IoIosCloudUpload } from "react-icons/io";
import { AiOutlineClose } from "react-icons/ai";
import moment from "moment";
import FileUpload from "./upload_files";
import Cookies from "js-cookie";

const EmpOnboard = () => {
  const [nextOfKinSections, setNextOfKinSections] = useState([{}]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [selectedTimetableId, setSelectedTimetableId] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [employeeData, setEmployeeData] = useState({
    employee_no: "",
    employee_fullname: "",
    employee_name_initial: "",
    employee_calling_name: "",
    employee_nic: "",
    employee_dob: "",
    employee_gender: "",
    employee_marital_status: "",
    employee_contact_no: "",
    employee_permanent_address: "",
    employee_temporary_address: "",
    employee_email: "",
    employee_dependent_details: [],
    date_of_appointment: "",
    employee_basic_salary: "",
    employee_account_no: "",
    employee_account_name: "",
    employee_bank_name: "",
    employee_branch_name: "",
    department_designation_id: "",
    supervisor_id: "",
    employee_active_status: "ACTIVE",
    timetable_id: "",
  });
  const token = Cookies.get("accessToken");

  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const currentDate = moment().format("MMMM Do YYYY");
  const [currentTime, setCurrentTime] = useState(moment().format("h:mm:ss a"));

  const handleRemoveFile = (index) => {
    setUploadedFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment().format("h:mm:ss a"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [designationResponse, supervisorResponse, timetableResponse] =
          await Promise.all([
            fetch(`${API_URL}/v1/hris/designations/getdesignation`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/v1/hris/supervisors/getSupervisors`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${API_URL}/v1/hris/timetable/gettimetable`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

        const [designations, supervisors, timetables] = await Promise.all([
          designationResponse.json(),
          supervisorResponse.json(),
          timetableResponse.json(),
        ]);

        setDepartments(
          Array.from(new Set(designations.map((item) => item.department)))
        );
        setDesignations(designations);
        setSupervisors(supervisors);
        setTimetables(timetables);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleAddSection = () => {
    if (nextOfKinSections.length < 5) {
      setNextOfKinSections([...nextOfKinSections, {}]);
    }
  };

  const handleRemoveSection = (index) => {
    setNextOfKinSections((prevSections) =>
      prevSections.filter((_, i) => i !== index)
    );
  };

  const handleOpenModal = () => setIsModalOpen(true);

  const handleCloseModal = () => setIsModalOpen(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue =
      name === "employee_dob" || name === "date_of_appointment"
        ? moment(value).format("DD/MM/YYYY")
        : value;

    setEmployeeData((prevData) => ({
      ...prevData,
      [name]: formattedValue,
    }));

    // Clear the error for the field that is being changed
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleDepartmentChange = (e) => {
    const department = e.target.value;
    setSelectedDepartment(department);
    setSelectedDesignationId(""); // Reset the designation ID when the department changes

    setEmployeeData((prevData) => ({
      ...prevData,
      department_designation_id: "",
    }));

    // Clear the error for the department field
    setErrors((prevErrors) => ({
      ...prevErrors,
      department_designation_id: "",
    }));
  };

  const handleDesignationChange = (e) => {
    const designationId = e.target.value;
    setSelectedDesignationId(designationId);

    setEmployeeData((prevData) => ({
      ...prevData,
      department_designation_id: designationId,
    }));

    // Clear the error for the designation field
    setErrors((prevErrors) => ({
      ...prevErrors,
      department_designation_id: "",
    }));
  };

  const handleSupervisorChange = (e) => {
    const supervisorId = e.target.value;
    setSelectedSupervisorId(supervisorId);

    setEmployeeData((prevData) => ({
      ...prevData,
      supervisor_id: supervisorId,
    }));

    // Clear the error for the supervisor field
    setErrors((prevErrors) => ({
      ...prevErrors,
      supervisor_id: "",
    }));
  };

  const handleTimetableChange = (e) => {
    const timetableId = e.target.value;
    setSelectedTimetableId(timetableId);

    setEmployeeData((prevData) => ({
      ...prevData,
      timetable_id: timetableId,
    }));

    // Clear the error for the timetable field
    setErrors((prevErrors) => ({
      ...prevErrors,
      timetable_id: "",
    }));
  };

  const handleDependentChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDependents = [...employeeData.employee_dependent_details];
    updatedDependents[index] = {
      ...updatedDependents[index],
      [name]: value,
    };
    setEmployeeData((prevData) => ({
      ...prevData,
      employee_dependent_details: updatedDependents,
    }));
  };

  const validateForm = () => {
    let formErrors = {};

    if (!employeeData.employee_no)
      formErrors.employee_no = "Employee ID is required";
    if (!employeeData.employee_fullname)
      formErrors.employee_fullname = "Full Name is required";
    if (!employeeData.employee_name_initial)
      formErrors.employee_name_initial = "Name Initial is required";
    if (!employeeData.employee_calling_name)
      formErrors.employee_calling_name = "Calling Name is required";
    if (!employeeData.employee_nic) formErrors.employee_nic = "NIC is required";
    if (!employeeData.employee_dob)
      formErrors.employee_dob = "Date of Birth is required";
    if (!employeeData.employee_gender)
      formErrors.employee_gender = "Gender is required";
    if (!employeeData.employee_marital_status)
      formErrors.employee_marital_status = "Marital Status is required";
    if (!employeeData.employee_contact_no)
      formErrors.employee_contact_no = "Contact Number is required";
    if (!employeeData.employee_permanent_address)
      formErrors.employee_permanent_address = "Permanent Address is required";
    if (!employeeData.employee_temporary_address)
      formErrors.employee_temporary_address = "Temporary Address is required";
    if (!employeeData.employee_email)
      formErrors.employee_email = "Email Address is required";
    if (!employeeData.department_designation_id)
      formErrors.department_designation_id = "Designation is required";
    if (!employeeData.supervisor_id)
      formErrors.supervisor_id = "Supervisor is required";
    if (!employeeData.timetable_id)
      formErrors.timetable_id = "Timetable is required";
    if (!employeeData.date_of_appointment)
      formErrors.date_of_appointment = "Date of Appointment is required";
    if (!employeeData.employee_basic_salary)
      formErrors.employee_basic_salary = "Basic Salary is required";

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData = {
      ...employeeData,
      employee_dob: moment(employeeData.employee_dob, "DD/MM/YYYY").format(
        "YYYY-MM-DD"
      ),
      date_of_appointment: moment(
        employeeData.date_of_appointment,
        "DD/MM/YYYY"
      ).format("YYYY-MM-DD"),
    };
    console.log("data", submitData);
    try {
      const response = await fetch(`${API_URL}/v1/hris/employees/addemployee`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });
      const result = await response.json();
      if (result.success) {
        const employeeNo = result.employee_no;
        await handleFileUpload(employeeNo);
        setSuccessMessage("Employee data submitted successfully.");
        setTimeout(() => {
          setSuccessMessage("");
        }, 2000);
      } else {
        setSuccessMessage("Failed to submit employee data");
      }
    } catch (error) {
      console.error("Error submitting employee data:", error);
      setSuccessMessage("Error submitting employee data");
    }
  };

  const handleFileUpload = async (employeeNo) => {
    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append("files", file);
    });
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

      const result = await response.json();
      if (result.success) {
        setSuccessMessage("Files uploaded successfully");
        setUploadedFiles([]);
      } else {
        setSuccessMessage("Failed to upload files");
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setSuccessMessage("Error uploading files");
    }
  };

  const filteredDesignations = designations.filter(
    (designation) => designation.department === selectedDepartment
  );

  //add new sections///////////////////////////////////////////////////////////////////////
  const handleQualificationChange = (index, event) => {
    const { name, value } = event.target;
    const updatedQualifications = professionalQualifications.map(
      (qualification, i) =>
        i === index ? { ...qualification, [name]: value } : qualification
    );
    setProfessionalQualifications(updatedQualifications);
  };

  const handleRemoveQualification = (index) => {
    setProfessionalQualifications(
      professionalQualifications.filter((_, i) => i !== index)
    );
  };
  const handleAddQualification = () => {
    setProfessionalQualifications([
      ...professionalQualifications,
      { title: "", institution: "", year: "", grade: "" },
    ]);
  };

  const [professionalQualifications, setProfessionalQualifications] = useState([
    { title: "", institution: "", year: "", grade: "" },
  ]);

  const [educationalQualifications, setEducationalQualifications] = useState([
    { degree: "", institution: "", year: "", grade: "" },
  ]);

  const handleAddEducation = () => {
    setEducationalQualifications([
      ...educationalQualifications,
      { degree: "", institution: "", year: "", grade: "" },
    ]);
  };
  const handleRemoveEducation = (index) => {
    setEducationalQualifications(
      educationalQualifications.filter((_, i) => i !== index)
    );
  };
  const handleEducationChange = (index, event) => {
    const { name, value } = event.target;
    const updatedQualifications = educationalQualifications.map(
      (qualification, i) =>
        i === index ? { ...qualification, [name]: value } : qualification
    );
    setEducationalQualifications(updatedQualifications);
  };

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const handleOpenUploadModal = () => {
    setIsUploadModalOpen(true);
  };

  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles((prevFiles) => [...prevFiles, ...files]);
  };

  return (
    <div className="mx-10 mt-5">
      <div className="mt-6 flex justify-between">
        <div>
          <p className="text-[30px] font-semibold">Employee Onboarding</p>
          <p>Employee Management , Employee Quick Onboard </p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="max-w-6xl p-8">
        <h1 className="text-[30px] font-bold mb-8">Personal Details</h1>
        <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px]">
          <div>
            <label className="block text-gray-700">Employee ID</label>
            <input
              type="text"
              name="employee_no"
              value={employeeData.employee_no}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_no && (
              <p className="text-red-500">{errors.employee_no}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Full Name</label>
            <input
              type="text"
              name="employee_fullname"
              value={employeeData.employee_fullname}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_fullname && (
              <p className="text-red-500">{errors.employee_fullname}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Name Initial</label>
            <input
              type="text"
              name="employee_name_initial"
              value={employeeData.employee_name_initial}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_name_initial && (
              <p className="text-red-500">{errors.employee_name_initial}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Calling Name</label>
            <input
              type="text"
              name="employee_calling_name"
              value={employeeData.employee_calling_name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_calling_name && (
              <p className="text-red-500">{errors.employee_calling_name}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">NIC</label>
            <input
              type="text"
              name="employee_nic"
              value={employeeData.employee_nic}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_nic && (
              <p className="text-red-500">{errors.employee_nic}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Date of Birth</label>
            <input
              type="date"
              name="employee_dob"
              value={moment(employeeData.employee_dob, "DD/MM/YYYY").format(
                "YYYY-MM-DD"
              )}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_dob && (
              <p className="text-red-500">{errors.employee_dob}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Gender</label>
            <select
              name="employee_gender"
              value={employeeData.employee_gender}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            {errors.employee_gender && (
              <p className="text-red-500">{errors.employee_gender}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Marital Status</label>
            <select
              name="employee_marital_status"
              value={employeeData.employee_marital_status}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="" disabled>
                Select Status
              </option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              {/* <option value="Divorced">Divorced</option> */}
              <option value="Divorced">Other</option>
            </select>
            {errors.employee_marital_status && (
              <p className="text-red-500">{errors.employee_marital_status}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Contact Number</label>
            <input
              type="text"
              name="employee_contact_no"
              value={employeeData.employee_contact_no}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_contact_no && (
              <p className="text-red-500">{errors.employee_contact_no}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Permanent Address</label>
            <input
              type="text"
              name="employee_permanent_address"
              value={employeeData.employee_permanent_address}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_permanent_address && (
              <p className="text-red-500">
                {errors.employee_permanent_address}
              </p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Temporary Address</label>
            <input
              type="text"
              name="employee_temporary_address"
              value={employeeData.employee_temporary_address}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_temporary_address && (
              <p className="text-red-500">
                {errors.employee_temporary_address}
              </p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Email Address</label>
            <input
              type="email"
              name="employee_email"
              value={employeeData.employee_email}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_email && (
              <p className="text-red-500">{errors.employee_email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700"> School Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_email && <p className="text-red-500"></p>}
          </div>
        </div>

        {nextOfKinSections.map((_, index) => (
          <React.Fragment key={index}>
            <h1 className="text-[30px] font-bold col-span-3 mt-8">
              Next Of Kin {index + 1} Details
            </h1>
            <div className="grid grid-cols-1 gap-y-[30px] text-[20px] relative">
              {index > 0 && ( // Conditionally render the close button for sections other than the first one
                <button
                  type="button"
                  onClick={() => handleRemoveSection(index)}
                  className="absolute top-0 right-0 mt-2 mr-2 text-red-500"
                >
                  <AiOutlineClose size={24} />
                </button>
              )}
              <div>
                <label className="block text-gray-700">Relationship</label>
                <select
                  name="employee_dependent_relationship"
                  onChange={(e) => handleDependentChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
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
                  onChange={(e) => handleDependentChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  NIC (National Identity Card)
                </label>
                <input
                  type="text"
                  name="employee_dependent_nic"
                  onChange={(e) => handleDependentChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  DoB (Date of Birth)
                </label>
                <input
                  type="date"
                  name="employee_dependent_dob"
                  onChange={(e) => handleDependentChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
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
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="" disabled>
                Select Department
              </option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department_designation_id && (
              <p className="text-red-500">{errors.department_designation_id}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Designation</label>
            <select
              name="department_designation_id"
              value={selectedDesignationId}
              onChange={handleDesignationChange}
              className="w-full border border-gray-300 p-2 rounded"
              disabled={!selectedDepartment}
            >
              <option value="" disabled>
                Select Designation
              </option>
              {filteredDesignations.map((designation) => (
                <option key={designation.id} value={designation.id}>
                  {designation.designation}
                </option>
              ))}
            </select>
            {errors.department_designation_id && (
              <p className="text-red-500">{errors.department_designation_id}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Supervisor</label>
            <select
              name="supervisor_id"
              value={selectedSupervisorId}
              onChange={handleSupervisorChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="" disabled>
                Select Supervisor
              </option>
              {supervisors.map((supervisor) => (
                <option key={supervisor.id} value={supervisor.id}>
                  {supervisor.supervisor_fullname}
                </option>
              ))}
            </select>
            {errors.supervisor_id && (
              <p className="text-red-500">{errors.supervisor_id}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Timetable</label>
            <select
              name="timetable_id"
              value={selectedTimetableId}
              onChange={handleTimetableChange}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="" disabled>
                Select Timetable
              </option>
              {timetables.map((timetable) => (
                <option
                  key={timetable.TimetableID}
                  value={timetable.TimetableID}
                >
                  {timetable.TimetableName}
                </option>
              ))}
            </select>
            {errors.timetable_id && (
              <p className="text-red-500">{errors.timetable_id}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Date of Appointment</label>
            <input
              type="date"
              name="date_of_appointment"
              value={moment(
                employeeData.date_of_appointment,
                "DD/MM/YYYY"
              ).format("YYYY-MM-DD")}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.date_of_appointment && (
              <p className="text-red-500">{errors.date_of_appointment}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Basic Salary</label>
            <input
              type="text"
              name="employee_basic_salary"
              value={employeeData.employee_basic_salary}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_basic_salary && (
              <p className="text-red-500">{errors.employee_basic_salary}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700">Designated Staff</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_basic_salary && <p className="text-red-500"></p>}
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
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_account_no && (
              <p className="text-red-500">{errors.employee_account_no}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Account Name</label>
            <input
              type="text"
              name="employee_account_name"
              value={employeeData.employee_account_name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_account_name && (
              <p className="text-red-500">{errors.employee_account_name}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Bank Name</label>
            <input
              type="text"
              name="employee_bank_name"
              value={employeeData.employee_bank_name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_bank_name && (
              <p className="text-red-500">{errors.employee_bank_name}</p>
            )}
          </div>
          <div>
            <label className="block text-gray-700">Branch Name</label>
            <input
              type="text"
              name="employee_branch_name"
              value={employeeData.employee_branch_name}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded"
            />
            {errors.employee_branch_name && (
              <p className="text-red-500">{errors.employee_branch_name}</p>
            )}
          </div>
        </div>

        {professionalQualifications.map((_, index) => (
          <React.Fragment key={index}>
            <h1 className="text-[30px] font-bold col-span-3 mt-8">
              Professional Qualification {index + 1}
            </h1>
            <div className="grid grid-cols-1 gap-y-[30px] text-[20px] relative">
              {index > 0 && ( // Conditionally render the close button for sections other than the first one
                <button
                  type="button"
                  onClick={() => handleRemoveQualification(index)}
                  className="absolute top-0 right-0 mt-2 mr-2 text-red-500"
                >
                  <AiOutlineClose size={24} />
                </button>
              )}
              <div>
                <label className="block text-gray-700">
                  Qualification Title
                </label>
                <input
                  type="text"
                  name="qualification_title"
                  onChange={(e) => handleQualificationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Institution</label>
                <input
                  type="text"
                  name="institution_name"
                  onChange={(e) => handleQualificationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  Year of Completion
                </label>
                <input
                  type="number"
                  name="completion_year"
                  onChange={(e) => handleQualificationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Grade/Score</label>
                <input
                  type="text"
                  name="grade_score"
                  onChange={(e) => handleQualificationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
            </div>

            {/* <button
              type="button"
              onClick={handleOpenUploadModal}
              className="p-3 border border-[#8764A0] rounded-[25px] text-[#8764A0] mt-5"
            >
              <div className="flex gap-2 items-center">
                <div className="text-[15px] font-bold">Click Here to Upload</div>
                <IoIosCloudUpload />
              </div>
            </button> */}
            {isUploadModalOpen && (
              <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                <div className="bg-white rounded-lg p-8 w-[400px]">
                  <h2 className="text-lg font-bold mb-4">Upload Files</h2>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="w-full border border-gray-300 p-2 rounded mb-4"
                  />
                  <button
                    className="bg-blue-500 text-white p-2 rounded mr-2"
                    onClick={handleCloseUploadModal}
                  >
                    Done
                  </button>
                  <button
                    className="bg-red-500 text-white p-2 rounded"
                    onClick={handleCloseUploadModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {uploadedFiles.length > 0 && (
              <div className="mt-5">
                <h3 className="text-xl font-bold mb-2">Selected Files</h3>
                {uploadedFiles.map((file, index) => (
                  <div
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
                  </div>
                ))}
              </div>
            )}
          </React.Fragment>
        ))}

        {professionalQualifications.length < 5 && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handleAddQualification}
              className="p-3 border border-[#8764A0] rounded-[25px] text-[#8764A0]"
            >
              <div className="flex gap-2 items-center">
                <div>Add Another Qualification</div>
                <CiCirclePlus />
              </div>
            </button>
          </div>
        )}

        {educationalQualifications.map((_, index) => (
          <React.Fragment key={index}>
            <h1 className="text-[30px] font-bold col-span-3 mt-8">
              Educational Qualification {index + 1}
            </h1>
            <div className="grid grid-cols-1 gap-y-[30px] text-[20px] relative">
              {index > 0 && ( // Conditionally render the close button for sections other than the first one
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(index)}
                  className="absolute top-0 right-0 mt-2 mr-2 text-red-500"
                >
                  <AiOutlineClose size={24} />
                </button>
              )}
              <div>
                <label className="block text-gray-700">
                  Degree/Qualification
                </label>
                <input
                  type="text"
                  name="degree"
                  onChange={(e) => handleEducationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Institution</label>
                <input
                  type="text"
                  name="institution"
                  onChange={(e) => handleEducationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">
                  Year of Completion
                </label>
                <input
                  type="number"
                  name="year"
                  onChange={(e) => handleEducationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
              <div>
                <label className="block text-gray-700">Grade/Score</label>
                <input
                  type="text"
                  name="grade"
                  onChange={(e) => handleEducationChange(index, e)}
                  className="w-full border border-gray-300 p-2 rounded"
                />
              </div>
            </div>
          </React.Fragment>
        ))}

        {educationalQualifications.length < 5 && (
          <div className="mt-8">
            <button
              type="button"
              onClick={handleAddEducation}
              className="p-3 border border-[#8764A0] rounded-[25px] text-[#8764A0]"
            >
              <div className="flex gap-2 items-center">
                <div>Add Another Education</div>
                <CiCirclePlus />
              </div>
            </button>
          </div>
        )}

        <h1 className="text-[30px] font-bold mb-8 mt-10">Personal Documents</h1>
        <button
          type="button"
          onClick={handleOpenModal}
          className="p-3 border border-[#8764A0] rounded-[25px] text-[#8764A0]"
        >
          <div className="flex gap-2 items-center">
            <div className="text-[15px] font-bold">Click Here to Upload</div>
            <IoIosCloudUpload />
          </div>
        </button>

        {uploadedFiles.length > 0 && (
          <div className="mt-5">
            <h3 className="text-xl font-bold mb-2">Selected Files</h3>
            {uploadedFiles.map((file, index) => (
              <div
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
              </div>
            ))}
          </div>
        )}

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

export default EmpOnboard;
