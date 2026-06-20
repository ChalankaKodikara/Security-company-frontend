/** @format */

import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import moment from "moment";
import { FaArrowRight } from "react-icons/fa";

import { useDispatch, useSelector } from "react-redux";
import { saveEmployeeData } from "../../../../reducers/employeeSlice";
import Cookies from "js-cookie";

const EmploymentDetailsView = ({
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

  console.log("data employeemnent ", data);

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

  // console.log("branches", branches);
  const filteredBranches = branches.filter(
    (branch) => branch.branch === employmentData.branch_id
  );

  console.log("filteredBranches", filteredBranches);
  // console.log("supervisors", supervisors);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmploymentData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNext = () => {
    // Dispatch data to Redux
    dispatch(saveEmployeeData(employmentData));
    setData(employmentData);

    // Proceed to the next step
    handleNextStep(true); // Pass `true` to indicate current form is valid
  };

  const handlePrev = () => {
    setData(employmentData); // Save the current data before going to previous
    handlePrevStep(true); // Go to the previous step
  };

  console.log("emplyement data branch id ", employmentData);

  return (
    <div>
      <h1 className="text-[30px] font-bold col-span-3">Employment Details</h1>
      <div className="grid grid-cols-3 gap-y-[30px] gap-x-[60px] text-[20px] mt-5">
        <div>
          <label className="block text-gray-700">Department</label>
          <input
            type="text"
            name="department_id"
            value={employmentData.department_id}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />

          {errors.department_id && (
            <p className="text-red-500">{errors.department_id}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Designation</label>
          <input
            type="text"
            name="department_designation_id"
            value={
              designations.find(
                (emptype) =>
                  emptype.department_designation_id === employmentData.id
              )?.id || ""
            }
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />

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
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />

          {errors.working_office && (
            <p className="text-red-500">{errors.working_office}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Branch</label>
          <input
            type="text"
            name="branch"
            value={employmentData.branch}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.branch_id && (
            <p className="text-red-500">{errors.branch_id}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Employment Type</label>
          <input
            type="text"
            name="employment_type"
            value={employmentData.employment_type}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employment_type && (
            <p className="text-red-500">{errors.employment_type}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Supervisor</label>
          <input
            type="text"
            name="supervisor_id"
            value={employmentData.supervisor.supervisor_fullname}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.supervisor_id && (
            <p className="text-red-500">{errors.supervisor_id}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Timetable</label>
          <input
            type="text"
            name="timetable_id"
            value={employmentData.timetable.TimetableName}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
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
            disabled
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
            disabled
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
          Next <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default EmploymentDetailsView;
