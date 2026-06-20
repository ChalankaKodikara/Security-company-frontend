/** @format */

import React, { useState, useEffect } from "react";
import { FaArrowRight } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import {
  submitOfficialEmploymentDetails,
  updateOfficialEmploymentDetails,
} from "../../../Services/UserRegistration/UserRegistration";
import { apiFetch } from "../../../utils/apiClient";
const EmploymentDetails = ({
  data,
  setData,
  handlePrevStep,
  handleNextStep,
  organizationId, //  receive here
}) => {
  const [employmentData, setEmploymentData] = useState(data || {});
  const [formChanged, setFormChanged] = useState(false);
  const [errors, setErrors] = useState({});

  const [designationOptions, setDesignationOptions] = useState([]);
  const [workingOfficeOptions, setWorkingOfficeOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState([]);
  const [gradeOptions, setGradeOptions] = useState([]);
  const [supervisorOptions, setSupervisorOptions] = useState([]);
  const [timetableOptions, setTimetableOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [allDepartments, setAllDepartments] = useState([]); // [{id, name}]
  const [orgDesignations, setOrgDesignations] = useState([]); // full API payload rows
  const employeeCategoryOptions = [
    { value: "Direct", label: "Direct" },
    { value: "Indirect", label: "Indirect" },
    { value: "JSO", label: "JSO " },
    { value: "OIC", label: "OIC" },
    { value: "VO", label: "VO" },
    { value: "HO_STAFF", label: "HO Staff" },
  ];
  const locationTypeOptions = [
    { value: "COLOMBO", label: "Colombo" },
    { value: "OUTSTATION", label: "Outstation" },
  ];
  const todayISO = new Date().toISOString().split("T")[0];
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  // Just log organization ID for now
  useEffect(() => {
    if (organizationId) {
      console.log(
        "Organization ID received in Employment Details:",
        organizationId
      );
    } else {
      console.warn("⚠️ No organizationId passed to Employment Details!");
    }
  }, [organizationId]);

  useEffect(() => {
    const fetchTimetables = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/timetable/gettimetable`);

        const data = await res.json();

        if (Array.isArray(data)) {
          const options = data.map((t) => ({
            value: t.TimetableID,
            label: `${t.TimetableName} (${t.Type} | ${t.WorkingDays} days)`,
          }));
          setTimetableOptions(options);
        } else {
          setTimetableOptions([]);
        }
      } catch (err) {
        console.error("Error fetching timetables:", err);
        toast.error("Failed to load timetables");
      }
    };

    fetchTimetables();
  }, [API_URL]);

  useEffect(() => {
    const fetchEmploymentTypes = async () => {
      if (!organizationId) return;
      try {
        const url = `${API_URL}/v1/hris/organizations/employment-types?organization_id=${organizationId}`;
        const res = await apiFetch(url, {});
        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
          const options = result.data.map((item) => ({
            value: item.id,
            label: item.type_name,
          }));
          setEmploymentTypeOptions(options);
        } else {
          setEmploymentTypeOptions([]);
        }
      } catch (error) {
        console.error(
          "Error fetching employment types by organization:",
          error,
        );
        toast.error("Failed to load employment types");
      }
    };

    fetchEmploymentTypes();
  }, [API_URL, organizationId]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!organizationId) {
        console.warn("⚠️ No organizationId provided for fetching branches");
        return;
      }

      try {
        const url = `${API_URL}/v1/hris/branch/all?organization_id=${organizationId}`;

        const res = await apiFetch(url);
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          const options = data.map((branch) => ({
            value: branch.id,
            label: branch.branch,
          }));
          setBranchOptions(options);
        } else {
          console.error(
            "Failed to fetch branches or invalid data format:",
            data,
          );
          setBranchOptions([]);
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast.error("Failed to load branches");
      }
    };

    fetchBranches();
  }, [API_URL, organizationId]);

  //  Working offices by Organization
  useEffect(() => {
    const fetchWorkingOffices = async () => {
      if (!organizationId) return;
      try {
        const url = `${API_URL}/v1/hris/organizations/working-offices?organization_id=${organizationId}`;
        const res = await apiFetch(url, {});
        const result = await res.json();

        if (result.success && Array.isArray(result.data)) {
          const options = result.data.map((office) => ({
            value: office.id,
            label: office.name,
          }));
          setWorkingOfficeOptions(options);
        } else {
          setWorkingOfficeOptions([]);
        }
      } catch (error) {
        console.error("Error fetching working offices by organization:", error);
        toast.error("Failed to load working offices");
      }
    };

    fetchWorkingOffices();
  }, [API_URL, organizationId]);

  //  Grades
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/grade/employee-grades`,
          {},
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const options = data.data.map((g) => ({
            value: g.id,
            label: g.grade_name,
          }));
          setGradeOptions(options);

          // migrate from any previously saved name/id
          setEmploymentData((prev) => {
            if (prev?.grade_id) return prev;
            const personal = localStorage.getItem("personalDetails");
            if (personal) {
              try {
                const p = JSON.parse(personal);
                const rawVal = p?.employee_grade;
                if (rawVal) {
                  if (/^\d+$/.test(String(rawVal))) {
                    return { ...prev, grade_id: Number(rawVal) };
                  }
                  const found = data.data.find(
                    (g) =>
                      String(g.grade_name).toLowerCase() ===
                      String(rawVal).toLowerCase(),
                  );
                  if (found) return { ...prev, grade_id: Number(found.id) };
                }
              } catch { }
            }
            return prev;
          });
        }
      } catch (error) {
        console.error("Error fetching grades:", error);
      }
    };
    fetchGrades();
  }, [API_URL]);

  //  Restore local storage
  useEffect(() => {
    const stored = localStorage.getItem("employmentDetails");
    if (stored) {
      const parsed = JSON.parse(stored);
      setEmploymentData(parsed);
    }
    const storedFile = localStorage.getItem("membershipFileMeta");
    if (storedFile) {
      const parsedFile = JSON.parse(storedFile);
      setEmploymentData((prev) => ({ ...prev, membership_file: parsedFile }));
    }
  }, []);

  useEffect(() => {
    const fetchOrgDesignations = async () => {
      if (!organizationId) return;
      try {
        const url = `${API_URL}/v1/hris/organizations/designations?organization_id=${organizationId}`;
        const res = await apiFetch(url);
        const result = await res.json();

        if (result?.success && Array.isArray(result.data)) {
          // Save full list
          setOrgDesignations(result.data);

          // Build unique departments from payload
          const deptMap = new Map();
          result.data.forEach((row) => {
            const dep = row?.Department;
            if (dep && dep.id && dep.name) {
              deptMap.set(dep.id, dep.name);
            }
          });

          const departments = Array.from(deptMap, ([id, name]) => ({
            id,
            name,
          }));
          setAllDepartments(departments);
          setDepartmentOptions(
            departments.map((d) => ({ value: d.id, label: d.name })),
          );

          // If a department is already selected, populate its designations now
          if (employmentData?.department_id) {
            const filtered = result.data
              .filter((d) => d?.Department?.id === employmentData.department_id)
              .map((d) => ({ value: d.id, label: d.title }));
            setDesignationOptions(filtered);
          } else {
            setDesignationOptions([]); // nothing selected yet
          }
        } else {
          setOrgDesignations([]);
          setDepartmentOptions([]);
          setDesignationOptions([]);
        }
      } catch (err) {
        console.error("Error fetching org designations:", err);
        toast.error("Failed to load departments/designations");
      }
    };
    fetchOrgDesignations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [API_URL, organizationId]);

  useEffect(() => {
    const fetchSupervisors = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/supervisors/getSupervisorsWithEmployees`,
        );

        const data = await res.json();

        let list = [];
        if (Array.isArray(data)) list = data;
        else if (data?.success && Array.isArray(data.data)) list = data.data;

        const options = list.map((s) => ({
          value: s.supervisor_id,
          label: s.supervisor_fullname,
        }));
        setSupervisorOptions(options);
      } catch (err) {
        console.error("Error fetching supervisors:", err);
        toast.error("Failed to load supervisors");
      }
    };
    fetchSupervisors();
  }, [API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "official_tel" && !/^\d*$/.test(value)) return;
    setEmploymentData((prev) => {
      const updated = { ...prev, [name]: value };
      checkIfChanged(updated);
      return updated;
    });
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const checkIfChanged = (updatedData) => {
    const stored = localStorage.getItem("employmentDetails");
    if (!stored) {
      setFormChanged(true);
      return;
    }
    const parsed = JSON.parse(stored);
    const changed = Object.keys(updatedData).some(
      (key) => updatedData[key] !== parsed[key],
    );
    setFormChanged(changed);
  };

  const handlePrev = () => {
    setData(employmentData);
    handlePrevStep(true);
  };

  const handleNext = async () => {
    // If no changes made, skip API and go next
    if (!formChanged) {
      handleNextStep(true);
      return;
    }

    const employee_no = localStorage.getItem("employee_no");
    if (!employee_no) {
      toast.error("Employee number not found in local storage.");
      return;
    }
    const payload = {
      employee_no: employee_no,
      working_office: employmentData.working_office || "",
      branch: employmentData.branch_id || null,
      employment_type: employmentData.type || null,
      employee_category: employmentData.employee_category || "",
      payroll_location_type: employmentData.location_type || "",
      date_of_appointment: employmentData.date_of_appointment || "",
      employment_start_date: employmentData.date_of_appointment || "",
      employment_end_date: employmentData.employment_end_date || null,
      employee_basic_salary: parseFloat(employmentData.employee_basic_salary || 0),
      employee_active_status: employmentData.status || "",
      department_designation_id: employmentData.designation || "",
      grade_id: employmentData.grade_id || null,
      epf_no: employmentData.epf_no || undefined,
      supervisor_id: employmentData.supervisor_id || null,
      designated_mail: employmentData.designated_mail || "",
      timetable_id: employmentData.timetable_id || null
    };
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/upload/official-details`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await res.json();
      if (!res.ok) throw result;

      toast.success(result.message || "Official employment details submitted!");
      localStorage.setItem("employmentDetails", JSON.stringify(employmentData));
      localStorage.setItem("employmentDetailsSubmitted", "true");
      handleNextStep(true);
    } catch (error) {
      console.error("Error submitting official details:", error);
      const msg = error?.message || "Failed to submit official details.";
      const field = error?.field;
      if (field) setErrors({ [field]: msg });
      toast.error(msg);
    }
  };

  // Helper to decide if any react-select menu is open (so Enter selects option, not submit)
  const isAnySelectMenuOpen = () =>
    !!document.querySelector(".react-select__menu");

  return (
    <form
      className="text-[16px]"
      onSubmit={(e) => {
        e.preventDefault();
        handleNext();
      }}
    >
      <h1 className="text-xl font-semibold mb-1">Member Official Details</h1>
      <p className="text-gray-500 mb-6">Enter Employee Official Details.</p>

      <div className="grid grid-cols-3 gap-6">
        <Input
          label="Appointment Date"
          name="date_of_appointment"
          type="date"
          value={employmentData.date_of_appointment}
          onChange={handleChange}
          error={errors.date_of_appointment}
          max={todayISO}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNext();
            }
          }}
        />

        {/* Department */}
        <div>
          <label className="block mb-1 text-gray-700">Department</label>
          <Select
            name="department_id"
            options={departmentOptions}
            value={
              departmentOptions.find(
                (opt) => opt.value === employmentData.department_id,
              ) || null
            }
            onChange={(selected) => {
              const deptId = selected ? selected.value : null;

              //  filter related designations from orgDesignations
              const options = deptId
                ? orgDesignations
                  .filter((d) => d?.Department?.id === deptId)
                  .map((d) => ({ value: d.id, label: d.title }))
                : [];

              setDesignationOptions(options);

              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  department_id: deptId,
                  designation: "", // reset designation when department changes
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            placeholder="Select Department"
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.department_id && (
            <p className="text-sm text-red-500 mt-1">{errors.department_id}</p>
          )}
        </div>

        {/* Designation */}
        <div>
          <label className="block mb-1 text-gray-700">Designation</label>
          <Select
            name="designation"
            options={designationOptions}
            value={
              designationOptions.find(
                (opt) => opt.value === employmentData.designation,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  designation: selected ? selected.value : "",
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            placeholder="Select Designation"
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.designation && (
            <p className="text-sm text-red-500 mt-1">{errors.designation}</p>
          )}
        </div>

        {/* Working Office */}
        <div>
          <label className="block mb-1 text-gray-700">Working Office</label>
          <Select
            name="working_office"
            options={workingOfficeOptions}
            isSearchable
            placeholder="Select Working Office"
            value={
              workingOfficeOptions.find(
                (opt) => opt.value === employmentData.working_office,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  working_office: selected?.value || "",
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.working_office && (
            <p className="text-sm text-red-500 mt-1">{errors.working_office}</p>
          )}
        </div>

        {/* Branch */}
        <div>
          <label className="block mb-1 text-gray-700">Branch</label>
          <Select
            name="branch_id"
            options={branchOptions}
            isSearchable
            placeholder="Select Branch"
            value={
              branchOptions.find(
                (opt) => opt.value === employmentData.branch_id,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = { ...prev, branch_id: selected?.value || "" };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.branch_id && (
            <p className="text-sm text-red-500 mt-1">{errors.branch_id}</p>
          )}
        </div>

        {/* Employment Type */}
        <div>
          <label className="block mb-1 text-gray-700">Employment Type</label>
          <Select
            name="type"
            options={employmentTypeOptions}
            isSearchable
            placeholder="Select Employment Type"
            value={
              employmentTypeOptions.find(
                (opt) => opt.value === employmentData.type,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = { ...prev, type: selected?.value || "" };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.type && (
            <p className="text-sm text-red-500 mt-1">{errors.type}</p>
          )}
        </div>
        {/* Employee Category */}
        <div>
          <label className="block mb-1 text-gray-700">Employee Category</label>
          <Select
            name="employee_category"
            options={employeeCategoryOptions}
            placeholder="Select Employee Category"
            value={
              employeeCategoryOptions.find(
                (opt) => opt.value === employmentData.employee_category,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  employee_category: selected ? selected.value : "",
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.employee_category && (
            <p className="text-sm text-red-500 mt-1">
              {errors.employee_category}
            </p>
          )}
        </div>

        <div>
          <label className="block mb-1 text-gray-700">Location Type</label>
          <Select
            name="location_type"
            options={locationTypeOptions}
            placeholder="Select Location Type"
            value={
              locationTypeOptions.find(
                (opt) => opt.value === employmentData.location_type
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  location_type: selected ? selected.value : "",
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.location_type && (
            <p className="text-sm text-red-500 mt-1">
              {errors.location_type}
            </p>
          )}
        </div>
        {/* Salary */}
        <Input
          label="Employee Basic Salary"
          name="employee_basic_salary"
          value={employmentData.employee_basic_salary}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNext();
            }
          }}
        />

        {/* Active/Inactive */}
        <div>
          <label className="block mb-1 text-gray-700">
            Employee Active/Inactive Status
          </label>
          <Select
            name="status"
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
            ]}
            value={
              employmentData.status
                ? { value: employmentData.status, label: employmentData.status }
                : null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  status: selected ? selected.value : "",
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            placeholder="Select Status"
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.status && (
            <p className="text-sm text-red-500 mt-1">{errors.status}</p>
          )}
        </div>

        {/* Grade */}
        <div>
          <label className="block mb-1 text-gray-700">Grade</label>
          <Select
            name="grade_id"
            options={gradeOptions}
            isSearchable
            placeholder="Select Grade"
            value={
              gradeOptions.find(
                (opt) => opt.value === employmentData.grade_id,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = { ...prev, grade_id: selected?.value || null };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.grade_id && (
            <p className="text-sm text-red-500 mt-1">{errors.grade_id}</p>
          )}
        </div>

        {/* Timetable */}
        <div>
          <label className="block mb-1 text-gray-700">Time Table</label>
          <Select
            name="timetable_id"
            options={timetableOptions}
            isSearchable
            placeholder="Select Time Table"
            value={
              timetableOptions.find(
                (opt) => opt.value === employmentData.timetable_id,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  timetable_id: selected?.value || null,
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.timetable_id && (
            <p className="text-sm text-red-500 mt-1">{errors.timetable_id}</p>
          )}
        </div>

        {/* Supervisor */}
        <div>
          <label className="block mb-1 text-gray-700">Supervisor</label>
          <Select
            name="supervisor_id"
            options={supervisorOptions}
            isSearchable
            placeholder="Select Supervisor"
            value={
              supervisorOptions.find(
                (opt) => opt.value === employmentData.supervisor_id,
              ) || null
            }
            onChange={(selected) => {
              setEmploymentData((prev) => {
                const updated = {
                  ...prev,
                  supervisor_id: selected?.value || null,
                };
                checkIfChanged(updated);
                return updated;
              });
              setFormChanged(true);
            }}
            className="react-select-container"
            classNamePrefix="react-select"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isAnySelectMenuOpen()) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
          {errors.supervisor_id && (
            <p className="text-sm text-red-500 mt-1">{errors.supervisor_id}</p>
          )}
        </div>

        {/* Designated Emails */}
        <Input
          label="Designated Emails (comma separated)"
          name="designated_mail"
          value={employmentData.designated_mail}
          onChange={handleChange}
          placeholder="e.g. user1@mail.com, user2@mail.com"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNext();
            }
          }}
        />

        {/* Optional EPF */}
        <Input
          label="EPF No"
          name="epf_no"
          value={employmentData.epf_no}
          onChange={handleChange}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNext();
            }
          }}
        />
      </div>

      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handlePrev}
          className="bg-gray-100 text-gray-400 px-4 py-2 rounded flex items-center"
        >
          <FaArrowRight className="rotate-180 mr-2" /> Previous
        </button>
        <button
          type="submit"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleNext();
            }
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded flex items-center"
        >
          {formChanged ? "Update & Next" : "Next"}{" "}
          <FaArrowRight className="ml-2" />
        </button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </form>
  );
};

const Input = ({
  label,
  name,
  value,
  onChange,
  type = "text",
  maxLength,
  error,
  min,
  max,
  placeholder,
  onKeyDown,
}) => (
  <div>
    <label className="block mb-1 text-gray-700">{label}</label>
    <input
      type={type}
      name={name}
      value={value || ""}
      onChange={onChange}
      maxLength={maxLength}
      min={min}
      max={max}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      className={`w-full border ${error ? "border-red-500" : "border-gray-300"} p-2 rounded`}
    />
    {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
  </div>
);

export default EmploymentDetails;
