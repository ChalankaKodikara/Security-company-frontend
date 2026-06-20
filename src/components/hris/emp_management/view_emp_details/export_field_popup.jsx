import React, { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";

const ExportFieldsPopup = ({ onClose, onExport }) => {
  const [selectedFields, setSelectedFields] = useState({
    employee_no: true,
    employee_fullname: true,
    department_name: true,
    employee_calling_name: true,
    employee_nic: true,
    employee_contact_no: true,
    employee_email: true,
    employee_active_status: true,
    designation_name: true,
    // Hidden fields
    employee_permanent_address: false,
    employee_gender: false,
    employee_dob: false,
  });

  const handleFieldChange = (field) => {
    setSelectedFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSelectAll = () => {
    const allSelected = Object.keys(selectedFields).every(
      (key) => selectedFields[key]
    );
    const newSelectedFields = {};
    Object.keys(selectedFields).forEach((key) => {
      newSelectedFields[key] = !allSelected;
    });
    setSelectedFields(newSelectedFields);
  };

  const handleExportClick = () => {
    onExport(selectedFields);
    onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-800 bg-opacity-50">
      <div className="bg-white p-8 rounded-lg w-full max-w-3xl relative">
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
          onClick={onClose}
        >
          <AiOutlineClose size={24} />
        </button>
        <h2 className="text-2xl font-semibold mb-4">Filter Fields</h2>
        <button
          className="p-2 bg-blue-500 text-white rounded"
          onClick={handleSelectAll}
        >
          {Object.keys(selectedFields).every((key) => selectedFields[key])
            ? "Deselect All"
            : "Select All"}
        </button>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {/* Render visible fields */}
          {Object.keys(selectedFields)
            .filter((key) => !["employee_permanent_address", "employee_gender", "employee_dob"].includes(key)) // Exclude hidden fields from UI
            .map((field, index) => (
              <div key={index}>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedFields[field]}
                    onChange={() => handleFieldChange(field)}
                  />
                  <span className="ml-2">{field.replace(/_/g, " ")}</span>
                </label>
              </div>
            ))}
        </div>
        {/* Hidden fields section */}
        <div className="mt-6 border-t pt-4">
          <h3 className="text-lg font-semibold mb-2">Add Extra Details Also</h3>
          {["employee_permanent_address", "employee_gender", "employee_dob"].map((field, index) => (
            <div key={index}>
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  checked={selectedFields[field]}
                  onChange={() => handleFieldChange(field)}
                />
                <span className="ml-2">{field.replace(/_/g, " ")}</span>
              </label>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            className="bg-purple-500 text-white px-4 py-2 rounded-md"
            onClick={handleExportClick}
          >
            Export as CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportFieldsPopup;
