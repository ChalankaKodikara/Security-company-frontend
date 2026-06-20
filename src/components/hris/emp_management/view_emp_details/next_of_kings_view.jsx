/** @format */

import React, { useState, useEffect } from "react";
import { FaArrowRight, FaTrashAlt } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { useDispatch, useSelector } from "react-redux";
import { updateEmployeeData } from "../../../../reducers/employeeSlice"; // Assuming you have this action defined

const Next_of_kings_View = ({
  data,
  setData,
  handleNextStep,
  handlePrevStep,
}) => {
  const dispatch = useDispatch();
  const [dependentData, setDependentData] = useState(data || []);

  console.log("dependant data ", dependentData[0]);

  const [errors, setErrors] = useState({});

  const handleDependentChange = (index, e) => {
    const { name, value } = e.target;
    const updatedDependentData = [...dependentData];
    updatedDependentData[index] = {
      ...updatedDependentData[index],
      [name]: value,
    };
    setDependentData(updatedDependentData);
  };

  const handleAddDependent = () => {
    if (dependentData.length < 5) {
      setDependentData([
        ...dependentData,
        {
          employee_dependent_relationship: "",
          employee_dependent_name: "",
          employee_dependent_nic: "",
          employee_dependent_dob: "",
        },
      ]);
    }
  };

  const handleRemoveDependent = (index) => {
    const updatedDependentData = dependentData.filter((_, i) => i !== index);
    setDependentData(updatedDependentData);
  };

  const handleNext = () => {
    dispatch(updateEmployeeData({ employee_dependent_details: dependentData })); // Save the dependent data to Redux
    setData(dependentData); // Pass data to the parent component
    handleNextStep(true); // Move to the next step
  };

  const handlePrev = () => {
    setData(dependentData); // Save the current data before going to previous
    handlePrevStep(true); // Go to the previous step
  };

  return (
    <div>
      <h1 className="text-[30px] font-bold col-span-3">Next Of Kin Details</h1>
      {/* Scrollable section for dependent data */}
      <div className="max-h-[400px] overflow-y-auto">
        {dependentData.map((dependent, index) => (
          <div
            key={index}
            className="grid grid-cols-2 gap-y-[30px] gap-x-[60px] text-[20px] mb-6"
          >
            <div>
              <label className="block text-gray-700">Relationship</label>
              <input
                type="text"
                name="employee_dependent_relationship"
                value={dependent.employee_dependent_relationship}
                disabled
                className="w-full border border-gray-300 p-2 rounded"
              />

              {errors[`employee_dependent_relationship_${index}`] && (
                <p className="text-red-500">
                  {errors[`employee_dependent_relationship_${index}`]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                name="employee_dependent_name"
                value={dependent.employee_dependent_name}
                disabled
                onChange={(e) => handleDependentChange(index, e)}
                className="w-full border border-gray-300 p-2 rounded"
              />
              {errors[`employee_dependent_name_${index}`] && (
                <p className="text-red-500">
                  {errors[`employee_dependent_name_${index}`]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700">DoB (Date of Birth)</label>
              <input
                type="date"
                name="employee_dependent_dob"
                value={dependent.employee_dependent_dob}
                onChange={(e) => handleDependentChange(index, e)}
                disabled
                className="w-full border border-gray-300 p-2 rounded"
              />
              {errors[`employee_dependent_dob_${index}`] && (
                <p className="text-red-500">
                  {errors[`employee_dependent_dob_${index}`]}
                </p>
              )}
            </div>

            {dependentData.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveDependent(index)}
                className="text-red-500 mt-2"
              >
                <FaTrashAlt />
              </button>
            )}
            {dependentData.length > 1 && (
              <hr className="mt-4 ml-4 w-[200%] border-t-1 border-gray-300 mx-0" />
            )}
          </div>
        ))}
      </div>

      {dependentData.length < 5 && (
        <button
          type="button"
          onClick={handleAddDependent}
          className="bg-blue-400 p-3 text-white rounded-lg flex items-center"
        >
          Add Another Next of Kin <IoMdAdd className="ml-2" />
        </button>
      )}

      <div className="flex justify-between mt-8">
        <button
          className="bg-gray-100 p-3 text-gray-400 rounded-lg flex items-center"
          onClick={handlePrev}
        >
          <FaArrowRight className="rotate-180 mr-2" /> Previous
        </button>

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

export default Next_of_kings_View;
