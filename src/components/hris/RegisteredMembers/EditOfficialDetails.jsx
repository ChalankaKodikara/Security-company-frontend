/** @format */

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast, ToastContainer } from "react-toastify";
import Select from "react-select";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";

const EditOfficialDetails = ({
  onClose,
  officialData,
  onUpdateSuccess,
  organizationId,
}) => {
  console.log(" Received organizationId:", organizationId);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [timetableOptions, setTimetableOptions] = useState([]);
  const employeeCategoryOptions = [
    { value: "Direct", label: "Direct" },
    { value: "Indirect", label: "Indirect" },
    { value: "JSO ", label: "JSO " },
    { value: "OIC", label: "OIC" },
    { value: "VO", label: "VO" },
    { value: "HO_STAFF", label: "HO Staff" },
  ];
  const locationTypeOptions = [
    { value: "COLOMBO", label: "Colombo" },
    { value: "OUTSTATION", label: "Outstation" },
  ];
  const [formData, setFormData] = useState({
    timetable_id: officialData?.timetable_id || "",
    employee_category: officialData?.employee_category || "",
    payroll_location_type: officialData?.payroll_location_type || "",
    date_of_appointment: officialData?.date_of_appointment
      ? new Date(officialData.date_of_appointment).toISOString().split("T")[0]
      : "",
    department_designation_id: officialData?.department_designation_id || "",
    working_office:
      (officialData?.working_office && String(officialData.working_office)) ||
      "",
    branch:
      (officialData?.branch_id && String(officialData.branch_id)) ||
      (officialData?.branch && String(officialData.branch)) ||
      "",
    employment_type:
      (officialData?.employment_type && String(officialData.employment_type)) ||
      "",
    employee_basic_salary: officialData?.employee_basic_salary
      ? String(officialData.employee_basic_salary)
      : "",
    employee_active_status:
      officialData?.employee_active_status?.toLowerCase() === "active"
        ? "Active"
        : officialData?.employee_active_status?.toLowerCase() === "inactive"
          ? "Inactive"
          : "",
    epf_no: officialData?.epf_no || "",
    designated_mail: Array.isArray(officialData?.designated_mails)
      ? officialData.designated_mails.map((m) => m.designated_mail).join(", ")
      : "",
    grade_id: officialData?.grade_id || "",
    supervisor_id: officialData?.supervisor_id || "",
    timetable_name: officialData?.timetable_name || "",
  });

  // ----- OPTIONS -----
  const [designationOptions, setDesignationOptions] = useState([]);
  const [workingOfficeOptions, setWorkingOfficeOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);

  useEffect(() => {
    const token = Cookies.get("accessToken");

    const fetchSupervisors = async () => {
      try {
        const res = await fetch(
          `${API_URL}/v1/hris/supervisors/getSupervisors`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        const json = await res.json();
        if (Array.isArray(json)) {
          setSupervisorOptions(
            json.map((s) => ({
              value: s.id,
              label: `${s.supervisor_fullname} (${s.supervisor_employee_no})`,
            })),
          );
        }
      } catch (err) {
        console.error("Error fetching supervisors:", err);
      }
    };

    fetchSupervisors();
  }, [API_URL]);

  // Helpers to read the readable names from officialData (coming from parent)
  const readable = {
    designationTitle:
      officialData?.designation?.title || officialData?.designation_title || "",
    workingOfficeName:
      officialData?.workingOfficeDetails?.name ||
      officialData?.working_office_name ||
      "",
    employmentTypeName:
      officialData?.employmentTypeDetails?.type_name ||
      officialData?.employment_type_name ||
      "",
  };

  // ----- FETCH OPTIONS (IDs as values) -----
  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!organizationId) {
      console.warn(
        "⚠️ No organizationId provided. Skipping designation fetch.",
      );
      return;
    }

    const fetchOptions = async () => {
      try {
        const designationRes = await apiFetch(
          `${API_URL}/v1/hris/organizations/designations?organization_id=${organizationId}`,
        );

        //  👉 ADD YOUR CODE HERE
        const des = await designationRes.json();

        if (des?.success && Array.isArray(des.data)) {
          setDesignationOptions(
            des.data.map((d) => ({
              value: String(d.id),
              label: `${d.title} (${d?.Department?.name || "No Dept"})`,
            })),
          );
        }
      } catch (error) {
        console.error("❌ Failed to load designations:", error);
        toast.error("Failed to load designation list");
      }
    };

    fetchOptions();
  }, [API_URL, organizationId]);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!organizationId) {
      console.warn(
        "⚠️ No organizationId provided. Skipping working office fetch.",
      );
      return;
    }

    const fetchWorkingOffices = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/working-offices?organization_id=${organizationId}`,
        );

        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          setWorkingOfficeOptions(
            json.data.map((o) => ({
              value: String(o.id),
              label: o.name,
            })),
          );
          console.log(" Working offices loaded:", json.data);
        } else {
          console.warn("⚠️ Unexpected response format:", json);
        }
      } catch (error) {
        console.error("❌ Failed to fetch working offices:", error);
        toast.error("Failed to load working office options.");
      }
    };

    fetchWorkingOffices();
  }, [API_URL, organizationId]);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!organizationId) {
      console.warn("⚠️ No organizationId provided. Skipping branch fetch.");
      return;
    }

    const fetchBranches = async () => {
      const token = Cookies.get("accessToken");
      if (!organizationId) return;

      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/branch/all?organization_id=${organizationId}`,
        );
        const json = await res.json();

        //  handle both formats
        const branchArray = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : [];

        if (branchArray.length > 0) {
          setBranchOptions(
            branchArray.map((b) => ({
              value: String(b.id),
              label: b.branch,
            })),
          );
          console.log(" Branch options loaded:", branchArray);
        } else {
          console.warn("⚠️ No branch data found:", json);
        }
      } catch (err) {
        console.error("❌ Failed to fetch branches:", err);
      }
    };

    fetchBranches();
  }, [API_URL, organizationId]);

  // ----- HANDLERS -----
  const handleChange = (e) => {
    const { name, value } = e.target;
    // Keep controlled numeric/text input as string; parse when sending
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field, selected) => {
    setFormData((prev) => ({ ...prev, [field]: selected?.value || "" }));
  };

  // ----- SUBMIT -----
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!officialData?.employee_no) {
      toast.error("Employee number is missing.");
      return;
    }

    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    const payload = {
      working_office: formData.working_office || "",
      branch: Number(formData.branch) || null,
      employment_type: Number(formData.employment_type) || null,
      date_of_appointment: formData.date_of_appointment || "",
      employee_basic_salary: Number(formData.employee_basic_salary || 0),
      employee_active_status: formData.employee_active_status,
      department_designation_id:
        Number(formData.department_designation_id) || null,
      grade_id: Number(formData.grade_id) || null,
      epf_no: formData.epf_no || "",
      supervisor_id: Number(formData.supervisor_id) || null,
      designated_mail: formData.designated_mail || "",
      employee_category: formData.employee_category || "",
      payroll_location_type: formData.payroll_location_type || "",
      timetable_id: formData.timetable_id
        ? Number(formData.timetable_id)
        : null,
    };

    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/upload/official-details/${officialData.employee_no}`,
        {
          method: "PUT",

          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();
      if (res.ok && result?.success) {
        toast.success(
          result?.message || "Official details updated successfully!",
        );
        onUpdateSuccess && onUpdateSuccess();
        onClose && onClose();
      } else {
        toast.error(result?.message || "Update failed.");
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("An error occurred while updating.");
    }
  };

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!organizationId) {
      console.warn("⚠️ No organizationId provided. Skipping grade fetch.");
      return;
    }

    const fetchGrades = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/grade/employee-grades`,
          {},
        );

        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          setGradeOptions(
            json.data.map((g) => ({
              value: String(g.id),
              label: g.grade_name,
            })),
          );
          console.log(" Grade options loaded:", json.data);
        } else {
          console.warn("⚠️ Unexpected grade response:", json);
        }
      } catch (err) {
        console.error("❌ Failed to fetch grades:", err);
        toast.error("Failed to load grade options.");
      }
    };

    fetchGrades();
  }, [API_URL, organizationId]);

  // ----- PRESELECT VALUES (robust fallbacks using readable names) -----
  const selectedDesignation =
    designationOptions.find(
      (opt) => String(opt.value) === String(formData.department_designation_id),
    ) ||
    (readable.designationTitle
      ? designationOptions.find((opt) =>
        opt.label
          ?.toLowerCase()
          .startsWith(readable.designationTitle.toLowerCase()),
      )
      : null) ||
    null;

  const selectedWorkingOffice =
    workingOfficeOptions.find(
      (opt) => String(opt.value) === String(formData.working_office),
    ) ||
    (readable.workingOfficeName
      ? workingOfficeOptions.find(
        (opt) =>
          opt.label?.toLowerCase() ===
          readable.workingOfficeName.toLowerCase(),
      )
      : null) ||
    null;

  const selectedEmploymentType =
    employmentTypeOptions.find(
      (opt) => String(opt.value) === String(formData.employment_type),
    ) ||
    (readable.employmentTypeName
      ? employmentTypeOptions.find(
        (opt) =>
          opt.label?.toLowerCase() ===
          readable.employmentTypeName.toLowerCase(),
      )
      : null) ||
    null;

  const selectedBranch =
    branchOptions.find(
      (opt) => String(opt.value) === String(formData.branch),
    ) || null;

  const selectedGrade =
    gradeOptions.find(
      (opt) => String(opt.value) === String(formData.grade_id),
    ) || null;

  const selectedStatus = formData.employee_active_status
    ? {
      value: formData.employee_active_status,
      label: formData.employee_active_status,
    }
    : null;

  useEffect(() => {
    const token = Cookies.get("accessToken");

    const fetchTimetables = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/timetable/gettimetable`);

        const data = await res.json();

        if (Array.isArray(data)) {
          setTimetableOptions(
            data.map((t) => ({
              value: String(t.TimetableID),
              label: t.TimetableName,
              raw: t, // 👈 keep full object for preview
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch timetables", err);
      }
    };

    fetchTimetables();
  }, [API_URL]);

  useEffect(() => {
    if (!timetableOptions.length || !officialData?.timetable_id) return;

    const found = timetableOptions.find(
      (t) => Number(t.value) === Number(officialData.timetable_id),
    );

    if (found) {
      setSelectedTimetable(found);
      setFormData((prev) => ({
        ...prev,
        timetable_id: Number(found.value),
      }));
    }
  }, [timetableOptions, officialData]);

  useEffect(() => {
    const token = Cookies.get("accessToken");
    if (!organizationId) return;

    const fetchEmploymentTypes = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/employment-types?organization_id=${organizationId}`,
        );

        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          setEmploymentTypeOptions(
            json.data.map((t) => ({
              value: String(t.id),
              label: t.type_name,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch employment types", err);
        toast.error("Failed to load employment types");
      }
    };

    fetchEmploymentTypes();
  }, [API_URL, organizationId]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-white/10 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3 }}
        className="relative bg-white w-full sm:w-[700px] h-screen p-6 overflow-y-auto shadow-xl z-10"
      >
        <h2 className="text-lg font-semibold mb-4 border-b pb-3">
          Edit Official Details
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-sm"
        >
          {/* Date of Appointment */}
          <div>
            <label className="block mb-1 text-gray-600">
              Date of Appointment
            </label>
            <input
              type="date"
              name="date_of_appointment"
              value={formData.date_of_appointment}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Designation */}
          <div>
            <label className="block mb-1 text-gray-600">Designation</label>
            <Select
              options={designationOptions}
              value={selectedDesignation}
              onChange={(opt) =>
                handleSelectChange("department_designation_id", opt)
              }
              placeholder="Select Designation"
              isSearchable
            />
          </div>

          {/* Working Office */}
          <div>
            <label className="block mb-1 text-gray-600">Working Office</label>
            <Select
              options={workingOfficeOptions}
              value={workingOfficeOptions.find(
                (o) => o.value === formData.working_office,
              )}
              onChange={(selected) =>
                setFormData({
                  ...formData,
                  working_office: selected?.value || "",
                })
              }
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block mb-1 text-gray-600">Branch</label>
            <Select
              options={branchOptions}
              value={
                branchOptions.find(
                  (b) => String(b.value) === String(formData.branch),
                ) || null
              }
              onChange={(selected) =>
                setFormData({
                  ...formData,
                  branch: selected?.value || "",
                })
              }
              placeholder={
                branchOptions.length > 0
                  ? "Select Branch"
                  : "Loading branches..."
              }
              isSearchable
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-600">Time Table</label>
            <Select
              options={timetableOptions}
              value={selectedTimetable}
              onChange={(opt) => {
                setSelectedTimetable(opt);
                setFormData((prev) => ({
                  ...prev,
                  timetable_id: opt ? Number(opt.value) : null,
                }));
              }}
              placeholder="Select Time Table"
              isSearchable
            />
          </div>

          {/* Employment Type (disabled) */}
          <div>
            <label className="block mb-1 text-gray-600">Employment Type</label>
            <Select
              options={employmentTypeOptions}
              value={selectedEmploymentType}
              onChange={(opt) => handleSelectChange("employment_type", opt)}
              placeholder="Select Employment Type"
              isDisabled
            />
          </div>
          {/* Employee Category */}
          <div>
            <label className="block mb-1 text-gray-600">
              Employee Category
            </label>
            <Select
              options={employeeCategoryOptions}
              value={
                employeeCategoryOptions.find(
                  (opt) => opt.value === formData.employee_category,
                ) || null
              }
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  employee_category: opt?.value || "",
                }))
              }
              placeholder="Select Employee Category"
              isSearchable={false}
            />
          </div>

          {/* Payroll Location Type */}
          <div>
            <label className="block mb-1 text-gray-600">
              Payroll Location Type
            </label>
            <Select
              options={locationTypeOptions}
              value={
                locationTypeOptions.find(
                  (opt) => opt.value === formData.payroll_location_type,
                ) || null
              }
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  payroll_location_type: opt?.value || "",
                }))
              }
              placeholder="Select Location Type"
              isSearchable={false}
            />
          </div>

          {/* EPF Number */}
          <div>
            <label className="block mb-1 text-gray-600">EPF Number</label>
            <input
              type="text"
              name="epf_no"
              value={formData.epf_no}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Enter EPF Number"
            />
          </div>

          {/* Basic Salary */}
          <div>
            <label className="block mb-1 text-gray-600">Basic Salary</label>
            <input
              type="number"
              name="employee_basic_salary"
              value={formData.employee_basic_salary}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
            />
          </div>

          {/* Designated Mails */}
          <div className="col-span-2">
            <label className="block mb-1 text-gray-600">Designated Mails</label>
            <input
              type="text"
              name="designated_mail"
              value={formData.designated_mail}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded p-2"
              placeholder="Enter mails separated by commas"
            />
          </div>

          {/* Grade */}
          <div>
            <label className="block mb-1 text-gray-600">Grade</label>
            <Select
              options={gradeOptions}
              value={selectedGrade}
              onChange={(opt) => handleSelectChange("grade_id", opt)}
              placeholder="Select Grade"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-600">Supervisor</label>
            <Select
              options={supervisorOptions}
              value={supervisorOptions.find(
                (opt) => String(opt.value) === String(formData.supervisor_id),
              )}
              onChange={(opt) => handleSelectChange("supervisor_id", opt)}
              placeholder="Select Supervisor"
              isSearchable
            />
          </div>

          {/* Status */}
          <div>
            <label className="block mb-1 text-gray-600">Status</label>
            <Select
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              value={selectedStatus}
              onChange={(opt) =>
                handleSelectChange("employee_active_status", opt)
              }
              placeholder="Select Status"
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
              className="bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </form>
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Confirm Update
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to update this employee’s official
                details?
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
                    handleSubmit(e); // call existing PUT submit
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
      </motion.div>
    </div>
  );
};

export default EditOfficialDetails;
