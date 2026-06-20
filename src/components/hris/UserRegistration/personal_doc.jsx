/** @format */
import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import { LuUpload } from "react-icons/lu";
import { AiOutlineClose } from "react-icons/ai";
import { FaRegFilePdf, FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import Cookies from "js-cookie";
const PersonalDoc = ({
  data,
  setData,
  handlePrevStep,
  resetToFirstStep,
  errorMessage,
}) => {
  const [uploadedFiles, setUploadedFiles] = useState(
    data?.employee_personal_documents || [],
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [employeeNo, setEmployeeNo] = useState("");
  const [loading, setLoading] = useState(false);
  const validateFileType = (file) => file.type === "application/pdf";

  const onDrop = (acceptedFiles) => {
    const validFiles = acceptedFiles.filter(validateFileType);

    if (validFiles.length > 0) {
      const updatedFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(updatedFiles);
      setData((prevData) => ({
        ...prevData,
        employee_personal_documents: updatedFiles,
      }));
    } else {
      toast.error("Invalid file type. Please upload only PDF documents.");
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  //  Remove file
  const handleRemoveFile = (index) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    setData((prevData) => ({
      ...prevData,
      employee_personal_documents: updatedFiles,
    }));
  };

  const handleFinish = async () => {
    const employee_no = localStorage.getItem("employee_no");

    if (!employee_no) {
      toast.error("Employee number not found.");
      return;
    }

    setEmployeeNo(employee_no);
    setLoading(true);

    const formData = new FormData();
    formData.append("employee_no", employee_no);
    uploadedFiles.forEach((file) => {
      formData.append("file", file);
    });

    const token = Cookies.get("accessToken");

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_FRONTEND_URL}/v1/hris/employees/files`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      //  Consider any 2xx status a success
      if (response.status >= 200 && response.status < 300) {
        setShowSuccess(true);
        toast.success("Documents uploaded successfully!");

        setTimeout(() => {
          localStorage.clear();
          setShowSuccess(false);
          resetToFirstStep();
        }, 8000);
      } else {
        // This should only run for unexpected non-2xx codes
        toast.error(`Unexpected response: ${response.statusText || "Unknown"}`);
      }
    } catch (error) {
      console.error("Error uploading documents:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to upload personal documents";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-montserrate">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <p className="text-[25px] font-semibold col-span-3 mt-8">
        Personal Documents
      </p>

      <div className="flex mt-8 space-x-8">
        {/* Left: Dropzone */}
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
                ? "Drop your files here..."
                : "Drag and drop your documents here"}
            </p>
            {!isDragActive && (
              <p className="mt-2 text-blue-500 cursor-pointer">
                or <span className="font-semibold">Browse Documents</span>
              </p>
            )}
          </div>
        </div>

        {/* Right: File list */}
        <div className="w-1/2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Uploaded Files</h2>
          </div>

          {uploadedFiles.length > 0 ? (
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-md">
                      <FaRegFilePdf size={20} color="#4b5563" />
                    </div>
                    <p className="text-gray-700">{file.name}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <AiOutlineClose size={20} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No documents uploaded</p>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="text-primary text-sm mt-4">{errorMessage}</div>
      )}

      {/* Navigation buttons */}
      <div className="flex justify-between mt-8">
        <button
          className={`bg-blue-500 p-3 text-white rounded-lg flex items-center justify-center min-w-[160px] ${
            loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-600"
          }`}
          onClick={handleFinish}
          disabled={loading}
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                ></path>
              </svg>
              Uploading...
            </>
          ) : (
            <>
              Save & Finish <FaArrowRight className="ml-2" />
            </>
          )}
        </button>
      </div>

      {/*  Success popup */}
      {showSuccess && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center animate-bounce">
            <h2 className="text-xl font-bold text-green-600 mb-2">
              🎉 Success!
            </h2>
            <p className="text-gray-700">
              Employee <b>{employeeNo}</b> onboarded successfully.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Redirecting to start...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDoc;
