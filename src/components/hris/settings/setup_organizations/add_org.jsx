import React, { useEffect, useState } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/**
 * LocalStorage keys (one per user-editable section)
 */
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

  /**
   * NAV State
   */
  const [activeTab, setActiveTab] = useState(0); // 0..5
  const [orgStep, setOrgStep] = useState(0); // 0..4

  /**
   * Server-created IDs (used to chain next requests)
   */
  const [createdOrgId, setCreatedOrgId] = useState(null);
  const [createdBranches, setCreatedBranches] = useState([]); // API response after creating branches
  const [createdOffices, setCreatedOffices] = useState([]); // API response after creating offices
  const [createdDepartments, setCreatedDepartments] = useState([]); // API response after creating departments
  const [createdDesignations, setCreatedDesignations] = useState([]); // API response after creating designations

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
        create_by: "",
        employeement_type: "",
        eligible_gender: "",
        weight: "",
        no_of_days: "",
      },
    ]),
  );

  const [loanTypes, setLoanTypes] = useState(
    ls.get(STORAGE_KEYS.loanTypes, [
      { loan_type: "", max_amount: "", interest_rate: "" },
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

  /**
   * Branch -> Only branch_name input
   */
  const [branches, setBranches] = useState(
    ls.get(STORAGE_KEYS.branches, [{ branch_name: "" }]),
  );

  /**
   * Working Offices (groups per created branch)
   * [
   *   { branchId, branchName, working_offices: [{name, description}, ...] }
   * ]
   */
  const [workingOfficeGroups, setWorkingOfficeGroups] = useState(
    ls.get(STORAGE_KEYS.workingOfficeGroups, []),
  );

  /**
   * Departments (groups per created working office)
   * [
   *   { officeId, officeName, departments: [{name, description}, ...] }
   * ]
   */
  const [departmentGroups, setDepartmentGroups] = useState(
    ls.get(STORAGE_KEYS.departmentGroups, []),
  );

  /**
   * Designations (groups per created department)
   * [
   *   { deptId, deptName, designations: [{title}, ...] }
   * ]
   */
  const [designationGroups, setDesignationGroups] = useState(
    ls.get(STORAGE_KEYS.designationGroups, []),
  );

  /**
   * Employment Types payload
   * [{type_name}]
   */
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

  /**
   * Tabs/Steps
   */
  const tabs = [
    "Organization Creation",
    "Branch Creation",
    "Working Office Creation",
    "Department Creation",
    "Designation Creation",
    "Employment Type Adding",
  ];

  const orgSteps = [
    "Organization Details",
    "Bill Types",
    "Leave Categories",
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

  /**
   * API handlers
   */
  const handleSubmitOrganization = async () => {
    try {
      // Build nested payload as per spec
      const payload = {
        ...orgDetails,
        bill_types: billTypes
          .filter((b) => b.bill_type.trim())
          .map((b) => ({
            bill_type: b.bill_type,
            max_amount: Number(b.max_amount || 0),
            min_amount: Number(b.min_amount || 0),
          })),
        leave_categories: leaveCategories
          .filter((l) => l.category_name.trim())
          .map((l) => ({
            category_name: l.category_name,
            recurrence_type: l.recurrence_type,
            apply_before_day: Number(l.apply_before_day || 0),
            create_by: l.create_by,
            employeement_type: l.employeement_type,
            eligible_gender: l.eligible_gender,
            weight: Number(l.weight || 0),
            no_of_days: Number(l.no_of_days || 0),
          })),
        loan_types: loanTypes
          .filter((l) => l.loan_type.trim())
          .map((l) => ({
            name: l.loan_type,
            timePeriod: 12, // default
            loanInterest: Number(l.interest_rate || 0),
            loanAmount: Number(l.max_amount || 0),
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

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/add-organization`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.message || "Failed to create organization");
        return;
      }

      toast.success(" Organization created successfully!");
      const orgId = data?.data?.id;
      setCreatedOrgId(orgId);

      // Move to Branch tab, user fills inputs and clicks Save & Continue to POST branches
      setActiveTab(1);
      setOrgStep(0);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while creating organization");
    }
  };

  const handleSubmitBranches = async () => {
    if (!createdOrgId) {
      toast.error("Organization ID missing. Please create organization first.");
      return;
    }
    try {
      const payload = {
        branches: branches
          .filter((b) => b.branch_name.trim())
          .map((b) => ({ branch: b.branch_name.trim() })),
      };

      const res = await fetch(
        `${API_URL}/v1/hris/organizations/branch/${createdOrgId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🏢 Branches added successfully!");
        setCreatedBranches(data.data || []);

        // Prepare Working office groups for each created branch ID
        const initialized = (data.data || []).map((b) => ({
          branchId: b.id,
          branchName: b.branch,
          working_offices: [{ name: "", description: "" }],
        }));
        setWorkingOfficeGroups(initialized);

        // Move to Working Office Creation
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
    try {
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🏢 Working offices added successfully!");
        setCreatedOffices(data.data || []);

        // Initialize Department groups for each returned working office id
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
    try {
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🏬 Departments added successfully!");
        setCreatedDepartments(data.data || []);

        // Init designation groups with department ids
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
    try {
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success("🎉 Designations added successfully!");
        setCreatedDesignations(data.data || []);
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
    try {
      // org id from designations response (or fallback to createdOrgId)
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = await res.json();

      if (res.ok && data.success) {
        toast.success(" Employment types added successfully!");

        // Clear LocalStorage (all user-entry stores)
        ls.removeMany(Object.values(STORAGE_KEYS));

        // Full reset
        setActiveTab(0);
        setOrgStep(0);

        setCreatedOrgId(null);
        setCreatedBranches([]);
        setCreatedOffices([]);
        setCreatedDepartments([]);
        setCreatedDesignations([]);

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
        setLeaveCategories([
          {
            category_name: "",
            recurrence_type: "",
            apply_before_day: "",
            create_by: "",
            employeement_type: "",
            eligible_gender: "",
            weight: "",
            no_of_days: "",
          },
        ]);
        setLoanTypes([{ loan_type: "", max_amount: "", interest_rate: "" }]);
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
      } else {
        toast.error(data.message || "Failed to add employment types");
      }
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while adding employment types");
    }
  };

  /**
   * UI renders per-step/section
   */
  const renderOrgDetails = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800">
        Organization Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              create_by: "",
              employeement_type: "",
              eligible_gender: "",
              weight: "",
              no_of_days: "",
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Created By
              </label>
              <input
                type="text"
                value={cat.create_by}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "create_by",
                    e.target.value,
                  )
                }
                placeholder="Admin"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              <input
                type="text"
                value={cat.employeement_type}
                onChange={(e) =>
                  updateItem(
                    setLeaveCategories,
                    index,
                    "employeement_type",
                    e.target.value,
                  )
                }
                placeholder="Permanent, Contract"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500"
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
              loan_type: "",
              max_amount: "",
              interest_rate: "",
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
          className="p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-medium text-gray-600">
              Loan Type {index + 1}
            </span>
            {loanTypes.length > 1 && (
              <button
                onClick={() => removeItem(setLoanTypes, index)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Type
              </label>
              <input
                type="text"
                value={loan.loan_type}
                onChange={(e) =>
                  updateItem(setLoanTypes, index, "loan_type", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Personal Loan"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Amount
              </label>
              <input
                type="number"
                min="0"
                value={loan.max_amount}
                onChange={(e) =>
                  updatePositiveNumberItem(
                    setLoanTypes,
                    index,
                    "max_amount",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={loan.interest_rate}
                onChange={(e) =>
                  updatePositiveNumberItem(
                    setLoanTypes,
                    index,
                    "interest_rate",
                    e.target.value,
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="5.5"
              />
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
                    if (perf.tempDept && perf.tempDesigs) {
                      const updated = {
                        ...perf.department_designations,
                        [perf.tempDept]: perf.tempDesigs
                          .split(",")
                          .map((x) => x.trim()),
                      };
                      updateItem(
                        setPerformanceTypes,
                        index,
                        "department_designations",
                        updated,
                      );
                      updateItem(setPerformanceTypes, index, "tempDept", "");
                      updateItem(setPerformanceTypes, index, "tempDesigs", "");
                    }
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
        return renderLeaveCategories();
      case 3:
        return renderLoanTypes();
      case 4:
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
    return null;
  };

  /**
   * Prevent skipping forward:
   * - You can always go back
   * - You can move forward only to currentTab or currentTab+1
   */
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
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">System Setup</h1>
          <p className="text-gray-600 mt-2">
            Configure your HRMS system settings
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex overflow-x-auto border-b">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => guardedSetActiveTab(index)}
                className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                  activeTab === index
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {renderTabContent()}

          {/* Footer actions (Save & Continue / Prev) for non-organization tabs */}
          {activeTab !== 0 && (
            <div className="flex justify-between pt-6 border-t mt-6">
              <button
                onClick={() => guardedSetActiveTab(Math.max(0, activeTab - 1))}
                className="px-8 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
              >
                Previous
              </button>

              {activeTab === 1 && (
                <button
                  onClick={handleSubmitBranches}
                  disabled={
                    !createdOrgId ||
                    branches.every((b) => !b.branch_name.trim())
                  }
                  className={`px-8 py-2 rounded-lg font-medium ${
                    !createdOrgId ||
                    branches.every((b) => !b.branch_name.trim())
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Save & Continue
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
