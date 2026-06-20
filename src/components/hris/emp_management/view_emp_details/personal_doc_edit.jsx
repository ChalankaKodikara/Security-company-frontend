/** @format */

import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { LuUpload } from "react-icons/lu"; // Upload icon
import { AiOutlineClose } from "react-icons/ai"; // Close icon
import { FaRegFilePdf } from "react-icons/fa";
import { FaArrowRight } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { saveEmployeeData } from "../../../../reducers/employeeSlice";

const PersonalDocEdit = ({
  data,
  setData,
  handlePrevStep,
  handleNextStep,
  errorMessage,
}) => {
  const [uploadedFile, setUploadedFile] = useState(data || null); // Initialize with parent data or null
  const dispatch = useDispatch();

  const validateFileType = (file) => {
    const allowedTypes = ["application/pdf"];
    return allowedTypes.includes(file.type);
  };

  // Handle file upload using react-dropzone

  const onDrop = (acceptedFiles) => {
    // Find the first valid file
    const validFile = acceptedFiles.find(validateFileType);

    if (validFile) {
      // Update state and Redux store with the valid file
      setUploadedFile((prevData) => ({
        ...prevData,
        employee_personal_document: validFile,
      }));

      dispatch(
        setUploadedFile({
          ...uploadedFile,
          employee_personal_document: validFile,
        })
      );
    } else {
      // Handle invalid files (e.g., show an error message)
      alert("Invalid file type. Please upload a PDF.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  // Remove uploaded file
  const handleRemoveFile = () => {
    setUploadedFile((prevData) => ({
      ...prevData,
      employee_personal_document: null, // Remove the file from state
    }));
  };

  const handleNext = () => {
    dispatch(saveEmployeeData(uploadedFile)); // Save to Redux
    setData(uploadedFile); // Save to parent state
    handleNextStep(true); // Move to the next step
  };

  const handlePrev = () => {
    setData(uploadedFile); // Save current state to parent before going back
    handlePrevStep(true); // Go to the previous step
  };

  return (
    <div>
      <h1 className="text-[30px] font-bold col-span-3">Personal Document</h1>

      <div className="flex mt-8 space-x-8">
        {/* Left: Drag-and-Drop Area */}
        <div
          {...getRootProps()}
          className={`border-dashed border-2 p-6 rounded-lg w-1/2 ${
            isDragActive ? "bg-gray-200" : "bg-gray-100"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center">
            <LuUpload size={32} color="#4b5563" />
            <p className="mt-4 text-lg text-gray-600">
              {isDragActive
                ? "Drop your file here..."
                : "Drag and drop your document here"}
            </p>
            {!uploadedFile?.employee_personal_document && !isDragActive && (
              <p className="mt-2 text-blue-500 cursor-pointer">
                or <span className="font-semibold">Browse Document</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: Uploaded File Preview */}
        <div className="w-1/2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Uploaded File</h2>
          </div>

          {uploadedFile?.employee_personal_document ? (
            <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-md">
                  <FaRegFilePdf size={20} color="#4b5563" />
                </div>
                <p className="text-gray-700">
                  {uploadedFile.employee_personal_document.name}
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="text-red-500 hover:text-red-700"
              >
                <AiOutlineClose size={20} />
              </button>
            </div>
          ) : (
            <p className="text-gray-500">No document uploaded</p>
          )}
        </div>
      </div>

      {/* Display error message */}
      {errorMessage && (
        <div className="text-red-600 text-sm mt-4">{errorMessage}</div>
      )}

      {/* Navigation Buttons */}
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
          disabled={!uploadedFile} // Disable if no file is uploaded
        >
          Update & Finish <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default PersonalDocEdit;
