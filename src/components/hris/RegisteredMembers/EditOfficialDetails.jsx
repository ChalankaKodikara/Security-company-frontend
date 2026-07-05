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
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const employeeCategoryOptions = [
    { value: "Direct", label: "Direct" },
    { value: "Indirect", label: "Indirect" },
    { value: "JSO", label: "JSO" },
    { value: "OIC", label: "OIC" },
    { value: "VO", label: "VO" },
    { value: "HO_STAFF", label: "HO Staff" },
  ];

  const payrollGroupOptions = [
    { value: "SECURITY", label: "Security" },
    { value: "HO", label: "Head Office" },
  ];

  const payrollSchemeOptions = [
    { value: "STANDARD", label: "Standard" },
    { value: "EXEMPT", label: "Exempt" },
  ];

  const [formData, setFormData] = useState({
    timetable_id: officialData?.timetable_id || "",
    employee_category: officialData?.employee_category || "",
    payroll_group: officialData?.payroll_group || "HO",
    payroll_scheme: officialData?.payroll_scheme || "STANDARD",
    checkpoint_id: officialData?.checkpoint_id || "",

    date_of_appointment: officialData?.date_of_appointment
      ? new Date(officialData.date_of_appointment).toISOString().split("T")[0]
      : "",

    department_designation_id: officialData?.department_designation_id || "",
    working_office: officialData?.working_office
      ? String(officialData.working_office)
      : "",
    branch:
      officialData?.branch_id || officialData?.branch
        ? String(officialData.branch_id || officialData.branch)
        : "",
    employment_type: officialData?.employment_type
      ? String(officialData.employment_type)
      : "",

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
  });

  const [designationOptions, setDesignationOptions] = useState([]);
  const [workingOfficeOptions, setWorkingOfficeOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [timetableOptions, setTimetableOptions] = useState([]);
  const [checkpointOptions, setCheckpointOptions] = useState([]);

  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (field, selected) => {
    setFormData((prev) => ({ ...prev, [field]: selected?.value || "" }));
  };

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const token = Cookies.get("accessToken");

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
              value: String(s.id),
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

  useEffect(() => {
    if (!organizationId) return;

    const fetchDesignations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/designations?organization_id=${organizationId}`,
        );

        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          setDesignationOptions(
            json.data.map((d) => ({
              value: String(d.id),
              label: `${d.title} (${d?.Department?.name || "No Dept"})`,
            })),
          );
        }
      } catch (error) {
        console.error("Failed to load designations:", error);
        toast.error("Failed to load designation list");
      }
    };

    fetchDesignations();
  }, [API_URL, organizationId]);

  useEffect(() => {
    if (!organizationId) return;

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
        }
      } catch (error) {
        console.error("Failed to fetch working offices:", error);
        toast.error("Failed to load working office options");
      }
    };

    fetchWorkingOffices();
  }, [API_URL, organizationId]);

  useEffect(() => {
    if (!organizationId) return;

    const fetchBranches = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/branch/all?organization_id=${organizationId}`,
        );

        const json = await res.json();

        const branchArray = Array.isArray(json)
          ? json
          : Array.isArray(json.data)
            ? json.data
            : [];

        setBranchOptions(
          branchArray.map((b) => ({
            value: String(b.id),
            label: b.branch,
          })),
        );
      } catch (err) {
        console.error("Failed to fetch branches:", err);
      }
    };

    fetchBranches();
  }, [API_URL, organizationId]);

  useEffect(() => {
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

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/grade/employee-grades`);
        const json = await res.json();

        if (json?.success && Array.isArray(json.data)) {
          setGradeOptions(
            json.data.map((g) => ({
              value: String(g.id),
              label: g.grade_name,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch grades:", err);
        toast.error("Failed to load grade options");
      }
    };

    fetchGrades();
  }, [API_URL]);

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/timetable/gettimetable`);
        const data = await res.json();

        if (Array.isArray(data)) {
          setTimetableOptions(
            data.map((t) => ({
              value: String(t.TimetableID),
              label: t.TimetableName,
              raw: t,
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
    const fetchCheckpoints = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/client/checkpoints`);
        const json = await res.json();

        if (json?.success && Array.isArray(json.checkpoints)) {
          setCheckpointOptions(
            json.checkpoints.map((cp) => ({
              value: String(cp.id),
              label: `${cp.checkpoint_name} - ${cp.client_name || "No Client"}`,
              raw: cp,
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch checkpoints", err);
      }
    };

    fetchCheckpoints();
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
        timetable_id: String(found.value),
      }));
    }
  }, [timetableOptions, officialData]);

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

  const selectedSupervisor =
    supervisorOptions.find(
      (opt) => String(opt.value) === String(formData.supervisor_id),
    ) || null;

  const selectedStatus = formData.employee_active_status
    ? {
        value: formData.employee_active_status,
        label: formData.employee_active_status,
      }
    : null;

  const selectedEmployeeCategory =
    employeeCategoryOptions.find(
      (opt) => opt.value === formData.employee_category,
    ) || null;

  const selectedPayrollGroup =
    payrollGroupOptions.find((opt) => opt.value === formData.payroll_group) ||
    null;

  const selectedPayrollScheme =
    payrollSchemeOptions.find((opt) => opt.value === formData.payroll_scheme) ||
    null;

  const selectedCheckpoint =
    checkpointOptions.find(
      (opt) => String(opt.value) === String(formData.checkpoint_id),
    ) || null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!officialData?.employee_no) {
      toast.error("Employee number is missing");
      return;
    }

    const payload = {
      working_office: formData.working_office || null,
      branch: Number(formData.branch) || null,
      employment_type: Number(formData.employment_type) || null,
      date_of_appointment: formData.date_of_appointment || null,
      employee_basic_salary: Number(formData.employee_basic_salary || 0),
      employee_active_status: formData.employee_active_status,
      department_designation_id:
        Number(formData.department_designation_id) || null,
      grade_id: Number(formData.grade_id) || null,
      epf_no: formData.epf_no || "",
      supervisor_id: Number(formData.supervisor_id) || null,
      designated_mail: formData.designated_mail || "",
      employee_category: formData.employee_category || "",
      payroll_group: formData.payroll_group || "HO",
      payroll_scheme: formData.payroll_scheme || "STANDARD",
      checkpoint_id:
        formData.payroll_group === "SECURITY"
          ? Number(formData.checkpoint_id) || null
          : null,
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
          result?.message || "Official details updated successfully",
        );
        onUpdateSuccess && onUpdateSuccess();
        onClose && onClose();
      } else {
        toast.error(result?.message || "Update failed");
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("An error occurred while updating");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3 }}
        className="relative bg-white w-full sm:w-[760px] h-screen p-6 overflow-y-auto shadow-xl z-10"
      >
        <h2 className="text-lg font-semibold mb-4 border-b pb-3">
          Edit Official Details
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-2 gap-4 text-sm"
        >
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

          <div>
            <label className="block mb-1 text-gray-600">Working Office</label>
            <Select
              options={workingOfficeOptions}
              value={selectedWorkingOffice}
              onChange={(opt) => handleSelectChange("working_office", opt)}
              placeholder="Select Working Office"
              isSearchable
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-600">Branch</label>
            <Select
              options={branchOptions}
              value={selectedBranch}
              onChange={(opt) => handleSelectChange("branch", opt)}
              placeholder="Select Branch"
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
                  timetable_id: opt?.value || "",
                }));
              }}
              placeholder="Select Time Table"
              isSearchable
            />
          </div>

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

          <div>
            <label className="block mb-1 text-gray-600">
              Employee Category
            </label>
            <Select
              options={employeeCategoryOptions}
              value={selectedEmployeeCategory}
              onChange={(opt) => handleSelectChange("employee_category", opt)}
              placeholder="Select Employee Category"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-600">Payroll Group</label>
            <Select
              options={payrollGroupOptions}
              value={selectedPayrollGroup}
              onChange={(opt) =>
                setFormData((prev) => ({
                  ...prev,
                  payroll_group: opt?.value || "HO",
                  checkpoint_id:
                    opt?.value === "SECURITY" ? prev.checkpoint_id : "",
                }))
              }
              placeholder="Select Payroll Group"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-600">Payroll Scheme</label>
            <Select
              options={payrollSchemeOptions}
              value={selectedPayrollScheme}
              onChange={(opt) =>
                handleSelectChange(
                  "payroll_scheme",
                  opt || { value: "STANDARD" },
                )
              }
              placeholder="Select Payroll Scheme"
            />
          </div>

          {formData.payroll_group === "SECURITY" && (
            <div>
              <label className="block mb-1 text-gray-600">Checkpoint</label>
              <Select
                options={checkpointOptions}
                value={selectedCheckpoint}
                onChange={(opt) => handleSelectChange("checkpoint_id", opt)}
                placeholder="Select Checkpoint"
                isSearchable
              />
            </div>
          )}

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
              value={selectedSupervisor}
              onChange={(opt) => handleSelectChange("supervisor_id", opt)}
              placeholder="Select Supervisor"
              isSearchable
            />
          </div>

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
      </motion.div>
    </div>
  );
};

export default EditOfficialDetails;
