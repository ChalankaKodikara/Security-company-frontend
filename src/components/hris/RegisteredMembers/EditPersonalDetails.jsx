/** @format */
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { apiFetch } from "../../../utils/apiClient";

const EditPersonalDetails = ({ onClose, personalData, onUpdateSuccess }) => {
  const [formData, setFormData] = useState({
    employee_fullname: personalData?.employee_fullname || "",
    employee_name_initial: personalData?.employee_name_initial || "",
    employee_calling_name: personalData?.employee_calling_name || "",
    employee_dob: personalData?.employee_dob
      ? new Date(personalData.employee_dob).toISOString().split("T")[0]
      : "",
    employee_gender: personalData?.employee_gender || "",
    employee_marital_status: personalData?.employee_marital_status || "",
    employee_contact_no: personalData?.employee_contact_no || "",
    employee_permanent_address: personalData?.employee_permanent_address || "",
    employee_temporary_address: personalData?.employee_temporary_address || "",
    employee_email: personalData?.employee_email || "",
    personal_email: personalData?.personal_email || "",
    nationality: personalData?.nationality || "",
    religion: personalData?.religion || "",
    employee_land_no: personalData?.employee_land_no || "",
    employee_nic: personalData?.employee_nic || "", // NIC FIELD
  });
  const [showConfirm, setShowConfirm] = useState(false);

  const inputStyle = "w-full border border-gray-300 p-2 rounded text-sm";
  const labelStyle = "block text-sm text-gray-600 mb-1";
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const RELIGIONS = [
    "Buddhism",
    "Hinduism",
    "Islam",
    "Roman Catholic",
    "Non Roman Catholic",
  ];
  const NATIONALITIES = ["Sri Lankan", "Other"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "employee_nic") {
      const nic = value.trim();
      const extracted = extractDOBFromNIC(nic);

      setFormData((prev) => ({
        ...prev,
        [name]: nic,
        employee_dob: extracted?.dob || "",
        employee_gender: extracted?.gender || "",
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files[0]) {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const downloadFile = async (filePath) => {
    if (!filePath) return;

    toast.info("Preparing download...", { autoClose: 1500 });

    try {
      const response = await apiFetch(
        `${API_URL}/downloads/download?path=${encodeURIComponent(filePath)}`
      );

      if (!response.ok)
        throw new Error(`Download failed: ${response.statusText}`);

      const disposition = response.headers.get("content-disposition");
      let filename = filePath.split("/").pop();
      if (disposition && disposition.indexOf("attachment") !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, "");
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Could not download the file.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { birth_certificate, marriage_certificate, ...jsonOnly } = formData;

      const payload = {
        ...jsonOnly,
        employee_contact_no: formData.employee_contact_no.startsWith("+")
          ? formData.employee_contact_no
          : `+${formData.employee_contact_no}`,
        employee_land_no: formData.employee_land_no
          ? formData.employee_land_no.startsWith("+")
            ? formData.employee_land_no
            : `+${formData.employee_land_no}`
          : "",
        employee_nic: formData.employee_nic || "",
      };

      const authToken = Cookies.get("accessToken");
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/employee/personal/${personalData.employee_no}`,
        {
          method: "PUT",
         
          body: JSON.stringify(payload),
        }
      );

      const result = await res.json();

      if (!res.ok || !result?.success) {
        toast.error(result?.message || "Update failed!");
        return;
      }

      toast.success(result?.message || "Updated successfully!");
      onUpdateSuccess && onUpdateSuccess();
      onClose && onClose();
    } catch (err) {
      console.error("Update error:", err);
      toast.error("Error while updating!");
    }
  };

  const extractDOBFromNIC = (nic) => {
    let year = "";
    let dayText = 0;
    let gender = "";
    let month = "";
    let day = "";

    if (!(nic.length === 10 || nic.length === 12)) return null;

    if (nic.length === 10 && /^\d{9}[vVxX]$/.test(nic)) {
      year = "19" + nic.substring(0, 2);
      dayText = parseInt(nic.substring(2, 5));
    } else if (nic.length === 12 && /^\d{12}$/.test(nic)) {
      year = nic.substring(0, 4);
      dayText = parseInt(nic.substring(4, 7));
    } else {
      return null;
    }

    if (dayText > 500) {
      gender = "Female";
      dayText -= 500;
    } else {
      gender = "Male";
    }

    if (dayText < 1 || dayText > 366) return null;

    if (dayText > 335) {
      day = dayText - 335;
      month = "12";
    } else if (dayText > 305) {
      day = dayText - 305;
      month = "11";
    } else if (dayText > 274) {
      day = dayText - 274;
      month = "10";
    } else if (dayText > 244) {
      day = dayText - 244;
      month = "09";
    } else if (dayText > 213) {
      day = dayText - 213;
      month = "08";
    } else if (dayText > 182) {
      day = dayText - 182;
      month = "07";
    } else if (dayText > 152) {
      day = dayText - 152;
      month = "06";
    } else if (dayText > 121) {
      day = dayText - 121;
      month = "05";
    } else if (dayText > 91) {
      day = dayText - 91;
      month = "04";
    } else if (dayText > 60) {
      day = dayText - 60;
      month = "03";
    } else if (dayText > 31) {
      day = dayText - 31;
      month = "02";
    } else {
      month = "01";
      day = dayText;
    }

    const formattedDay = String(day).padStart(2, "0");
    const dob = `${year}-${month}-${formattedDay}`;

    return { dob, gender };
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end h-[100%]">
      <div
        className="absolute inset-0 bg-white/10 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative bg-white w-full sm:w-[700px] h-full p-6 shadow-xl overflow-y-auto z-10"
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Edit Personal Details
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-gray-700"
        >
          {[
            ["employee_fullname", "Employee Full Name"],
            ["employee_name_initial", "Name with Initial"],
            ["employee_calling_name", "Calling Name"],
            ["employee_nic", "NIC"],
            [
              "employee_permanent_address",
              "Permanent Address",
              "text",
              [],
              "col-span-2",
            ],
            [
              "employee_temporary_address",
              "Temporary Address",
              "text",
              [],
              "col-span-2",
            ],
            ["employee_dob", "Date of Birth", "date"],
            ["employee_gender", "Gender", "select", ["Male", "Female"]],
            [
              "employee_marital_status",
              "Marital Status",
              "select",
              ["Single", "Married"],
            ],
            ["employee_email", "Official Email"],
            ["personal_email", "Personal Email"],
            ["nationality", "Nationality", "select", NATIONALITIES],
            ["religion", "Religion", "select", RELIGIONS],
          ].map(([key, label, type = "text", options, className = ""]) => (
            <div key={key} className={className}>
              <label className={labelStyle}>{label}</label>
              {type === "select" ? (
                <select
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className={inputStyle}
                >
                  <option value="">Select...</option>
                  {formData[key] &&
                    Array.isArray(options) &&
                    !options.includes(formData[key]) && (
                      <option value={formData[key]}>{formData[key]}</option>
                    )}
                  {options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={type}
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className={inputStyle}
                  disabled={key === "employee_dob"} // freeze DOB
                />
              )}
            </div>
          ))}

          {/* Contact Number with Country Code */}
          <div>
            <label className={labelStyle}>Contact Number</label>
            <PhoneInput
              country={"lk"}
              value={formData.employee_contact_no}
              onChange={(phone, country) => {
                let formatted = phone.startsWith("+") ? phone : `+${phone}`;
                if (country?.countryCode === "lk" && !formatted.startsWith("+94")) {
                  formatted = "+94" + formatted.replace(/^\+?94?/, "");
                }
                handleChange({
                  target: { name: "employee_contact_no", value: formatted },
                });
              }}
              inputClass="!w-full !py-2 !px-3 !border !rounded !pl-12"
              containerClass="!w-full"
            />
          </div>

          {/* Land Number with Country Code */}
          <div>
            <label className={labelStyle}>Land Number</label>
            <PhoneInput
              country={"lk"}
              value={formData.employee_land_no}
              onChange={(phone) => {
                let formatted = phone.startsWith("+") ? phone : `+${phone}`;
                if (!formatted.startsWith("+94")) {
                  formatted = "+94" + formatted.replace(/^\+?94?/, "");
                }
                if (formatted.length > 12) {
                  formatted = formatted.slice(0, 12);
                }
                handleChange({
                  target: { name: "employee_land_no", value: formatted },
                });
              }}
              inputClass="!w-full !py-2 !px-3 !border !rounded !pl-12"
              containerClass="!w-full"
            />
          </div>

         

          <div className="col-span-2 flex justify-end gap-4 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-200 px-4 py-2 rounded text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="bg-blue-500 px-4 py-2 text-white rounded hover:bg-blue-700"
            >
              Update
            </button>

          </div>
        </form>
      </motion.div>
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Update
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to update this employee’s personal details?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-200 px-4 py-2 rounded text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  setShowConfirm(false);
                  handleSubmit(e);
                }}
                className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
              >
                Yes, Update
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default EditPersonalDetails;
