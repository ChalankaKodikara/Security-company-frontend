/** @format */

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { LuUpload } from "react-icons/lu";
import { FaRegFilePdf } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { saveEmployeeData } from "../../../../reducers/employeeSlice";

import { useDispatch, useSelector } from "react-redux";
const Bank_Details_View = ({
  data,
  setData,
  handlePrevStep,
  handleNextStep,
}) => {
  const [bankDetails, setBankDetails] = useState(data || {});

  const [errors, setErrors] = useState({});
  const dispatch = useDispatch();
  // Handle change in dependent data
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBankDetails((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validateFileType = (file) => {
    const allowedTypes = ["application/pdf"];
    return allowedTypes.includes(file.type);
  };

  // Handle file upload using react-dropzone
  const onDrop = (acceptedFiles) => {
    const validFile = acceptedFiles.find(validateFileType);

    if (validFile) {
      // Extract required metadata
      const fileMetadata = {
        lastModified: validFile.lastModified,
        lastModifiedDate: validFile.lastModifiedDate,
        name: validFile.name,
        size: validFile.size,
        type: validFile.type,
        webkitRelativePath: validFile.webkitRelativePath,
      };

      // Update local state with both file and metadata
      setBankDetails((prevData) => ({
        ...prevData,
        employee_bank_details_uploaded_file: validFile, // Save the File object locally
      }));

      // Dispatch metadata only to Redux
      dispatch(
        saveEmployeeData({
          ...bankDetails,
          employee_bank_details_uploaded_file: fileMetadata, // Save metadata to Redux
        })
      );
    } else {
      alert("Invalid file type. Please upload a PDF.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });
  // console.log(
  //   "bank employee_bank_details_uploaded_file",
  //   bankDetails.employee_bank_details_uploaded_file
  // );

  // Remove uploaded file
  const handleRemoveFile = () => {
    setBankDetails((prevData) => ({
      ...prevData,
      employee_bank_details_uploaded_file: null, // Remove the file from state
    }));
  };

  const handleNext = () => {
    setData(bankDetails); // Update parent state
    dispatch(saveEmployeeData(bankDetails)); // Save to Redux
    handleNextStep(true); // Move to the next step
  };

  const handlePrev = () => {
    setData(bankDetails); // Save the current data before going to previous
    handlePrevStep(true); // Go to the previous step
  };
  console.log("bank details", bankDetails);

  return (
    <div>
      <h1 className="text-[30px] font-bold col-span-3">Bank Details</h1>
      <div className="grid grid-cols-2 gap-y-[30px] gap-x-[60px] text-[20px]">
        <div>
          <label className="block text-gray-700">Account Number</label>
          <input
            type="text"
            name="employee_account_no"
            value={bankDetails.employee_account_no}
            disabled
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
            value={bankDetails.employee_account_name}
            onChange={handleChange}
            disabled
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
            value={bankDetails.employee_bank_name}
            onChange={handleChange}
            disabled
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
            value={bankDetails.employee_branch_name}
            onChange={handleChange}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_branch_name && (
            <p className="text-red-500">{errors.employee_branch_name}</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <div
          {...getRootProps()}
          className={`border-dashed border-2 p-6 rounded-lg ${
            isDragActive ? "bg-gray-200" : "bg-gray-0"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <LuUpload size={32} color="#4b5563" />
            {bankDetails.employee_bank_details_uploaded_file ? (
              <div className="mt-4 flex items-center">
                <FaRegFilePdf size={32} color="#4b5563" />
                <span className="text-gray-600 text-lg">
                  {bankDetails.employee_bank_details_uploaded_file.name}
                </span>
                <button
                  className="ml-4 text-red-500 font-bold"
                  onClick={handleRemoveFile}
                >
                  Remove
                </button>
              </div>
            ) : (
              <p className="mt-4 text-lg text-gray-600">
                {isDragActive
                  ? "Drop your file here..."
                  : "Drag and drop your Document here"}
              </p>
            )}
            {!bankDetails.employee_bank_details_uploaded_file &&
              !isDragActive && (
                <p className="mt-2 text-blue-500 cursor-pointer">
                  or <span className="font-semibold">Browse Document</span>
                </p>
              )}
          </div>
        </div>
      </div>

      <h1 className="text-[20px] font-bold col-span-3 mt-8">Visa Details</h1>
      <div className="grid grid-cols-2 gap-y-[30px] gap-x-[60px] text-[20px]">
        <div>
          <label className="block text-gray-700">Visa Category</label>
          <input
            type="text"
            name="employee_visa_category"
            value={bankDetails.employee_visa_category}
            onChange={handleChange}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_visa_category && (
            <p className="text-red-500">{errors.employee_visa_category}</p>
          )}
        </div>
        <div>
          <label className="block text-gray-700">Visa Office</label>
          <input
            type="text"
            name="employee_visa_office"
            value={bankDetails.employee_visa_office}
            onChange={handleChange}
            disabled
            className="w-full border border-gray-300 p-2 rounded"
          />
          {errors.employee_visa_office && (
            <p className="text-red-500">{errors.employee_visa_office}</p>
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

export default Bank_Details_View;
