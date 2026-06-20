import React, { useState, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  submitPersonalDetails,
  updatePersonalDetails,
} from "../../../Services/UserRegistration/UserRegistration";
import "./personal_details.css";

const PersonalDetails = ({
  handleNextStep,
  setMemberNo,
  organizationCode,
  organizationId,
}) => {
  const [formChanged, setFormChanged] = useState(false);
  const [member_no, setMemberNoInternal] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dobLocked, setDobLocked] = useState(false);
  const [genderLocked, setGenderLocked] = useState(false);
  const [formDataState, setFormDataState] = useState({
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
    personal_email: "",
    nationality: "Sri Lankan",
    religion: "",
    employee_nic: "",
    employee_land_no: "",
  });
  useEffect(() => {
    if (organizationId) {
      console.log(
        " Organization ID received in Personal Details:",
        organizationId,
      );
    } else {
      console.warn("⚠️ No organizationId passed to Personal Details!");
    }
  }, [organizationId]);

  useEffect(() => {
    console.log("Org Code from router:", organizationCode);
  }, [organizationCode]);

  const checkIfChanged = (updatedData) => {
    const stored = localStorage.getItem("personalDetails");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const changed = Object.keys(updatedData).some(
      (key) => updatedData[key] !== parsed[key],
    );
    setFormChanged(changed);
  };

  useEffect(() => {
    const stored = localStorage.getItem("personalDetails");
    if (stored) {
      const parsed = JSON.parse(stored);
      setFormDataState(parsed);
    }

    const storedMemberNo = localStorage.getItem("member_no");
    if (storedMemberNo) {
      setMemberNoInternal(storedMemberNo);
      setMemberNo(storedMemberNo);
    }
  }, []);

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formDataState.employee_fullname?.trim()) {
      newErrors.employee_fullname = "Full name is required";
    }

    if (!formDataState.employee_contact_no?.trim()) {
      newErrors.employee_contact_no = "Contact number is required";
    } else if (formDataState.employee_contact_no.startsWith("+94")) {
      const digits = formDataState.employee_contact_no.replace("+94", "");
      if (digits.length !== 9) {
        newErrors.employee_contact_no =
          "Sri Lanka numbers must be 9 digits after +94";
      }
    } else if (!/^\+?\d{7,15}$/.test(formDataState.employee_contact_no)) {
      newErrors.employee_contact_no = "Enter a valid phone number";
    }

    if (formDataState.employee_land_no?.startsWith("+94")) {
      const digits = formDataState.employee_land_no.replace("+94", "");
      if (digits.length !== 9) {
        newErrors.employee_land_no =
          "Sri Lanka land numbers must be exactly 10 digits";
      }
    } else if (
      formDataState.employee_land_no &&
      !/^\+?\d{7,15}$/.test(formDataState.employee_land_no)
    ) {
      newErrors.employee_land_no = "Enter a valid land number";
    }
    if (!formDataState.employee_no?.trim()) {
      newErrors.employee_no = "Employee number is required";
    }

    return newErrors;
  };

  const handleSaveOrUpdate = async () => {
    const token = getCookie("accessToken");
    const isSubmitted =
      localStorage.getItem("personalDetailsSubmitted") === "true";

    if (isSubmitted && !formChanged) {
      handleNextStep(true);
      return;
    }

    setLoading(true);

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
      setLoading(false);
      return;
    }

    const { employee_no, ...otherData } = formDataState;

    // remove organizationCode from employee_no before sending
    let cleanedEmployeeNo = employee_no;
    if (organizationCode && employee_no.startsWith(organizationCode)) {
      cleanedEmployeeNo = employee_no.slice(organizationCode.length);
    }

    const requestData = {
      ...otherData,
      employee_no: cleanedEmployeeNo,
      organization_id: organizationId,
      code: organizationCode,
    };

    //  Format land number properly for Sri Lanka
    if (requestData.employee_land_no) {
      let land = requestData.employee_land_no.replace(/\s+/g, "");
      if (land.startsWith("0")) {
        land = "+94" + land.slice(1);
      } else if (land.startsWith("94") && !land.startsWith("+94")) {
        land = "+94" + land.slice(2);
      }
      requestData.employee_land_no = land;
    }

    try {
      let response;
      if (isSubmitted && formChanged) {
        //  Update existing personal details
        response = await updatePersonalDetails(requestData, token);
      } else if (!isSubmitted) {
        //  First-time submission
        response = await submitPersonalDetails(requestData, token);
        let returnedEmployeeNo =
          response?.employee_no ||
          response?.data?.employee_no ||
          response?.data?.data?.employee_no;

        if (
          returnedEmployeeNo &&
          organizationCode &&
          !returnedEmployeeNo.startsWith(organizationCode)
        ) {
          returnedEmployeeNo = organizationCode + returnedEmployeeNo;
        }

        if (returnedEmployeeNo) {
          setMemberNoInternal(returnedEmployeeNo);
          setMemberNo(returnedEmployeeNo);
          localStorage.setItem("employee_no", returnedEmployeeNo);
          toast.success(
            `Employee No ${returnedEmployeeNo} saved to local storage`,
          );
        } else {
          console.warn("⚠️ No employee_no returned from backend:", response);
        }
      }

      if (response?.success) {
        toast.success(response.message || "Details saved successfully");
        setErrors({});
        localStorage.setItem("personalDetails", JSON.stringify(formDataState));
        localStorage.setItem("personalDetailsSubmitted", "true");

        //  Save org_id for later steps
        if (organizationId) {
          localStorage.setItem("org_id", organizationId);
        } else if (response?.org_id) {
          localStorage.setItem("org_id", response.org_id);
        }

        handleNextStep(true);
      } else {
        // Handle backend validation error
        if (response?.field && response?.message) {
          setErrors({ [response.field]: response.message });
        }
        toast.error(response?.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Submission error:", error);

      const backendMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Submission failed. Please try again.";

      const backendField = error?.response?.data?.field;
      if (backendField) {
        setErrors({ [backendField]: backendMsg });
      }

      toast.error(backendMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (
      organizationCode &&
      !formDataState.employee_no &&
      !localStorage.getItem("personalDetailsSubmitted")
    ) {
      setFormDataState((prev) => ({
        ...prev,
        employee_no: organizationCode,
      }));
    }
  }, [organizationCode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "employee_no" && organizationCode) {
      if (!value.startsWith(organizationCode)) {
        return;
      }
    }

    setFormDataState((prev) => {
      const updated = { ...prev, [name]: value };

      if (name === "employee_nic") {
        let nic = value.toUpperCase().replace(/\s+/g, "");
        nic = nic.replace(/[^0-9V]/g, "");
        if (nic.length > 12) nic = nic.slice(0, 12);

        if (nic.includes("V") && !/^\d{9}V$/.test(nic)) {
          nic = nic.replace(/V/g, "");
          if (/^\d{9}$/.test(nic.slice(0, 9))) nic = nic.slice(0, 9) + "V";
        }
        if (name === "employee_no" && organizationCode) {
          if (!value.startsWith(organizationCode)) return;

          const suffix = value.slice(organizationCode.length);
          if (suffix && !/^\d*$/.test(suffix)) return;
        }

        const updated = { ...prev, employee_nic: nic };
        const extracted = extractDOBFromNIC(nic);

        if (extracted) {
          updated.employee_dob = extracted.dob;
          updated.employee_gender = extracted.gender;
          setDobLocked(true);
          setGenderLocked(true);
        } else {
          updated.employee_dob = "";
          updated.employee_gender = "";
          setDobLocked(false);
          setGenderLocked(false);
        }

        checkIfChanged(updated);
        setErrors((prev) => ({ ...prev, employee_nic: null }));
        return updated;
      }

      checkIfChanged(updated);
      return updated;
    });

    setErrors((prev) => ({ ...prev, [name]: null }));
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
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        handleSaveOrUpdate();
      }}
    >
      <h1 className="text-xl font-semibold text-gray-800">Personal Details</h1>
      <p className="mb-6 text-gray-500">Enter Employee Details.</p>

      <div className="grid grid-cols-3 gap-6">
        {/* Employee Number – FIRST FIELD */}
        <InputField
          label="Employee No"
          name="employee_no"
          value={formDataState.employee_no}
          onChange={handleInputChange}
          error={errors.employee_no}
          required
          tabIndex={1}
          disabled={localStorage.getItem("personalDetailsSubmitted") === "true"}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSaveOrUpdate();
            }
          }}
        />
        {[
          "employee_fullname",
          "employee_name_initial",
          "employee_calling_name",
          "employee_permanent_address",
          "employee_temporary_address",
          "employee_nic",
          "employee_dob",
          "employee_email",
          "personal_email",
        ].map((field, index) => (
          <InputField
            key={field}
            label={field
              .replaceAll("_", " ")
              .replace(/\b\w/g, (l) => l.toUpperCase())}
            name={field}
            value={formDataState[field]}
            onChange={handleInputChange}
            type={field.includes("dob") ? "date" : "text"}
            error={errors[field]}
            required={
              field === "employee_fullname" || field === "employee_contact_no"
            }
            disabled={field === "employee_dob" && dobLocked}
            tabIndex={index + 2}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSaveOrUpdate();
              }
            }}
          />
        ))}

        {/* Contact Number */}
        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Employee Contact No
          </label>
          <PhoneInput
            country={"lk"}
            value={formDataState.employee_contact_no}
            onChange={(phone, country) => {
              let formatted = phone;
              if (country?.countryCode === "lk") {
                if (formatted.startsWith("94")) {
                  formatted = "+" + formatted.slice(0, 11);
                } else if (formatted.startsWith("+94")) {
                  formatted = formatted.slice(0, 12);
                }
              }
              handleInputChange({
                target: { name: "employee_contact_no", value: formatted },
              });
            }}
            inputClass="!w-full !py-2 !px-3 !border !rounded !pl-12"
            containerClass="!w-full"
            inputProps={{
              tabIndex: 20,
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveOrUpdate();
                }
              },
            }}
          />
          {errors.employee_contact_no && (
            <p className="text-red-500 text-sm mt-1">
              {errors.employee_contact_no}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            Employee Land No
          </label>
          <PhoneInput
            country={"lk"}
            value={formDataState.employee_land_no}
            onChange={(phone, country) => {
              let formatted = phone;

              // Only apply Sri Lanka specific formatting if country is LK
              if (country?.countryCode === "lk") {
                if (formatted.startsWith("94")) {
                  formatted = "+" + formatted.slice(0, 11);
                } else if (formatted.startsWith("+94")) {
                  formatted = formatted.slice(0, 12);
                }
              }
              // For other countries, just keep the formatted phone as is

              handleInputChange({
                target: {
                  name: "employee_land_no",
                  value: formatted,
                },
              });
            }}
            inputClass="!w-full !py-2 !px-3 !border !rounded !pl-12"
            containerClass="!w-full"
            inputProps={{
              tabIndex: 21,
              onKeyDown: (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSaveOrUpdate();
                }
              },
            }}
          />
          {errors.employee_land_no && (
            <p className="text-red-500 text-sm mt-1">
              {errors.employee_land_no}
            </p>
          )}
        </div>

        <SelectField
          label="Gender"
          name="employee_gender"
          value={formDataState.employee_gender}
          onChange={handleInputChange}
          options={["Male", "Female", "Other"]}
          error={errors["employee_gender"]}
          disabled={genderLocked}
        />

        <SelectField
          label="Marital Status"
          name="employee_marital_status"
          value={formDataState.employee_marital_status}
          onChange={handleInputChange}
          options={["Single", "Married", "Divorced"]}
          error={errors["employee_marital_status"]}
        />

        <SelectField
          label="Nationality"
          name="nationality"
          value={formDataState.nationality}
          onChange={handleInputChange}
          options={["Sri Lankan", "Other"]}
          error={errors["nationality"]}
        />

        <SelectField
          label="Religion"
          name="religion"
          value={formDataState.religion}
          onChange={handleInputChange}
          options={[
            "Buddhism",
            "Hinduism",
            "Islam",
            "Roman Catholic",
            "Non Roman Catholic",
          ]}
          error={errors["religion"]}
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="submit"
          className={`bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center hover:bg-blue-700 ${
            loading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? (
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          ) : (
            <>
              {formChanged ? "Update & Next" : "Next"}{" "}
              <FaArrowRight className="ml-2" />
            </>
          )}
        </button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </form>
  );
};

const InputField = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  error,
  required = false,
  disabled = false,
  tabIndex,
  onKeyDown,
}) => (
  <div>
    <label className="block text-sm text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {name === "employee_dob" && disabled && (
        <span className="ml-2 text-xs text-gray-500">
          (auto-filled from NIC)
        </span>
      )}
    </label>
    <input
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      disabled={disabled}
      tabIndex={tabIndex}
      onKeyDown={onKeyDown}
      className={`w-full border ${
        error ? "border-red-500" : "border-gray-300"
      } p-2 rounded ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      required={required}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  error,
  required = false,
  disabled = false,
}) => (
  <div>
    <label className="block text-sm text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
      {disabled && name === "employee_gender" && (
        <span className="ml-2 text-xs text-gray-500">
          (auto-filled from NIC)
        </span>
      )}
    </label>
    <select
      name={name}
      value={String(value ?? "")}
      onChange={onChange}
      disabled={disabled}
      className={`w-full border ${
        error ? "border-red-500" : "border-gray-300"
      } p-2 rounded ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      required={required}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          document.querySelector("form").dispatchEvent(new Event("submit"));
        }
      }}
    >
      <option value="">Select {label}</option>
      {options.map((opt, i) => {
        const isObj = typeof opt === "object" && opt !== null;
        const val = isObj ? (opt.id ?? opt.value ?? i) : opt;
        const labelText = isObj
          ? (opt.grade_name ?? opt.label ?? String(val))
          : opt;

        return (
          <option key={String(val)} value={String(val)}>
            {labelText}
          </option>
        );
      })}
    </select>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default PersonalDetails;
