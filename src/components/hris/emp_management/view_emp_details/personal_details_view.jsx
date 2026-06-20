/** @format */

import React, { useState, useEffect } from "react";
import moment from "moment";
import { useDispatch, useSelector } from "react-redux";
import PhoneInput from "react-phone-number-input";
import "./personal_details.css";
import "react-phone-number-input/style.css";
import { FaArrowRight } from "react-icons/fa";
import {
  updateEmployeeData,
  saveEmployeeData,
} from "../../../../reducers/employeeSlice";

const PersonalDetailsView = ({ handleNextStep }) => {
  const [employeeData, setEmployeeData] = useState({
    employee_no: "",
    employee_fullname: "",
    employee_name_initial: "",
    employee_calling_name: "",
    employee_dob: "",
    employee_gender: "",
    employee_marital_status: "",
    employee_contact_no: "",
    employee_permanent_address: "",
    employee_temporary_address: "",
    employee_email: "",
    employee_active_status: "ACTIVE",
    employee_nationality: "",
    employee_religion: "",
  });

  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();

  const [religions, setReligions] = useState([]);
  const [nationalities, setNationalities] = useState([]);

  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [religionsResponse, nationalitiesResponse] = await Promise.all([
          fetch(`${API_URL}/v1/hris/religionsAndNationalities/religions`),
          fetch(`${API_URL}/v1/hris/religionsAndNationalities/nationalities`),
        ]);

        const [religions, nationalities] = await Promise.all([
          religionsResponse.json(),
          nationalitiesResponse.json(),
        ]);
        setReligions(religions);
        setNationalities(nationalities);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Get the existing data from Redux
  const reduxEmployeeData = useSelector(
    (state) => state.employee.employee_details
  );

  // Populate state with Redux data when component mounts
  useEffect(() => {
    if (reduxEmployeeData) {
      setEmployeeData({
        ...employeeData,
        ...reduxEmployeeData,
      });
    }
    // console.log("all data in employee", reduxEmployeeData);
  }, [reduxEmployeeData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEmployeeData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const validateFields = () => {
    const newErrors = {};

    if (!employeeData.employee_no) {
      newErrors.employee_no = "Employee ID is required";
    }
    if (!employeeData.employee_fullname) {
      newErrors.employee_fullname = "Full Name is required";
    }
    if (!employeeData.employee_name_initial) {
      newErrors.employee_name_initial = "Initial Name is required";
    }
    if (!employeeData.employee_dob) {
      newErrors.employee_dob = "Employee DOB is required";
    }
    if (!employeeData.employee_gender) {
      newErrors.employee_gender = "Employee Gender is required";
    }
    if (!employeeData.employee_marital_status) {
      newErrors.employee_marital_status = "Mariatal Status is required";
    }
    if (!employeeData.employee_contact_no) {
      newErrors.employee_contact_no = "Employee contact No is required";
    }
    if (!employeeData.employee_email) {
      newErrors.employee_email = "Employee email is required";
    }

    // Add other validation rules as necessary

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAndNext = () => {
    if (validateFields()) {
      // Dispatch data to Redux
      console.log("employeeData next", employeeData);
      dispatch(saveEmployeeData(employeeData));

      // Proceed to the next step
      handleNextStep(true); // Pass `true` to indicate current form is valid
    } else {
      handleNextStep(false); // Pass `false` to indicate current form is invalid
    }
  };

  return (
    <div>
      <h1 className="text-[30px] font-bold col-span-3 ">Personal Details</h1>
      <div className="grid grid-cols-4 gap-y-[30px] gap-x-[60px] text-[20px]">
        <div>
          <label className="block text-gray-700">Employee ID</label>
          <input
            type="text"
            name="employee_no"
            value={employeeData.employee_no}
            disabled
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
            disabled
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
            disabled
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
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_calling_name && (
            <p className="text-red-500">{errors.employee_calling_name}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Date of Birth</label>
          <input
            type="date"
            name="employee_dob"
            value={
              employeeData.employee_dob
                ? moment(employeeData.employee_dob, ["YYYY-MM-DD"]).format(
                    "YYYY-MM-DD"
                  )
                : ""
            }
            onChange={handleChange}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_dob && (
            <p className="text-red-500">{errors.employee_dob}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Gender</label>
          <input
            type="text"
            name="employee_gender"
            value={employeeData.employee_gender}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_gender && (
            <p className="text-red-500">{errors.employee_gender}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Marital Status</label>{" "}
          <input
            type="text"
            name="employee_marital_status"
            value={employeeData.employee_marital_status}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_marital_status && (
            <p className="text-red-500">{errors.employee_marital_status}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Contact Number</label>

          <PhoneInput
            name=""
            international
            countryCallingCodeEditable={false}
            defaultCountry="RU"
            value={employeeData.employee_contact_no}
            onChange={(value) =>
              handleChange({ target: { name: "employee_contact_no", value } })
            }
            disabled
            className="custom-phone-input w-full border border-gray-300 p-2 rounded"
          />

          {errors.employee_contact_no && (
            <p className="text-red-500">{errors.employee_contact_no}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Nationality</label>
          <input
            type="text"
            name="nationality"
            value={employeeData.nationality}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_nationality && (
            <p className="text-red-500">{errors.employee_nationality}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700">Religion</label>
          <input
            type="text"
            name="religion"
            value={employeeData.religion}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_religion && (
            <p className="text-red-500">{errors.employee_religion}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Email Address</label>
          <input
            type="email"
            name="employee_email"
            value={employeeData.employee_email}
            onChange={handleChange}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_email && (
            <p className="text-red-500">{errors.employee_email}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700">Permanent Address</label>
          <input
            type="text"
            name="employee_permanent_address"
            value={employeeData.employee_permanent_address}
            onChange={handleChange}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_permanent_address && (
            <p className="text-red-500">{errors.employee_permanent_address}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Temporary Address</label>
          <input
            type="text"
            name="employee_temporary_address"
            value={employeeData.employee_temporary_address}
            onChange={handleChange}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_temporary_address && (
            <p className="text-red-500">{errors.employee_temporary_address}</p>
          )}
        </div>
      </div>
      <div className="mt-2 flex justify-end">
        <button
          className="bg-blue-500 p-3 text-white rounded-lg flex items-center"
          onClick={handleSaveAndNext} // Attach the click handler
        >
          Next <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default PersonalDetailsView;
