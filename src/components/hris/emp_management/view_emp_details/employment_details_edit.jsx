/** @format */

import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import moment from "moment";
import { FaArrowRight } from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import { saveEmployeeData } from "../../../../reducers/employeeSlice";
import Cookies from "js-cookie";

const EmploymentDetailsEdit = ({
  data,
  setData,
  handlePrevStep,
  handleNextStep,
}) => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [branches, setBranch] = useState([]);
  const [employmentType, setEmploymentType] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const dispatch = useDispatch();

  const [employmentData, setEmploymentData] = useState(data || {});

  // console.log("data employeemnent ", data);

  const [errors, setErrors] = useState({});

  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = Cookies.get("accessToken");

        const headers = {
          Authorization: `Bearer ${token}`, // pass token here
        };

        const [
          designationResponse,
          supervisorResponse,
          timetableResponse,
          branchResponse,
          employmentTypeResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/v1/hris/designations/getdesignation`, { headers }),
          fetch(`${API_URL}/v1/hris/supervisors/getSupervisors`, { headers }),
          fetch(`${API_URL}/v1/hris/timetable/gettimetable`, { headers }),
          fetch(`${API_URL}/v1/hris/branch/all`, { headers }),
          fetch(`${API_URL}/v1/hris/employmentType/all`, { headers }),
        ]);

        const [
          designations,
          supervisors,
          timetables,
          branches,
          employmentTypes,
        ] = await Promise.all([
          designationResponse.json(),
          supervisorResponse.json(),
          timetableResponse.json(),
          branchResponse.json(),
          employmentTypeResponse.json(),
        ]);

        setDepartments(
          Array.from(new Set(designations.map((item) => item.department)))
        );
        setDesignations(designations);
        setSupervisors(supervisors);
        setTimetables(timetables);
        setBranch(branches);
        setEmploymentType(employmentTypes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // console.log("employmentData.department_id", employmentData.department_id);

  const filteredDesignations = designations.filter(
    (designation) => designation.department === employmentData.department_id
  );
  const filteredBranches = branches.filter(
    (branch) => branch.branch === employmentData.branch_id
  );

  // console.log("filteredBranches", filteredBranches);
  // console.log("supervisors", supervisors);
  const handleChange = (e) => {
    const { name, value } = e.target;

    setEmploymentData((prev) => {
      const updatedData = { ...prev }; // Preserve other fields

      if (name === "timetable_id") {
        const selectedTimetable = timetables.find(
          (timetable) => timetable.TimetableID.toString() === value
        );
        updatedData.timetable = {
          TimetableID: selectedTimetable?.TimetableID || "",
          TimetableName: selectedTimetable?.TimetableName || "",
        };
      }

      if (name === "branch_id") {
        const selectedBranch = branches.find(
          (branch) => branch.id.toString() === value
        );
        console.log("selected branch", selectedBranch);
        updatedData.branch = selectedBranch?.branch || "";
        updatedData.branch_Id = selectedBranch?.id || "";
      }

      if (name === "supervisor_id") {
        const selectedSupervisor = supervisors.find(
          (supervisor) => supervisor.id.toString() === value
        );
        console.log("selectedSupervisor", selectedSupervisor);
        updatedData.supervisor = {
          supervisor_contact_no:
            selectedSupervisor?.supervisor_contact_no || "",
          supervisor_email: selectedSupervisor?.supervisor_email || "",
          supervisor_employee_no:
            selectedSupervisor?.supervisor_employee_no || "",
          supervisor_fullname: selectedSupervisor?.supervisor_fullname || "",
          supervisor_id: selectedSupervisor?.id || "",
        };
      }

      if (name === "employment_type") {
        const selectedEmpType = employmentType.find(
          (empType) => empType.id.toString() === value
        );
        updatedData.employment_type =
          selectedEmpType?.employment_type_name || "";
        updatedData.employment_type_Id = selectedEmpType?.id || "";
      }

      // Default case - Direct value updates without special mapping
      if (
        name !== "timetable_id" &&
        name !== "branch_id" &&
        name !== "supervisor_id" &&
        name !== "employment_type"
      ) {
        updatedData[name] = value;
      }

      return updatedData;
    });
  };

  const validateFields = () => {
    const newErrors = {};

    if (!employmentData.branch) {
      newErrors.branch_id = "Employee Branch is required";
    }
    if (!employmentData.employment_type) {
      newErrors.employment_type = "Employment Type is required";
    }

    // Add other validation rules as necessary

    setErrors(newErrors);
    // console.log("new error", newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateFields()) {
      console.log("employmentData before dispatch:", employmentData); // Debugging line
      dispatch(saveEmployeeData(employmentData));
      setData(employmentData);
      handleNextStep(true);
    } else {
      handleNextStep(false);
    }
  };

  const handlePrev = () => {
    setData(employmentData); // Save the current data before going to previous
    handlePrevStep(true); // Go to the previous step
  };

  console.log("emplyement data timeTable ", employmentData);

  return (
    <div>
      <h1 className="text-[30px] font-bold col-span-3">Employment Details</h1>
      <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px] mt-5">
        <div>
          <label className="block text-gray-700">Department</label>
          <select
            name="department_id"
            value={employmentData.department_id || ""}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="" disabled>
              Select Department
            </option>
            {departments.map((dept, index) => (
              <option key={index} value={dept}>
                {dept} {/* Render department name here */}
              </option>
            ))}
          </select>
          {errors.department_id && (
            <p className="text-red-500">{errors.department_id}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Designation</label>
          <select
            name="department_designation_id"
            value={employmentData.department_designation_id}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
            disabled={!employmentData.department_id}
          >
            <option value="" disabled>
              Select Designation
            </option>
            {filteredDesignations.length > 0 ? (
              filteredDesignations.map((designation) => (
                <option key={designation.id} value={designation.id}>
                  {designation.designation}
                </option>
              ))
            ) : (
              <option disabled>No designation available</option>
            )}
          </select>
          {errors.department_designation_id && (
            <p className="text-red-500">{errors.department_designation_id}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Working Office</label>
          <input
            type="text"
            name="employee_working_office"
            value={employmentData.employee_working_office}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          />

          {errors.working_office && (
            <p className="text-red-500">{errors.working_office}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Branch</label>
          <select
            name="branch_id"
            value={
              branches.find((branch) => branch.branch === employmentData.branch)
                ?.id || ""
            } // Map branch name to its id
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="" disabled>
              Select Branch
            </option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.branch} {/* Display the branch name */}
              </option>
            ))}
          </select>
          {errors.branch_id && (
            <p className="text-red-500">{errors.branch_id}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Employment Type</label>
          <select
            name="employment_type"
            // value={employmentData.employment_type || ""}
            value={
              employmentType.find(
                (emptype) =>
                  emptype.employment_type_name ===
                  employmentData.employment_type
              )?.id || ""
            }
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="" disabled>
              Select Employment Type
            </option>
            {employmentType && employmentType.length > 0 ? (
              employmentType.map((empType) => (
                <option key={empType.id} value={empType.id}>
                  {empType.employment_type_name}
                </option>
              ))
            ) : (
              <option disabled>No employment types available</option>
            )}
          </select>
          {errors.employment_type && (
            <p className="text-red-500">{errors.employment_type}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Supervisor</label>
          <select
            name="supervisor_id"
            // value={employmentData.supervisor_id || ""}
            value={
              supervisors.find(
                (supervisor) =>
                  supervisor.supervisor_fullname ===
                  employmentData.supervisor.supervisor_fullname
              )?.id || ""
            }
            onChange={handleChange}
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
            value={
              timetables.find(
                (timetable) =>
                  timetable.TimetableName ===
                  employmentData.timetable.TimetableName
              )?.TimetableID || ""
            } // Map TimetableName to TimetableID
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          >
            <option value="" disabled>
              Select Timetable
            </option>
            {timetables.map((timetable) => (
              <option key={timetable.TimetableID} value={timetable.TimetableID}>
                {timetable.TimetableName} {/* Display the timetable name */}
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
            value={
              employmentData.date_of_appointment
                ? moment(employmentData.date_of_appointment, [
                    "DD/MM/YYYY",
                    "YYYY-MM-DD",
                  ]).format("YYYY-MM-DD")
                : ""
            }
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
            value={employmentData.employee_basic_salary}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_basic_salary && (
            <p className="text-red-500">{errors.employee_basic_salary}</p>
          )}
        </div>
      </div>

      <div className="flex justify-between mt-8">
        {/* Previous Button with Left Arrow */}
        <button
          className="bg-gray-100 p-3 text-gray-400 rounded-lg flex items-center"
          onClick={handlePrev}
        >
          <FaArrowRight className="rotate-180 mr-2" /> Previous
        </button>

        {/* Next Button with Right Arrow */}
        <button
          className="bg-blue-500 p-3 text-white rounded-lg flex items-center"
          onClick={handleNext}
        >
          Save & Next <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default EmploymentDetailsEdit;
