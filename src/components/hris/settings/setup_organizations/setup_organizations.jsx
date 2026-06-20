import React, { useEffect, useState } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import Select from "react-select";

const STORAGE_KEYS = {
  orgDetails: "ss_org_details",
  billTypes: "ss_bill_types",
  leaveCategories: "ss_leave_categories",
  loanTypes: "ss_loan_types",
  performanceTypes: "ss_performance_types",

  branches: "ss_branches",

  workingOfficeGroups: "ss_working_office_groups",

  departmentGroups: "ss_department_groups",

  designationGroups: "ss_designation_groups",

  employmentTypesData: "ss_employment_types",
};

/**
 * Helper: safe set/get localStorage
 */
const ls = {
  get: (key, fallback) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  },
  removeMany: (keys) => {
    try {
      keys.forEach((k) => localStorage.removeItem(k));
    } catch {}
  },
};

const SystemSetup = () => {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const createdBy = (() => {
    try {
      const raw = Cookies.get("user_details"); // or your cookie name
      return raw ? JSON.parse(raw)?.username || "SYSTEM" : "SYSTEM";
    } catch {
      return "SYSTEM";
    }
  })();

  const [activeTab, setActiveTab] = useState(0); // 0..6
  const [orgStep, setOrgStep] = useState(0); // 0..3 (now only 4 steps)
  const [createdOrgId, setCreatedOrgId] = useState(null);
  const [createdBranches, setCreatedBranches] = useState([]);
  const [createdOffices, setCreatedOffices] = useState([]);
  const [createdDepartments, setCreatedDepartments] = useState([]);
  const [createdDesignations, setCreatedDesignations] = useState([]);
  const [employmentTypeOptions, setEmploymentTypeOptions] = useState([]);
  const [savedTabs, setSavedTabs] = useState([]); // stores indexes of steps already saved

  /**
   * Organization Wizard data (all persisted to LS)
   */
  const [orgDetails, setOrgDetails] = useState(
    ls.get(STORAGE_KEYS.orgDetails, {
      organization_name: "",
      code: "",
      email: "",
      contact_no: "",
      address: "",
      is_payroll_enabled: true,
      is_attendance_enabled: true,
      is_leave_enabled: true,
    }),
  );

  const [billTypes, setBillTypes] = useState(
    ls.get(STORAGE_KEYS.billTypes, [
      { bill_type: "", max_amount: "", min_amount: "" },
    ]),
  );

  const [leaveCategories, setLeaveCategories] = useState(
    ls.get(STORAGE_KEYS.leaveCategories, [
      {
        category_name: "",
        recurrence_type: "",
        apply_before_day: "",
        employeement_type_id: [],
        eligible_gender: "",
        weight: "",
        no_of_days: "",
        half_day_allowed: false,
        exclude_holidays: false,
        encash_allowed: false,
        max_encash_days: "",
        carry_forward_allowed: false,
        reset_date: "",
      },
    ]),
  );

  const [loanTypes, setLoanTypes] = useState(
    ls.get(STORAGE_KEYS.loanTypes, [
      {
        code: "",
        name: "",
        amount_type: "FIXED",
        amount_value: "",
        interest_rate: "",
        duration_months: "",
        exclude_months: [],
        calculation_type: "FLAT",
        require_level_1: 0,
        require_level_2: 0,
        is_active: true,
      },
    ]),
  );

  const [performanceTypes, setPerformanceTypes] = useState(
    ls.get(STORAGE_KEYS.performanceTypes, [
      {
        name: "",
        start_from: "",
        evaluation_type: "",
        department_designations: {},
        status: "active",
        tempDept: "",
        tempDesigs: "",
      },
    ]),
  );

  const [branches, setBranches] = useState(
    ls.get(STORAGE_KEYS.branches, [{ branch_name: "" }]),
  );

  const [workingOfficeGroups, setWorkingOfficeGroups] = useState(
    ls.get(STORAGE_KEYS.workingOfficeGroups, []),
  );

  const [departmentGroups, setDepartmentGroups] = useState(
    ls.get(STORAGE_KEYS.departmentGroups, []),
  );

  const [designationGroups, setDesignationGroups] = useState(
    ls.get(STORAGE_KEYS.designationGroups, []),
  );

  const [employmentTypesData, setEmploymentTypesData] = useState(
    ls.get(STORAGE_KEYS.employmentTypesData, [{ type_name: "" }]),
  );

  /**
   * Persist each editable section to localStorage
   */
  useEffect(() => ls.set(STORAGE_KEYS.orgDetails, orgDetails), [orgDetails]);
  useEffect(() => ls.set(STORAGE_KEYS.billTypes, billTypes), [billTypes]);
  useEffect(
    () => ls.set(STORAGE_KEYS.leaveCategories, leaveCategories),
    [leaveCategories],
  );
  useEffect(() => ls.set(STORAGE_KEYS.loanTypes, loanTypes), [loanTypes]);
  useEffect(
    () => ls.set(STORAGE_KEYS.performanceTypes, performanceTypes),
    [performanceTypes],
  );

  useEffect(() => ls.set(STORAGE_KEYS.branches, branches), [branches]);
  useEffect(
    () => ls.set(STORAGE_KEYS.workingOfficeGroups, workingOfficeGroups),
    [workingOfficeGroups],
  );
  useEffect(
    () => ls.set(STORAGE_KEYS.departmentGroups, departmentGroups),
    [departmentGroups],
  );
  useEffect(
    () => ls.set(STORAGE_KEYS.designationGroups, designationGroups),
    [designationGroups],
  );
  useEffect(
    () => ls.set(STORAGE_KEYS.employmentTypesData, employmentTypesData),
    [employmentTypesData],
  );

  const tabs = [
    "Organization Creation",
    "Branch Creation",
    "Working Office Creation",
    "Department Creation",
    "Designation Creation",
    "Employment Type Adding",
    "Leave Categories", // NEW: moved here
  ];

  // UPDATED: Removed "Leave Categories" from orgSteps
  const orgSteps = [
    "Organization Details",
    "Bill Types",
    "Loan Types",
    "Performance Types",
  ];

  /**
   * Helpers for lists
   */
  const addItem = (setter, template) =>
    setter((prev) => [...prev, { ...template }]);
  const removeItem = (setter, index) =>
    setter((prev) => prev.filter((_, i) => i !== index));
  const updateItem = (setter, index, field, value) =>
    setter((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  const updatePositiveNumberItem = (setter, index, field, value) => {
    if (value === "" || Number(value) >= 0) {
      updateItem(setter, index, field, value);
    }
  };

  const MONTH_OPTIONS = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const handleSubmitOrganization = async () => {
    try {
      const userToken = Cookies.get("accessToken");
      if (!userToken) {
        toast.error("User not authenticated. Please log in again.");
        return;
      }

      const payload = {
        ...orgDetails,
        bill_types: billTypes
          .filter((b) => b.bill_type.trim())
          .map((b) => ({
            bill_type: b.bill_type,
            max_amount: Number(b.max_amount || 0),
            min_amount: Number(b.min_amount || 0),
          })),
        loan_types: loanTypes.map((l) => ({
          code:
            l.code || l.name.toUpperCase().replace(/\s+/g, "_").slice(0, 30),
          name: l.name,
          amount_type: l.amount_type,
          amount_value: Number(l.amount_value || 0),
          interest_rate: Number(l.interest_rate || 0),
          duration_months: Number(l.duration_months || 0),
          exclude_months: Array.isArray(l.exclude_months)
            ? l.exclude_months
            : [],
          calculation_type: l.calculation_type || "FLAT",
          require_level_1: l.require_level_1 === 1 ? 1 : 0,
          require_level_2: l.require_level_2 === 1 ? 1 : 0,
        })),

        performance_types: performanceTypes
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name,
            start_from: p.start_from,
            evaluation_type: p.evaluation_type,
            department_designations: p.department_designations,
            status: p.status,
          })),
      };
      console.log(
        "FINAL PAYLOAD SENT TO BACKEND 👉",
        JSON.stringify(payload, null, 2),
      );

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/add-organization`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to create organization");
        return;
      }

      toast.success(" Organization created successfully!");
      setCreatedOrgId(data?.data?.id);
      setSavedTabs((prev) => [...prev, 0]);
      setActiveTab(1);
      setOrgStep(0);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while creating organization");
    }
  };

  const handleSubmitBranches = async () => {
    if (savedTabs.includes(1)) {
      setActiveTab(2);
      return;
    }

    if (!createdOrgId) {
      toast.error("Organization ID missing. Please create organization first.");
      return;
    }

    try {
      const userToken = Cookies.get("accessToken");
      if (!userToken) {
        toast.error("User not authenticated. Please log in again.");
        return;
      }

      const payload = {
        branches: branches
          .filter((b) => b.branch_name.trim())
          .map((b) => ({ branch: b.branch_name.trim() })),
      };

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/branch/${createdOrgId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🏢 Branches added successfully!");
        setCreatedBranches(data.data || []);
        setSavedTabs((prev) => [...prev, 1]);

        const initialized = (data.data || []).map((b) => ({
          branchId: b.id,
          branchName: b.branch,
          working_offices: [{ name: "", description: "" }],
        }));

        setWorkingOfficeGroups(initialized);
        setActiveTab(2);
      } else {
        toast.error(data.message || "Failed to add branches");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while adding branches");
    }
  };

  const handleSubmitWorkingOffices = async () => {
    if (savedTabs.includes(2)) {
      setActiveTab(3);
      return;
    }

    try {
      const userToken = Cookies.get("accessToken");
      if (!userToken) {
        toast.error("User not authenticated. Please log in again.");
        return;
      }

      const payload = {
        branches: workingOfficeGroups.map((g) => ({
          branchId: g.branchId,
          working_offices: g.working_offices
            .filter((o) => (o.name || "").trim())
            .map((o) => ({
              name: o.name.trim(),
              description: (o.description || "").trim(),
            })),
        })),
      };

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/branches/working-offices`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🏢 Working offices added successfully!");
        setCreatedOffices(data.data || []);
        setSavedTabs((prev) => [...prev, 2]);

        const initialized = (data.data || []).flatMap((b) =>
          (b.working_offices || []).map((o) => ({
            officeId: o.id,
            officeName: o.name,
            departments: [{ name: "", description: "" }],
          })),
        );
        setDepartmentGroups(initialized);
        setActiveTab(3);
      } else {
        toast.error(data.message || "Failed to add working offices");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while adding working offices");
    }
  };

  const handleSubmitDepartments = async () => {
    if (savedTabs.includes(3)) {
      setActiveTab(4);
      return;
    }

    try {
      const userToken = Cookies.get("accessToken");
      if (!userToken) {
        toast.error("User not authenticated. Please log in again.");
        return;
      }

      const payload = {
        offices: departmentGroups.map((g) => ({
          officeId: g.officeId,
          departments: g.departments
            .filter((d) => (d.name || "").trim())
            .map((d) => ({
              name: d.name.trim(),
              description: (d.description || "").trim(),
            })),
        })),
      };

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/working-offices/departments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🏬 Departments added successfully!");
        setCreatedDepartments(data.data || []);
        setSavedTabs((prev) => [...prev, 3]);

        const initialized = (data.data || []).flatMap((o) =>
          (o.departments || []).map((d) => ({
            deptId: d.id,
            deptName: d.name,
            designations: [{ title: "" }],
          })),
        );
        setDesignationGroups(initialized);
        setActiveTab(4);
      } else {
        toast.error(data.message || "Failed to add departments");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while adding departments");
    }
  };

  const handleSubmitDesignations = async () => {
    if (savedTabs.includes(4)) {
      setActiveTab(5);
      return;
    }

    try {
      const userToken = Cookies.get("accessToken");
      if (!userToken) {
        toast.error("User not authenticated. Please log in again.");
        return;
      }

      const payload = {
        departments: designationGroups.map((g) => ({
          deptId: g.deptId,
          designations: g.designations
            .filter((d) => (d.title || "").trim())
            .map((d) => ({ title: d.title.trim() })),
        })),
      };

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/departments/designations`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🎉 Designations added successfully!");
        setCreatedDesignations(data.data || []);
        setSavedTabs((prev) => [...prev, 4]);
        setActiveTab(5);
      } else {
        toast.error(data.message || "Failed to add designations");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while adding designations");
    }
  };

  const handleSubmitEmploymentTypes = async () => {
    if (savedTabs.includes(5)) {
      setActiveTab(6);
      return;
    }

    try {
      const userToken = Cookies.get("accessToken");
      if (!userToken) {
        toast.error("User not authenticated. Please log in again.");
        return;
      }

      const orgId =
        createdDesignations?.[0]?.designations?.[0]?.organization_id ||
        createdDesignations?.[0]?.organization_id ||
        createdOrgId;

      if (!orgId) {
        toast.error("Missing organization ID. Please complete previous steps.");
        return;
      }

      const payload = {
        employment_types: employmentTypesData
          .filter((t) => (t.type_name || "").trim())
          .map((t) => ({ type_name: t.type_name.trim() })),
      };

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/employment-types/${orgId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(" Employment types added successfully!");
        setSavedTabs((prev) => [...prev, 5]);
        setActiveTab(6);
      } else {
        toast.error(data.message || "Failed to add employment types");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while adding employment types");
    }
  };

  const handleSubmitLeaveCategories = async () => {
    try {
      const userToken = Cookies.get("accessToken");
      if (!userToken) {
        toast.error("User not authenticated. Please log in again.");
        return;
      }

      const orgId = createdOrgId;
      if (!orgId) {
        toast.error("Missing organization ID. Please complete previous steps.");
        return;
      }

      const payload = {
        leave_categories: leaveCategories
          .filter((l) => l.category_name.trim())
          .map((l) => ({
            category_name: l.category_name,
            recurrence_type: l.recurrence_type.toUpperCase(),
            apply_before_day: Number(l.apply_before_day || 0),

            employeement_type_id: l.employeement_type_id,
            eligible_gender: l.eligible_gender,

            weight: Number(l.weight || 0),
            no_of_days: Number(l.no_of_days || 0),

            half_day_allowed: Boolean(l.half_day_allowed),
            exclude_holidays: Boolean(l.exclude_holidays),

            encash_allowed: Boolean(l.encash_allowed),
            max_encash_days: l.encash_allowed
              ? Number(l.max_encash_days || 0)
              : null,

            carry_forward_allowed: Boolean(l.carry_forward_allowed),
            reset_date: l.carry_forward_allowed ? l.reset_date : null,

            create_by: createdBy,
          })),
      };

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/leave-categories/${orgId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(" Leave categories added successfully!");

        //  Clear all localStorage & reset state
        ls.removeMany(Object.values(STORAGE_KEYS));
        setSavedTabs([]);
        setCreatedOrgId(null);
        setOrgStep(0);
        setActiveTab(0);

        // Reset all form states
        setOrgDetails({
          organization_name: "",
          code: "",
          email: "",
          contact_no: "",
          address: "",
          is_payroll_enabled: true,
          is_attendance_enabled: true,
          is_leave_enabled: true,
        });
        setBillTypes([{ bill_type: "", max_amount: "", min_amount: "" }]);
        setLoanTypes([
          {
            code: "",
            name: "",
            amount_type: "FIXED",
            amount_value: "",
            interest_rate: "",
            duration_months: "",
            exclude_months: [],
            calculation_type: "FLAT",
            is_active: true,
          },
        ]);
        setPerformanceTypes([
          {
            name: "",
            start_from: "",
            evaluation_type: "",
            department_designations: {},
            status: "active",
            tempDept: "",
            tempDesigs: "",
          },
        ]);
        setBranches([{ branch_name: "" }]);
        setWorkingOfficeGroups([]);
        setDepartmentGroups([]);
        setDesignationGroups([]);
        setEmploymentTypesData([{ type_name: "" }]);
        setLeaveCategories([
          {
            category_name: "",
            recurrence_type: "",
            apply_before_day: "",
            employeement_type_id: [],
            eligible_gender: "",
            weight: "",
            no_of_days: "",
            half_day_allowed: false,
            exclude_holidays: false,
            encash_allowed: false,
            max_encash_days: "",
            carry_forward_allowed: false,
            reset_date: "",
          },
        ]);

        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.info("🎉 System setup completed and data cleared!");
      } else {
        toast.error(data.message || "Failed to add leave categories");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while adding leave categories");
    }
  };
  useEffect(() => {
    if (createdOrgId) fetchEmploymentTypes();
  }, [API_URL, createdOrgId]);

  useEffect(() => {
    if (activeTab === 6) {
      fetchEmploymentTypes();
    }
  }, [activeTab]);

  const fetchEmploymentTypes = async () => {
    const orgId =
      createdOrgId ||
      createdDesignations?.[0]?.organization_id ||
      createdDepartments?.[0]?.organization_id;

    if (!orgId) return;
    const userToken = Cookies.get("accessToken");
    if (!userToken) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/v1/hris/organizations/employment-types/${orgId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
        },
      );

      const data = await res.json();

      if (res.ok && data.success) {
        const opts = data.data.map((t) => ({
          value: t.id,
          label: t.type_name,
        }));
        setEmploymentTypeOptions(opts);
      } else {
        toast.error(data.message || "Failed to load employment types");
      }
    } catch (error) {
      console.error("Error fetching employment types:", error);
      toast.error("Something went wrong while loading employment types");
    }
  };

  const renderOrgDetails = () => (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-6">
        Organization Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={orgDetails.organization_name}
            onChange={(e) =>
              setOrgDetails({
                ...orgDetails,
                organization_name: e.target.value,
              })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Talexa HRMS Pvt Ltd"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={orgDetails.code}
            onChange={(e) =>
              setOrgDetails({ ...orgDetails, code: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Talexa"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            value={orgDetails.email}
            onChange={(e) =>
              setOrgDetails({ ...orgDetails, email: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="info@Talexa.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact No <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={orgDetails.contact_no}
            onChange={(e) =>
              setOrgDetails({ ...orgDetails, contact_no: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="+94 11 345 6789"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            value={orgDetails.address}
            onChange={(e) =>
              setOrgDetails({ ...orgDetails, address: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Colombo, Sri Lanka"
            rows="3"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Enabled Modules <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Payroll */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Payroll
              </span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="is_payroll_enabled"
                    checked={orgDetails.is_payroll_enabled === true}
                    onChange={() =>
                      setOrgDetails({ ...orgDetails, is_payroll_enabled: true })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="is_payroll_enabled"
                    checked={orgDetails.is_payroll_enabled === false}
                    onChange={() =>
                      setOrgDetails({
                        ...orgDetails,
                        is_payroll_enabled: false,
                      })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Disable</span>
                </label>
              </div>
            </div>

            {/* Attendance */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Attendance
              </span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="is_attendance_enabled"
                    checked={orgDetails.is_attendance_enabled === true}
                    onChange={() =>
                      setOrgDetails({
                        ...orgDetails,
                        is_attendance_enabled: true,
                      })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="is_attendance_enabled"
                    checked={orgDetails.is_attendance_enabled === false}
                    onChange={() =>
                      setOrgDetails({
                        ...orgDetails,
                        is_attendance_enabled: false,
                      })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Disable</span>
                </label>
              </div>
            </div>

            {/* Leave */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">
                Leave
              </span>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="is_leave_enabled"
                    checked={orgDetails.is_leave_enabled === true}
                    onChange={() =>
                      setOrgDetails({ ...orgDetails, is_leave_enabled: true })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Enable</span>
                </label>
                <label className="flex items-center space-x-1">
                  <input
                    type="radio"
                    name="is_leave_enabled"
                    checked={orgDetails.is_leave_enabled === false}
                    onChange={() =>
                      setOrgDetails({ ...orgDetails, is_leave_enabled: false })
                    }
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Disable</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillTypes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Bill Types</h3>
        <button
          onClick={() =>
            addItem(setBillTypes, {
              bill_type: "",
              max_amount: "",
              min_amount: "",
            })
          }
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bill Type
        </button>
      </div>

      {billTypes.map((bill, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-600">
              Bill Type {index + 1}
            </span>
            {billTypes.length > 1 && (
              <button
                onClick={() => removeItem(setBillTypes, index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bill Type
              </label>
              <input
                type="text"
                value={bill.bill_type}
                onChange={(e) =>
                  updateItem(setBillTypes, index, "bill_type", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Travel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Min Amount
              </label>
              <input
                type="number"
                min="0"
                value={bill.min_amount}
                onChange={(e) =>
                  updatePositiveNumberItem(
                    setBillTypes,
                    index,
                    "min_amount",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Amount
              </label>
              <input
                type="number"
                min="0"
                value={bill.max_amount}
                onChange={(e) =>
                  updatePositiveNumberItem(
                    setBillTypes,
                    index,
                    "max_amount",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="5000"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLeaveCategories = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Leave Categories
        </h3>
        <button
          onClick={() =>
            addItem(setLeaveCategories, {
              category_name: "",
              recurrence_type: "",
              apply_before_day: "",
              employeement_type_id: [],
              eligible_gender: "",
              weight: "",
              no_of_days: "",
              half_day_allowed: false,
              exclude_holidays: false,
              encash_allowed: false,
              max_encash_days: "",
              carry_forward_allowed: false,
              reset_date: "",
            })
          }
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </button>
      </div>

      {leaveCategories.map((cat, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-600">
              Category {index + 1}
            </span>
            {leaveCategories.length > 1 && (
              <button
                onClick={() => removeItem(setLeaveCategories, index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name
              </label>
              <input
                type="text"
                value={cat.category_name}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "category_name",
                    e.target.value,
                  )
                }
                placeholder="Annual Leave"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recurrence Type
              </label>
              <select
                value={cat.recurrence_type}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "recurrence_type",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Annual">Annual</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Apply Before (days)
              </label>
              <input
                type="number"
                min="0"
                value={cat.apply_before_day}
                onChange={(e) =>
                  updatePositiveNumberItem(
                    setLeaveCategories,
                    index,
                    "apply_before_day",
                    e.target.value,
                  )
                }
                placeholder="7"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              />
            </div>

            <div>
              <Select
                isMulti
                value={employmentTypeOptions.filter((opt) =>
                  cat.employeement_type_id?.includes(opt.value),
                )}
                onChange={(selected) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "employeement_type_id",
                    selected.map((s) => s.value),
                  )
                }
                options={employmentTypeOptions}
                placeholder="Select Employment Types..."
                className="text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Gender
              </label>
              <select
                value={cat.eligible_gender}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "eligible_gender",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="Both">Both</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={cat.weight}
                onChange={(e) =>
                  updatePositiveNumberItem(
                    setLeaveCategories,
                    index,
                    "weight",
                    e.target.value,
                  )
                }
                placeholder="1.0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                No. of Days
              </label>
              <input
                type="number"
                min="0"
                value={cat.no_of_days}
                onChange={(e) =>
                  updatePositiveNumberItem(
                    setLeaveCategories,
                    index,
                    "no_of_days",
                    e.target.value,
                  )
                }
                placeholder="14"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              />
            </div>

            {/* Half Day Allowed */}
            <div className="flex items-center gap-2">
              <input
                id={`half_day_allowed_${index}`}
                type="checkbox"
                checked={cat.half_day_allowed}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "half_day_allowed",
                    e.target.checked,
                  )
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor={`half_day_allowed_${index}`} className="text-sm text-gray-700 cursor-pointer">Half Day Allowed</label>
            </div>

            {/* Exclude Holidays */}
            <div className="flex items-center gap-2">
              <input
                id={`exclude_holidays_${index}`}
                type="checkbox"
                checked={cat.exclude_holidays}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "exclude_holidays",
                    e.target.checked,
                  )
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor={`exclude_holidays_${index}`} className="text-sm text-gray-700 cursor-pointer">Exclude Holidays</label>
            </div>

            {/* Encash Allowed */}
            <div className="flex items-center gap-2">
              <input
                id={`encash_allowed_${index}`}
                type="checkbox"
                checked={cat.encash_allowed}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "encash_allowed",
                    e.target.checked,
                  )
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor={`encash_allowed_${index}`} className="text-sm text-gray-700 cursor-pointer">Encash Allowed</label>
            </div>

            {/* Max Encash Days (conditional) */}
            {cat.encash_allowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Encash Days
                </label>
                <input
                  type="number"
                  value={cat.max_encash_days}
                  onChange={(e) =>
                    updateItem(
                      setLeaveCategories,
                      index,
                      "max_encash_days",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  placeholder="5"
                />
              </div>
            )}

            {/* Carry Forward Allowed */}
            <div className="flex items-center gap-2">
              <input
                id={`carry_forward_allowed_${index}`}
                type="checkbox"
                checked={cat.carry_forward_allowed}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "carry_forward_allowed",
                    e.target.checked,
                  )
                }
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor={`carry_forward_allowed_${index}`} className="text-sm text-gray-700 cursor-pointer">
                Carry Forward Allowed
              </label>
            </div>

            {/* Reset Date (conditional) */}
            {cat.carry_forward_allowed && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reset Date
                </label>
                <input
                  type="date"
                  value={cat.reset_date || ""}
                  onChange={(e) =>
                    updateItem(
                      setLeaveCategories,
                      index,
                      "reset_date",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderLoanTypes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Loan Types</h3>
        <button
          onClick={() =>
            addItem(setLoanTypes, {
              code: "",
              name: "",
              amount_type: "FIXED",
              amount_value: "",
              interest_rate: "",
              duration_months: "",
              exclude_months: [],
              calculation_type: "FLAT",
              require_level_1: 0,
              require_level_2: 0,
              is_active: true,
            })
          }
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Loan Type
        </button>
      </div>

      {loanTypes.map((loan, index) => (
        <div
          key={index}
          className="p-5 border border-gray-200 rounded-lg bg-gray-50 space-y-4"
        >
          <div className="flex justify-between">
            <span className="text-sm font-medium text-gray-600">
              Loan Type {index + 1}
            </span>
            {loanTypes.length > 1 && (
              <button
                onClick={() => removeItem(setLoanTypes, index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Code */}
            <input
              type="text"
              placeholder="Code (e.g. DISTRESS_1)"
              value={loan.code}
              onChange={(e) =>
                updateItem(setLoanTypes, index, "code", e.target.value)
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            />

            {/* Name */}
            <input
              type="text"
              placeholder="Loan Name"
              value={loan.name}
              onChange={(e) =>
                updateItem(setLoanTypes, index, "name", e.target.value)
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            />

            {/* Amount Type */}
            <select
              value={loan.amount_type}
              onChange={(e) =>
                updateItem(setLoanTypes, index, "amount_type", e.target.value)
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            >
              <option value="FIXED">Fixed Amount</option>
              <option value="SALARY">Salary Multiplier</option>
            </select>

            {/* Amount Value */}
            <input
              type="number"
              min="0"
              placeholder={
                loan.amount_type === "SALARY"
                  ? "Salary Multiplier (e.g. 2)"
                  : "Fixed Amount"
              }
              value={loan.amount_value}
              onChange={(e) =>
                updatePositiveNumberItem(
                  setLoanTypes,
                  index,
                  "amount_value",
                  e.target.value,
                )
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            />

            {/* Interest Rate */}
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Interest Rate (%)"
              value={loan.interest_rate}
              onChange={(e) =>
                updatePositiveNumberItem(
                  setLoanTypes,
                  index,
                  "interest_rate",
                  e.target.value,
                )
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            />

            {/* Duration */}
            <input
              type="number"
              min="0"
              placeholder="Duration (Months)"
              value={loan.duration_months}
              onChange={(e) =>
                updatePositiveNumberItem(
                  setLoanTypes,
                  index,
                  "duration_months",
                  e.target.value,
                )
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            />

            {/* Calculation Type */}
            <select
              value={loan.calculation_type}
              onChange={(e) =>
                updateItem(
                  setLoanTypes,
                  index,
                  "calculation_type",
                  e.target.value,
                )
              }
              className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500"
            >
              <option value="FLAT">Flat</option>
              <option value="REDUCING">Reducing</option>
            </select>

            {/* Exclude Months */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclude Months
              </label>

              <Select
                isMulti
                options={MONTH_OPTIONS}
                value={MONTH_OPTIONS.filter((m) =>
                  (loan.exclude_months || []).includes(m.value),
                )}
                onChange={(selected) =>
                  updateItem(
                    setLoanTypes,
                    index,
                    "exclude_months",
                    selected.map((s) => s.value),
                  )
                }
                placeholder="Select months to exclude..."
                className="text-sm"
                classNamePrefix="react-select"
              />
            </div>

            {/* Approval Levels */}
            <div className="md:col-span-2 flex gap-6 mt-3">
              {/* Level 1 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Require Level 1 Approval
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateItem(
                      setLoanTypes,
                      index,
                      "require_level_1",
                      loan.require_level_1 === 1 ? 0 : 1,
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${loan.require_level_1 === 1 ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
          ${loan.require_level_1 === 1 ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>

                <span className="text-xs font-semibold">
                  {loan.require_level_1 === 1 ? "Enabled" : "Disabled"}
                </span>
              </div>

              {/* Level 2 */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">
                  Require Level 2 Approval
                </span>

                <button
                  type="button"
                  onClick={() =>
                    updateItem(
                      setLoanTypes,
                      index,
                      "require_level_2",
                      loan.require_level_2 === 1 ? 0 : 1,
                    )
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
        ${loan.require_level_2 === 1 ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
          ${loan.require_level_2 === 1 ? "translate-x-5" : "translate-x-1"}`}
                  />
                </button>

                <span className="text-xs font-semibold">
                  {loan.require_level_2 === 1 ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-medium text-gray-700">
                Active Status
              </span>

              <button
                type="button"
                onClick={() =>
                  updateItem(setLoanTypes, index, "is_active", !loan.is_active)
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 
      ${loan.is_active ? "bg-green-500" : "bg-gray-300"}`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-300
        ${loan.is_active ? "translate-x-5" : "translate-x-1"}`}
                />
              </button>

              <span
                className={`text-xs font-semibold ${
                  loan.is_active ? "text-green-600" : "text-gray-500"
                }`}
              >
                {loan.is_active ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPerformanceTypes = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          Performance Types
        </h3>
        <button
          onClick={() =>
            addItem(setPerformanceTypes, {
              name: "",
              start_from: "",
              evaluation_type: "",
              department_designations: {},
              status: "active",
              tempDept: "",
              tempDesigs: "",
            })
          }
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Performance Type
        </button>
      </div>

      {performanceTypes.map((perf, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-600">
              Performance Type {index + 1}
            </span>
            {performanceTypes.length > 1 && (
              <button
                onClick={() => removeItem(setPerformanceTypes, index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={perf.name}
                onChange={(e) =>
                  updateItem(setPerformanceTypes, index, "name", e.target.value)
                }
                placeholder="Annual Evaluation"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start From
              </label>
              <select
                value={perf.start_from}
                onChange={(e) =>
                  updateItem(
                    setPerformanceTypes,
                    index,
                    "start_from",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              >
                <option value="">Select</option>
                <option value="supervisor">Supervisor</option>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Type
              </label>
              <input
                type="text"
                value={perf.evaluation_type}
                onChange={(e) =>
                  updateItem(
                    setPerformanceTypes,
                    index,
                    "evaluation_type",
                    e.target.value,
                  )
                }
                placeholder="Yearly | December"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2 p-3 border border-dashed rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department & Designations
              </label>
              <div className="flex flex-col md:flex-row gap-2">
                <input
                  type="text"
                  value={perf.tempDept || ""}
                  onChange={(e) =>
                    updateItem(
                      setPerformanceTypes,
                      index,
                      "tempDept",
                      e.target.value,
                    )
                  }
                  placeholder="IT"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={perf.tempDesigs || ""}
                  onChange={(e) =>
                    updateItem(
                      setPerformanceTypes,
                      index,
                      "tempDesigs",
                      e.target.value,
                    )
                  }
                  placeholder="Software Engineer, Team Lead"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!perf.tempDept || !perf.tempDesigs) return;

                    setPerformanceTypes((prev) =>
                      prev.map((p, i) =>
                        i === index
                          ? {
                              ...p,
                              department_designations: {
                                ...(p.department_designations || {}),
                                [perf.tempDept.trim()]: perf.tempDesigs
                                  .split(",")
                                  .map((x) => x.trim())
                                  .filter(Boolean),
                              },
                              tempDept: "",
                              tempDesigs: "",
                            }
                          : p,
                      ),
                    );
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Add
                </button>
              </div>

              {Object.keys(perf.department_designations || {}).length > 0 && (
                <ul className="mt-3 text-sm text-gray-700 list-disc ml-6">
                  {Object.entries(perf.department_designations).map(
                    ([dept, desigs]) => (
                      <li key={dept}>
                        <strong>{dept}</strong>: {(desigs || []).join(", ")}
                      </li>
                    ),
                  )}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={perf.status}
                onChange={(e) =>
                  updateItem(
                    setPerformanceTypes,
                    index,
                    "status",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBranches = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Branch Creation</h3>
        <button
          onClick={() => addItem(setBranches, { branch_name: "" })}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </button>
      </div>

      {branches.map((branch, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-600">
              Branch {index + 1}
            </span>
            {branches.length > 1 && (
              <button
                onClick={() => removeItem(setBranches, index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={branch.branch_name}
              onChange={(e) =>
                updateItem(setBranches, index, "branch_name", e.target.value)
              }
              placeholder="Head Office"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      ))}
    </div>
  );

  const renderWorkingOffices = () => (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-800">
        Working Office Creation
      </h3>
      {workingOfficeGroups.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No branches found. Please complete branch creation first.
        </p>
      ) : (
        workingOfficeGroups.map((group, groupIndex) => (
          <div
            key={group.branchId}
            className="border border-gray-200 rounded-lg bg-gray-50 p-5 space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">
                {group.branchName || `Branch ID: ${group.branchId}`}
              </h4>
              <button
                onClick={() => {
                  const updated = [...workingOfficeGroups];
                  updated[groupIndex].working_offices.push({
                    name: "",
                    description: "",
                  });
                  setWorkingOfficeGroups(updated);
                }}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Office
              </button>
            </div>

            {group.working_offices.map((office, officeIndex) => (
              <div
                key={officeIndex}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Office {officeIndex + 1}
                  </span>
                  {group.working_offices.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = [...workingOfficeGroups];
                        updated[groupIndex].working_offices.splice(
                          officeIndex,
                          1,
                        );
                        setWorkingOfficeGroups(updated);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Office Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={office.name}
                      onChange={(e) => {
                        const updated = [...workingOfficeGroups];
                        updated[groupIndex].working_offices[officeIndex].name =
                          e.target.value;
                        setWorkingOfficeGroups(updated);
                      }}
                      placeholder="Development Office"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={office.description}
                      onChange={(e) => {
                        const updated = [...workingOfficeGroups];
                        updated[groupIndex].working_offices[
                          officeIndex
                        ].description = e.target.value;
                        setWorkingOfficeGroups(updated);
                      }}
                      placeholder="Handles software development"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-800">
        Department Creation
      </h3>
      {departmentGroups.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No working offices found. Please complete the Working Office setup
          first.
        </p>
      ) : (
        departmentGroups.map((group, groupIndex) => (
          <div
            key={group.officeId}
            className="border border-gray-200 rounded-lg bg-gray-50 p-5 space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">
                {group.officeName || `Office ID: ${group.officeId}`}
              </h4>
              <button
                onClick={() => {
                  const updated = [...departmentGroups];
                  updated[groupIndex].departments.push({
                    name: "",
                    description: "",
                  });
                  setDepartmentGroups(updated);
                }}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Department
              </button>
            </div>

            {group.departments.map((dept, deptIndex) => (
              <div
                key={deptIndex}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Department {deptIndex + 1}
                  </span>
                  {group.departments.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = [...departmentGroups];
                        updated[groupIndex].departments.splice(deptIndex, 1);
                        setDepartmentGroups(updated);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={dept.name}
                      onChange={(e) => {
                        const updated = [...departmentGroups];
                        updated[groupIndex].departments[deptIndex].name =
                          e.target.value;
                        setDepartmentGroups(updated);
                      }}
                      placeholder="Development"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={dept.description}
                      onChange={(e) => {
                        const updated = [...departmentGroups];
                        updated[groupIndex].departments[deptIndex].description =
                          e.target.value;
                        setDepartmentGroups(updated);
                      }}
                      placeholder="Frontend & backend"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );

  const renderDesignations = () => (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-gray-800">
        Designation Creation
      </h3>
      {designationGroups.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No departments found. Please complete Department Creation first.
        </p>
      ) : (
        designationGroups.map((group, groupIndex) => (
          <div
            key={group.deptId}
            className="border border-gray-200 rounded-lg bg-gray-50 p-5 space-y-4"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">
                {group.deptName || `Department ID: ${group.deptId}`}
              </h4>
              <button
                onClick={() => {
                  const updated = [...designationGroups];
                  updated[groupIndex].designations.push({ title: "" });
                  setDesignationGroups(updated);
                }}
                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Designation
              </button>
            </div>

            {group.designations.map((desig, desigIndex) => (
              <div
                key={desigIndex}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Designation {desigIndex + 1}
                  </span>
                  {group.designations.length > 1 && (
                    <button
                      onClick={() => {
                        const updated = [...designationGroups];
                        updated[groupIndex].designations.splice(desigIndex, 1);
                        setDesignationGroups(updated);
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Designation Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={desig.title}
                    onChange={(e) => {
                      const updated = [...designationGroups];
                      updated[groupIndex].designations[desigIndex].title =
                        e.target.value;
                      setDesignationGroups(updated);
                    }}
                    placeholder="Software Engineer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );

  const renderEmploymentTypes = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Employee Type Adding
      </h3>
      {employmentTypesData.map((emp, index) => (
        <div
          key={index}
          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-medium text-gray-600">
              Employee Type {index + 1}
            </span>
            {employmentTypesData.length > 1 && (
              <button
                onClick={() =>
                  setEmploymentTypesData((prev) =>
                    prev.filter((_, i) => i !== index),
                  )
                }
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <input
            type="text"
            value={emp.type_name}
            onChange={(e) => {
              const updated = [...employmentTypesData];
              updated[index].type_name = e.target.value;
              setEmploymentTypesData(updated);
            }}
            placeholder="Permanent"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      ))}
      <button
        onClick={() =>
          setEmploymentTypesData((prev) => [...prev, { type_name: "" }])
        }
        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Employee Type
      </button>
    </div>
  );

  /**
   * Render per active tab
   */
  const renderOrgStepContent = () => {
    switch (orgStep) {
      case 0:
        return renderOrgDetails();
      case 1:
        return renderBillTypes();
      case 2:
        return renderLoanTypes();
      case 3:
        return renderPerformanceTypes();
      default:
        return null;
    }
  };

  const renderTabContent = () => {
    if (activeTab === 0) {
      return (
        <div className="space-y-6">
          {/* Visual stepper */}
          <div className="flex items-center justify-between mb-8">
            {orgSteps.map((step, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= orgStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      index <= orgStep
                        ? "text-blue-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
                {index < orgSteps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${index < orgStep ? "bg-blue-600" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          {renderOrgStepContent()}

          {/* Prev/Next/Submit */}
          <div className="flex justify-between pt-6 border-t">
            <button
              onClick={() => setOrgStep((p) => Math.max(0, p - 1))}
              disabled={orgStep === 0}
              className={`px-6 py-2 rounded-lg font-medium ${
                orgStep === 0
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
              }`}
            >
              Previous
            </button>

            {orgStep < orgSteps.length - 1 ? (
              <button
                onClick={() => setOrgStep((p) => p + 1)}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmitOrganization}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Submit & Continue
              </button>
            )}
          </div>
        </div>
      );
    }

    if (activeTab === 1) return renderBranches();
    if (activeTab === 2) return renderWorkingOffices();
    if (activeTab === 3) return renderDepartments();
    if (activeTab === 4) return renderDesignations();
    if (activeTab === 5) return renderEmploymentTypes();
    if (activeTab === 6) return renderLeaveCategories();
    return null;
  };

  const guardedSetActiveTab = (index) => {
    if (index > activeTab) {
      // allow only next immediate step
      if (index === activeTab + 1) {
        setActiveTab(index);
      } else {
        toast.warn("⚠️ Please complete the current step first.");
      }
    } else {
      setActiveTab(index);
      if (index === 0) setOrgStep(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 font-montserrat">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-blue-600">
          <h1 className="text-3xl font-bold text-gray-800">System Setup</h1>
          <p className="text-gray-600 mt-2">
            Configure your HRMS system settings and organization structure
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-200">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => guardedSetActiveTab(index)}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition-all ${
                  activeTab === index
                    ? "border-b-3 border-blue-600 text-blue-600 bg-blue-50"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {renderTabContent()}

          {/* Footer actions (Save & Continue / Prev) for non-organization tabs */}
          {activeTab !== 0 && (
            <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
              <button
                onClick={() => guardedSetActiveTab(Math.max(0, activeTab - 1))}
                className="px-8 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                ← Previous
              </button>

              {activeTab === 1 && (
                <button
                  onClick={handleSubmitBranches}
                  disabled={
                    !createdOrgId ||
                    branches.every((b) => !b.branch_name.trim())
                  }
                  className={`px-8 py-2.5 rounded-lg font-semibold transition-all ${
                    !createdOrgId ||
                    branches.every((b) => !b.branch_name.trim())
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700 shadow hover:shadow-lg"
                  }`}
                >
                  Save & Continue →
                </button>
              )}

              {activeTab === 2 && (
                <button
                  onClick={handleSubmitWorkingOffices}
                  disabled={
                    !workingOfficeGroups.length ||
                    workingOfficeGroups.every((g) =>
                      g.working_offices.every((o) => !(o.name || "").trim()),
                    )
                  }
                  className={`px-8 py-2 rounded-lg font-medium ${
                    !workingOfficeGroups.length ||
                    workingOfficeGroups.every((g) =>
                      g.working_offices.every((o) => !(o.name || "").trim()),
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Save & Continue
                </button>
              )}

              {activeTab === 3 && (
                <button
                  onClick={handleSubmitDepartments}
                  disabled={
                    !departmentGroups.length ||
                    departmentGroups.every((g) =>
                      g.departments.every((d) => !(d.name || "").trim()),
                    )
                  }
                  className={`px-8 py-2 rounded-lg font-medium ${
                    !departmentGroups.length ||
                    departmentGroups.every((g) =>
                      g.departments.every((d) => !(d.name || "").trim()),
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Save & Continue
                </button>
              )}

              {activeTab === 4 && (
                <button
                  onClick={handleSubmitDesignations}
                  disabled={
                    !designationGroups.length ||
                    designationGroups.every((g) =>
                      g.designations.every((d) => !(d.title || "").trim()),
                    )
                  }
                  className={`px-8 py-2 rounded-lg font-medium ${
                    !designationGroups.length ||
                    designationGroups.every((g) =>
                      g.designations.every((d) => !(d.title || "").trim()),
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Save & Continue
                </button>
              )}

              {activeTab === 5 && (
                <button
                  onClick={handleSubmitEmploymentTypes}
                  disabled={employmentTypesData.every(
                    (t) => !(t.type_name || "").trim(),
                  )}
                  className={`px-8 py-2 rounded-lg font-medium ${
                    employmentTypesData.every(
                      (t) => !(t.type_name || "").trim(),
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Save & Continue
                </button>
              )}

              {activeTab === 6 && (
                <button
                  onClick={handleSubmitLeaveCategories}
                  disabled={leaveCategories.every(
                    (l) => !(l.category_name || "").trim(),
                  )}
                  className={`px-8 py-2 rounded-lg font-medium ${
                    leaveCategories.every(
                      (l) => !(l.category_name || "").trim(),
                    )
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Save & Finish
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemSetup;
