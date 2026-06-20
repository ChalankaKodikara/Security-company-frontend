/** @format */
import React, { useMemo, useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CiSquarePlus } from "react-icons/ci";
import Select from "react-select";

const OrganizationSetupEdit = () => {
  const location = useLocation();
  const orgData = location.state?.orgData; // the object passed from navigate()
  console.log("🟢 Received Org Data:", orgData);
  const [activeTab, setActiveTab] = useState(0); // 0..5
  const [orgStep, setOrgStep] = useState(0); // 0..4
  const [workingOfficeGroups, setWorkingOfficeGroups] = useState([]);
  const [loadingOffices, setLoadingOffices] = useState(false);
  const [departmentGroups, setDepartmentGroups] = useState([]); // [{ officeId, officeName, departments: [] }]
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [designationGroups, setDesignationGroups] = useState([]); // [{ deptId, deptName, designations: [] }]
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [employmentTypesData, setEmploymentTypesData] = useState([]);
  const [loadingEmploymentTypes, setLoadingEmploymentTypes] = useState(false);
  const [loadingLeaveCategories, setLoadingLeaveCategories] = useState(false);
  const [loadingBillTypes, setLoadingBillTypes] = useState(false);
  const [loadingLoanTypes, setLoadingLoanTypes] = useState(false);
  const [loadingPerformanceTypes, setLoadingPerformanceTypes] = useState(false);
  const [initialBranches, setInitialBranches] = useState([]);
  const loggedUser = Cookies.get("username") || Cookies.get("user_name");

  const tmpl = useMemo(
    () => ({
      orgDetails: {
        organization_name: "",
        code: "",
        email: "",
        contact_no: "",
        address: "",
        is_payroll_enabled: true,
        is_attendance_enabled: true,
        is_leave_enabled: true,
      },
      billType: { bill_type: "", max_amount: "", min_amount: "" },
      leaveCategory: {
        category_name: "",
        recurrence_type: "",
        apply_before_day: "",
        create_by: "",
        employeement_type: "",
        eligible_gender: "",
        weight: "",
        no_of_days: "",
      },
      loanType: {
        id: "",
        name: "",
        loanAmount: "",
        timePeriod: "",
        loanInterest: "",
        employment: "",
        organization_id: "",
      },
      performanceType: {
        name: "",
        start_from: "",
        evaluation_type: "",
        department_designations: {},
        status: "active",
        tempDept: "",
        tempDesigs: "",
      },
      branch: { branch_name: "" },
      workingOffice: { name: "", description: "" },
      department: { name: "", description: "" },
      designation: { title: "" },
      employmentType: { type_name: "" },
    }),
    [],
  );
  const [orgDetails, setOrgDetails] = useState({
    organization_name: orgData?.organization_name || "",
    code: orgData?.code || "",
    email: orgData?.email || "",
    contact_no: orgData?.contact_no || "",
    address: orgData?.address || "",
    is_payroll_enabled: orgData?.is_payroll_enabled ?? true,
    is_attendance_enabled: orgData?.is_attendance_enabled ?? true,
    is_leave_enabled: orgData?.is_leave_enabled ?? true,
  });

  const [billTypes, setBillTypes] = useState([tmpl.billType]);
  const [leaveCategories, setLeaveCategories] = useState([tmpl.leaveCategory]);
  const [loanTypes, setLoanTypes] = useState([tmpl.loanType]);
  const [performanceTypes, setPerformanceTypes] = useState([
    tmpl.performanceType,
  ]);
  const [branches, setBranches] = useState([tmpl.branch]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const addItem = (setter, template) => setter((p) => [...p, { ...template }]);
  const removeItem = (setter, index) =>
    setter((p) => p.filter((_, i) => i !== index));
  const updateItem = (setter, index, field, value) =>
    setter((p) =>
      p.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    );
  const updatePositiveNumberItem = (setter, index, field, value) => {
    if (value === "" || Number(value) >= 0) {
      updateItem(setter, index, field, value);
    }
  };

  /* ========== WIZARD TITLES ========== */
  const tabs = [
    "Organization Setup",
    "Branch Creation",
    "Working Office Creation",
    "Department Creation",
    "Designation Creation",
    "Employment Types",
    "Leave Categories",
  ];

  const orgSteps = [
    "Organization Details",
    "Bill Types",
    "Loan Types",
    "Performance Types",
  ];

  useEffect(() => {
    if (!orgData?.id) return;

    const fetchEmploymentTypes = async () => {
      try {
        setLoadingEmploymentTypes(true);
        const token = Cookies.get("accessToken");
        const API_URL = process.env.REACT_APP_FRONTEND_URL;

        const res = await axios.get(
          `${API_URL}/v1/hris/organizations/employment-types/${orgData.id}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((t) => ({
            id: t.id,
            type_name: t.type_name,
          }));
          setEmploymentTypesData(formatted);
        } else {
          setEmploymentTypesData([]);
        }
      } catch (error) {
        console.error("❌ Error fetching employment types:", error);
      } finally {
        setLoadingEmploymentTypes(false);
      }
    };

    fetchEmploymentTypes();
  }, [orgData]);

  useEffect(() => {
    if (!orgData?.id) return;

    const fetchLeaveCategories = async () => {
      try {
        setLoadingLeaveCategories(true);
        const token = Cookies.get("accessToken");
        const API_URL = process.env.REACT_APP_FRONTEND_URL;

        const res = await axios.get(
          `${API_URL}/v1/hris/organizations/leave-categories`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { organization_id: orgData.id }, //  pass as query param
          },
        );

        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((cat) => ({
            category_id: cat.id,
            category_name: cat.category_name || "",
            recurrence_type: cat.recurrence_type || "",
            apply_before_day: cat.apply_before_day || 0,
            create_by: cat.create_by || "",
            employeement_type_id: Array.isArray(cat.employeement_type)
              ? cat.employeement_type
              : [],
            eligible_gender: cat.eligible_gender || "Both",
            weight: cat.weight || 1,
            no_of_days: cat.no_of_days || 0,
            half_day_allowed: !!cat.half_day_allowed,
            exclude_holidays: !!cat.exclude_holidays,
            encash_allowed: !!cat.encash_allowed,
            max_encash_days: cat.max_encash_days ?? "",
            carry_forward_allowed: !!cat.carry_forward_allowed,
            reset_date: cat.reset_date || "",
          }));

          setLeaveCategories(formatted);
        } else {
          setLeaveCategories([]);
        }
      } catch (err) {
        console.error("❌ Error fetching leave categories:", err);
      } finally {
        setLoadingLeaveCategories(false);
      }
    };

    fetchLeaveCategories();
  }, [orgData]);

  useEffect(() => {
    if (!orgData?.id) return;

    const fetchBillTypes = async () => {
      try {
        setLoadingBillTypes(true);
        const token = Cookies.get("accessToken");
        const API_URL = process.env.REACT_APP_FRONTEND_URL;

        const res = await axios.get(
          `${API_URL}/v1/hris/organizations/bill-types`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { organization_id: orgData.id }, //  query parameter
          },
        );

        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((bill) => ({
            id: bill.id,
            bill_type: bill.bill_type || "",
            max_amount: bill.max_amount || "",
            min_amount: bill.min_amount || "",
            organization_id: bill.organization_id,
          }));

          setBillTypes(formatted);
        } else {
          setBillTypes([]);
        }
      } catch (err) {
        console.error("❌ Error fetching bill types:", err);
      } finally {
        setLoadingBillTypes(false);
      }
    };

    fetchBillTypes();
  }, [orgData]);
  useEffect(() => {
    if (!orgData?.id) return;

    const fetchLoanTypes = async () => {
      try {
        setLoadingLoanTypes(true);
        const token = Cookies.get("accessToken");
        const API_URL = process.env.REACT_APP_FRONTEND_URL;

        const res = await axios.get(
          `${API_URL}/v1/hris/organizations/loan-types`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { organization_id: orgData.id },
          },
        );

        console.log("📦 Loan Type Response:", res.data);

        //  FIXED: handle both wrapped and direct array responses
        const loanArray = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data.data)
            ? res.data.data
            : [];

        if (loanArray.length > 0) {
          const formatted = loanArray.map((loan) => ({
            id: loan.id,

            code: loan.code || "",
            name: loan.name || "",
            amount_type: loan.amount_type || "FIXED",
            calculation_type: loan.calculation_type || "FLAT",
            is_active: loan.is_active === 1 ? 1 : 0,
            loanAmount: loan.amount_value || "",
            timePeriod: loan.duration_months || "",
            loanInterest: loan.interest_rate || "",
            exclude_months: loan.exclude_months ?? null,
            require_level_1: loan.require_level_1 === 1 ? 1 : 0,
            require_level_2: loan.require_level_2 === 1 ? 1 : 0,
          }));

          console.log(" Loaded Loan Types:", formatted);
          setLoanTypes(formatted);
        } else {
          setLoanTypes([]);
        }
      } catch (err) {
        console.error("❌ Error fetching loan types:", err);
        setLoanTypes([]);
      } finally {
        setLoadingLoanTypes(false);
      }
    };

    fetchLoanTypes();
  }, [orgData?.id]);

  useEffect(() => {
    if (!orgData?.id) return;

    const fetchPerformanceTypes = async () => {
      try {
        setLoadingPerformanceTypes(true);
        const token = Cookies.get("accessToken");
        const API_URL = process.env.REACT_APP_FRONTEND_URL;

        const res = await axios.get(
          `${API_URL}/v1/hris/organizations/performance-types`,
          {
            headers: { Authorization: `Bearer ${token}` },
            params: { organization_id: orgData.id }, //  pass org ID as query param
          },
        );

        console.log("📦 Performance Types Response:", res.data);

        if (res.data.success && Array.isArray(res.data.data)) {
          const formatted = res.data.data.map((p) => ({
            id: p.id,
            name: p.name || "",
            start_from: p.start_from || "",
            evaluation_type: p.evaluation_type || "",
            department_designations: p.department_designations || {},
            status: p.status || "active",
            organization_id: p.organization_id,
          }));

          console.log(" Loaded Performance Types:", formatted);
          setPerformanceTypes(formatted);
        } else {
          setPerformanceTypes([]);
        }
      } catch (err) {
        console.error("❌ Error fetching performance types:", err);
        setPerformanceTypes([]);
      } finally {
        setLoadingPerformanceTypes(false);
      }
    };

    fetchPerformanceTypes();
  }, [orgData?.id]);

  const updateOffice = (gIdx, oIdx, field, value) => {
    setWorkingOfficeGroups((prev) =>
      prev.map((group, i) =>
        i === gIdx
          ? {
              ...group,
              working_offices: group.working_offices.map((off, j) =>
                j === oIdx ? { ...off, [field]: value } : off,
              ),
            }
          : group,
      ),
    );
  };

  const updateDepartment = (gIdx, dIdx, field, value) => {
    setDepartmentGroups((prev) =>
      prev.map((group, i) =>
        i === gIdx
          ? {
              ...group,
              departments: group.departments.map((dept, j) =>
                j === dIdx ? { ...dept, [field]: value } : dept,
              ),
            }
          : group,
      ),
    );
  };

  const handleUpdateOrganization = async () => {
    try {
      const token = Cookies.get("accessToken");
      const API_URL = process.env.REACT_APP_FRONTEND_URL;
      const orgId = orgData?.id;

      if (!orgId) {
        toast.error("Organization ID not found.");
        return;
      }

      const payload = {
        organization_name: orgDetails.organization_name,
        code: orgDetails.code,
        email: orgDetails.email,
        contact_no: orgDetails.contact_no,
        address: orgDetails.address,
        is_payroll_enabled: orgDetails.is_payroll_enabled,
        is_attendance_enabled: orgDetails.is_attendance_enabled,
        is_leave_enabled: orgDetails.is_leave_enabled,
        status: "active",
        bill_types: billTypes.map((b) => ({
          bill_type: b.bill_type,
          max_amount: Number(b.max_amount) || 0,
          min_amount: Number(b.min_amount) || 0,
        })),
        leave_categories: leaveCategories.map((l) => ({
          category_name: l.category_name,
          recurrence_type: l.recurrence_type,
          apply_before_day: Number(l.apply_before_day) || 0,
          eligible_gender: l.eligible_gender,
          no_of_days: Number(l.no_of_days) || 0,
          weight: Number(l.weight) || 0,
        })),
        loan_types: loanTypes.map((loan) => ({
          code:
            loan.code ||
            loan.name.toUpperCase().replace(/\s+/g, "_").slice(0, 30),

          name: loan.name,
          amount_type: loan.amount_type || "FIXED",
          amount_value: Number(loan.loanAmount) || 0,
          interest_rate: Number(loan.loanInterest) || 0,
          duration_months: Number(loan.timePeriod) || 0,
          exclude_months: loan.exclude_months ?? null,
          calculation_type: loan.calculation_type || "FLAT",
          is_active: loan.is_active === 1 ? 1 : 0,

          // 🔥 STRICT NUMERIC FLAGS
          require_level_1: loan.require_level_1 === 1 ? 1 : 0,
          require_level_2: loan.require_level_2 === 1 ? 1 : 0,
        })),
        performance_types: performanceTypes.map((p) => ({
          name: p.name,
          start_from: p.start_from,
          evaluation_type: p.evaluation_type,
          status: p.status || "active",
        })),
      };

      console.log("PUT Payload:", payload);

      const res = await axios.put(
        `${API_URL}/v1/hris/organizations/edit-organization/${orgId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        toast.success("Organization updated successfully!");
        console.log(" Organization updated successfully:", res.data);
      } else {
        toast.error("Update failed! Please check data.");
        console.error("⚠️ Update failed:", res.data);
      }
    } catch (err) {
      console.error("❌ Error updating organization:", err);
      toast.error("Error updating organization. Check console for details.");
    }
  };

  const handleUpdateBranches = async () => {
    const token = Cookies.get("accessToken");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const orgId = orgData?.id;

    if (!orgId) {
      toast.error("Organization ID not found.");
      return;
    }

    // Detect if any change happened
    const isChanged =
      branches.length !== initialBranches.length ||
      branches.some(
        (b, i) => b.branch_name !== initialBranches[i]?.branch_name,
      );

    // If nothing changed, skip PUT and go next (to Working Office)
    if (!isChanged) {
      toast.info("No changes detected. Skipping update.");
      setActiveTab(2); //  directly go to Working Office tab
      return;
    }

    try {
      const payload = {
        branches: branches.map((b) => ({
          id: b.id,
          branch: b.branch_name || "",
        })),
      };

      console.log("📤 PUT Branch Payload:", payload);

      const res = await axios.put(
        `${API_URL}/v1/hris/organizations/organization/branches/${orgId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        toast.success("Branches updated successfully!");
        setInitialBranches([...branches]); // update baseline
        setActiveTab(2); //  jump directly to Working Office tab
      } else {
        toast.error("Failed to update branches.");
      }
    } catch (err) {
      console.error("❌ Error updating branches:", err);
      toast.error("Error updating branches.");
    }
  };

  const handleUpdateWorkingOffices = async () => {
    const token = Cookies.get("accessToken");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const orgId = orgData?.id;

    if (!orgId) {
      toast.error("Organization ID not found.");
      return;
    }

    //  Build payload (use branchId from data)
    const payload = {
      branches: branches.map((branch) => {
        const relatedGroup = workingOfficeGroups.find(
          (g) => g.branchId === branch.id,
        );

        const offices = (relatedGroup?.working_offices || []).map((o) => ({
          name: o.name?.trim() || "",
          description: o.description?.trim() || "",
        }));

        return {
          branchId: branch.id, //  required inside body
          working_offices: offices,
        };
      }),
    };

    console.log("📤 PUT Working Offices Payload:", payload);

    //  Skip update if nothing was entered
    const hasChanges = payload.branches.some((b) =>
      b.working_offices.some((o) => o.name.trim() !== ""),
    );

    if (!hasChanges) {
      toast.info("No changes detected. Skipping update.");
      setActiveTab(3); // move directly to Department tab
      return;
    }

    try {
      //  organizationId in URL, branchId inside payload
      const res = await axios.put(
        `${API_URL}/v1/hris/organizations/branch/${orgId}/working-offices`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        toast.success("Working offices updated successfully!");
        console.log(" Working offices updated:", res.data);
        setActiveTab(3); // 👉 move to Department Creation tab
      } else {
        toast.error("Failed to update working offices.");
        console.error("⚠️ Update failed:", res.data);
      }
    } catch (err) {
      console.error("❌ Error updating working offices:", err);
      toast.error("Error updating working offices. Check console for details.");
    }
  };

  const handleSaveWorkingOfficesByBranch = async (branchId, offices) => {
    const token = Cookies.get("accessToken");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const orgId = orgData?.id;

    if (!orgId) {
      toast.error("Organization ID not found.");
      return;
    }

    //  Payload for a single branch
    const payload = {
      branches: [
        {
          branchId: branchId,
          working_offices: offices.map((o) => ({
            name: o.name?.trim() || "",
            description: o.description?.trim() || "",
          })),
        },
      ],
    };

    console.log("📤 PUT Single Branch Working Office Payload:", payload);

    //  Basic validation
    const hasValidOffice = payload.branches[0].working_offices.some(
      (o) => o.name.trim() !== "",
    );

    if (!hasValidOffice) {
      toast.info("Please fill at least one working office name.");
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/v1/hris/organizations/branch/${orgId}/working-offices`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        toast.success("Working offices for this branch saved successfully!");

        console.log(" Working offices updated:", res.data);
      } else {
        toast.error("Failed to update working offices for this branch.");
        console.error("⚠️ Update failed:", res.data);
      }
    } catch (err) {
      console.error("❌ Error updating working offices:", err);
      toast.error("Error updating working offices. Check console for details.");
    }
  };

  const handleUpdateDepartments = async () => {
    const token = Cookies.get("accessToken");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    //  Build payload from departmentGroups
    const payload = {
      offices: departmentGroups.map((group) => ({
        officeId: group.officeId,
        departments: (group.departments || []).map((d) => ({
          name: d.name?.trim() || "",
          description: d.description?.trim() || "",
        })),
      })),
    };

    console.log("📤 PUT Department Payload:", payload);

    //  Detect if any departments have been entered or changed
    const hasChanges = payload.offices.some((office) =>
      office.departments.some((dept) => dept.name.trim() !== ""),
    );

    if (!hasChanges) {
      toast.info("No changes detected. Skipping update.");
      setActiveTab(4); // move directly to Designation Creation tab
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/v1/hris/organizations/working-office/departments`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        toast.success("Departments updated successfully!");
        console.log(" Departments updated:", res.data);
        setActiveTab(4); // 👉 Go to Designation Creation tab
      } else {
        toast.error("Failed to update departments.");
        console.error("⚠️ Update failed:", res.data);
      }
    } catch (err) {
      console.error("❌ Error updating departments:", err);
      toast.error("Error updating departments. Check console for details.");
    }
  };

  const updateDesignation = (gIdx, dIdx, field, value) => {
    setDesignationGroups((prev) =>
      prev.map((group, i) =>
        i === gIdx
          ? {
              ...group,
              designations: group.designations.map((desig, j) =>
                j === dIdx ? { ...desig, [field]: value } : desig,
              ),
            }
          : group,
      ),
    );
  };

  const handleUpdateEmploymentTypes = async () => {
    const token = Cookies.get("accessToken");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const orgId = orgData?.id;

    if (!orgId) {
      toast.error("Organization ID not found.");
      return;
    }

    //  Build payload
    const payload = {
      employment_types: (employmentTypesData || []).map((t) => ({
        type_name: t.type_name?.trim() || "",
      })),
    };

    console.log("📤 PUT Employment Types Payload:", payload);

    //  Detect if any data was entered
    const hasChanges = payload.employment_types.some(
      (t) => t.type_name.trim() !== "",
    );

    if (!hasChanges) {
      toast.info("No changes detected. Skipping update.");
      setActiveTab(6); // 👉 Move directly to Leave Category tab
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/v1/hris/organizations/organization/employment-types/${orgId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        toast.success("Employment types updated successfully!");
        console.log(" Employment types updated:", res.data);
        setActiveTab(6); // 👉 Move to Leave Category tab
      } else {
        toast.error("Failed to update employment types.");
        console.error("⚠️ Update failed:", res.data);
      }
    } catch (err) {
      console.error("❌ Error updating employment types:", err);
      toast.error(
        "Error updating employment types. Check console for details.",
      );
    }
  };
  //  Combined PUT for Employment Types + Leave Categories
  const handleUpdateEmploymentTypesAndLeaveCategories = async () => {
    const token = Cookies.get("accessToken");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;
    const orgId = orgData?.id;

    if (!orgId) {
      toast.error("Organization ID not found.");
      return;
    }

    const employmentPayload = {
      employment_types: (employmentTypesData || []).map((t) => ({
        type_name: t.type_name?.trim() || "",
      })),
    };

    const leavePayload = {
      leave_categories: [
        ...leaveCategories
          .filter((c) => c.category_id)
          .map((l) => ({
            category_id: l.category_id,
            category_name: l.category_name,
            recurrence_type: l.recurrence_type?.toUpperCase(),
            apply_before_day: Number(l.apply_before_day) || 0,
            create_by: l.create_by || "Admin",
            employeement_type_id: l.employeement_type_id || [],
            eligible_gender: l.eligible_gender,
            weight: Number(l.weight) || 1,
            no_of_days: Number(l.no_of_days) || 0,

            //  BOOLEAN FLAGS (AS-IS)
            half_day_allowed: !!l.half_day_allowed,
            exclude_holidays: !!l.exclude_holidays,
            encash_allowed: !!l.encash_allowed,
            max_encash_days: l.encash_allowed
              ? Number(l.max_encash_days) || 0
              : null,
            carry_forward_allowed: !!l.carry_forward_allowed,
            reset_date: l.carry_forward_allowed ? l.reset_date : null,
          })),

        ...leaveCategories
          .filter((c) => !c.category_id)
          .map((l) => ({
            category_name: l.category_name,
            recurrence_type: l.recurrence_type?.toUpperCase(),
            apply_before_day: Number(l.apply_before_day) || 0,
            create_by: l.create_by || "Admin",
            employeement_type_id: l.employeement_type_id || [],
            eligible_gender: l.eligible_gender,
            weight: Number(l.weight) || 1,
            no_of_days: Number(l.no_of_days) || 0,

            //  BOOLEAN FLAGS
            half_day_allowed: !!l.half_day_allowed,
            exclude_holidays: !!l.exclude_holidays,
            encash_allowed: !!l.encash_allowed,
            max_encash_days: l.encash_allowed
              ? Number(l.max_encash_days) || 0
              : null,
            carry_forward_allowed: !!l.carry_forward_allowed,
            reset_date: l.carry_forward_allowed ? l.reset_date : null,
          })),
      ],
    };

    const hasEmployment = employmentPayload.employment_types?.some(
      (t) => (t.type_name || "").trim() !== "",
    );
    const hasLeave = leavePayload.leave_categories.some(
      (l) => (l.category_name || "").trim() !== "",
    );

    if (!hasEmployment && !hasLeave) {
      toast.info("Please add at least one employment type or leave category.");
      return;
    }

    try {
      if (hasEmployment) {
        const res1 = await axios.put(
          `${API_URL}/v1/hris/organizations/organization/employment-types/${orgId}`,
          employmentPayload,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        res1.data.success
          ? toast.success("Employment types updated successfully!")
          : toast.error("Failed to update employment types.");
      }

      /* -------- UPDATE LEAVE CATEGORIES -------- */
      if (hasLeave) {
        const res2 = await axios.put(
          `${API_URL}/v1/hris/organizations/leave-categories/${orgId}`,
          leavePayload,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        res2.data.success
          ? toast.success("Leave categories updated successfully!")
          : toast.error("Failed to update leave categories.");
      }

      toast.success("Organization setup completed!");
    } catch (err) {
      console.error("❌ Error updating employment/leave:", err);
      toast.error("Error updating employment types or leave categories.");
    }
  };

  const handleUpdateDesignations = async () => {
    const token = Cookies.get("accessToken");
    const API_URL = process.env.REACT_APP_FRONTEND_URL;

    //  Build payload
    const payload = {
      departments: designationGroups.map((group) => ({
        deptId: group.deptId,
        designations: (group.designations || []).map((d) => ({
          title: d.title?.trim() || "",
        })),
      })),
    };

    console.log("📤 PUT Designation Payload:", payload);

    //  Detect if there are any changes
    const hasChanges = payload.departments.some((dept) =>
      dept.designations.some((d) => d.title.trim() !== ""),
    );

    if (!hasChanges) {
      toast.info("No changes detected. Skipping update.");
      setActiveTab(5); // 👉 Move to Employment Type tab
      return;
    }

    try {
      const res = await axios.put(
        `${API_URL}/v1/hris/organizations/departments/designations`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        toast.success("Designations updated successfully!");
        console.log(" Designations updated:", res.data);
        setActiveTab(5); // 👉 Move to Employment Type tab
      } else {
        toast.error("Failed to update designations.");
        console.error("⚠️ Update failed:", res.data);
      }
    } catch (err) {
      console.error("❌ Error updating designations:", err);
      toast.error("Error updating designations. Check console for details.");
    }
  };

  useEffect(() => {
    if (!orgData?.id) return;

    const fetchOrgStructure = async () => {
      try {
        const token = Cookies.get("accessToken");
        const API_URL = process.env.REACT_APP_FRONTEND_URL;
        const orgId = orgData.id;

        console.log("📡 Fetching full structure for org:", orgId);
        const res = await axios.get(
          `${API_URL}/v1/hris/organizations/organizations/${orgId}/structure`,
          { headers: { Authorization: `Bearer ${token}` } },
        );

        if (res.data.success && Array.isArray(res.data.data)) {
          const structure = res.data.data;
          console.log(" Structure response:", structure);

          // --- Branches ---
          const formattedBranches = structure.map((b) => ({
            id: b.branch_id,
            branch_name: b.branch_name,
          }));
          setBranches(formattedBranches);
          setInitialBranches(formattedBranches);

          // --- Working Offices grouped by branch ---
          const officeGroups = structure.map((branch) => ({
            branchId: branch.branch_id,
            branchName: branch.branch_name,
            working_offices: (branch.working_offices || []).map((office) => ({
              id: office.office_id,
              name: office.office_name,
              description: office.office_description,
              branch_id: branch.branch_id,
            })),
          }));
          setWorkingOfficeGroups(officeGroups);

          // --- Departments grouped by working office ---
          const deptGroups = [];
          structure.forEach((branch) => {
            branch.working_offices?.forEach((office) => {
              deptGroups.push({
                officeId: office.office_id,
                officeName: office.office_name,
                departments: (office.departments || []).map((dept) => ({
                  id: dept.department_id,
                  name: dept.department_name,
                  description: dept.department_description,
                })),
              });
            });
          });
          setDepartmentGroups(deptGroups);

          // --- Designations grouped by department ---
          const desigGroups = [];
          structure.forEach((branch) => {
            branch.working_offices?.forEach((office) => {
              office.departments?.forEach((dept) => {
                desigGroups.push({
                  deptId: dept.department_id,
                  deptName: dept.department_name,
                  designations: (dept.designations || []).map((d) => ({
                    id: d.id,
                    title: d.title,
                  })),
                });
              });
            });
          });
          setDesignationGroups(desigGroups);

          toast.success("Organization structure loaded successfully!");
        } else {
          toast.error("No structure data found.");
        }
      } catch (err) {
        console.error("❌ Error fetching organization structure:", err);
        toast.error(
          "Failed to load organization structure. Check console for details.",
        );
      } finally {
        setLoadingBranches(false);
        setLoadingOffices(false);
        setLoadingDepartments(false);
        setLoadingDesignations(false);
      }
    };

    fetchOrgStructure();
  }, [orgData?.id]);

  const renderOrgDetails = () => (
    <div>
      <h3 className="text-lg font-semibold text-gray-800">
        Organization Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
            className="w-full px-4 py-2 border rounded-lg"
            placeholder=" HRMS Pvt Ltd"
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
            className="w-full px-4 py-2 border rounded-lg"
            placeholder=""
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
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="info@.com"
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
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="+94 11 345 6789"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={orgDetails.address}
            onChange={(e) =>
              setOrgDetails({ ...orgDetails, address: e.target.value })
            }
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Colombo, Sri Lanka"
          />
        </div>

        {/* Enabled Modules */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Enabled Modules <span className="text-red-500">*</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              ["is_payroll_enabled", "Payroll"],
              ["is_attendance_enabled", "Attendance"],
              ["is_leave_enabled", "Leave"],
            ].map(([key, label]) => (
              <div key={key} className="space-y-1">
                <p className="text-sm font-medium text-gray-700">{label}</p>
                <div className="flex items-center gap-6">
                  <label className="text-sm">
                    <input
                      type="radio"
                      name={key} /* important for mutual exclusion */
                      checked={!!orgDetails[key]}
                      onChange={() =>
                        setOrgDetails((s) => ({ ...s, [key]: true }))
                      }
                      className="mr-2"
                    />
                    Enable
                  </label>

                  <label className="text-sm">
                    <input
                      type="radio"
                      name={key}
                      checked={!orgDetails[key]}
                      onChange={() =>
                        setOrgDetails((s) => ({ ...s, [key]: false }))
                      }
                      className="mr-2"
                    />
                    Disable
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderBillTypes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Bill Types</h3>
        <button
          onClick={() => addItem(setBillTypes, tmpl.billType)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Bill Type
        </button>
      </div>

      {loadingBillTypes ? (
        <p className="text-gray-500 text-sm">Loading bill types...</p>
      ) : billTypes.length === 0 ? (
        <p className="text-gray-500 text-sm">No bill types found.</p>
      ) : (
        billTypes.map((bill, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
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
                <label className="block text-sm font-medium mb-2">
                  Bill Type
                </label>
                <input
                  type="text"
                  value={bill.bill_type}
                  onChange={(e) =>
                    updateItem(setBillTypes, index, "bill_type", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Travel"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="5000"
                />
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderLoanTypes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Loan Types</h3>
        <button
          onClick={() =>
            addItem(setLoanTypes, {
              name: "",
              loanAmount: "",
              timePeriod: "",
              loanInterest: "",
              employment: "",
              require_level_1: 0,
              require_level_2: 0,
            })
          }
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Loan Type
        </button>
      </div>
      {loadingLoanTypes ? (
        <p className="text-gray-500 text-sm">Loading loan types...</p>
      ) : loanTypes.length === 0 ? (
        <p className="text-gray-500 text-sm">No loan types found.</p>
      ) : (
        loanTypes.map((loan, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
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
              {/* Loan Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Loan Name
                </label>
                <input
                  type="text"
                  value={loan.name}
                  onChange={(e) =>
                    updateItem(setLoanTypes, index, "name", e.target.value)
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Personal Test Loan"
                />
              </div>

              {/* Loan Amount */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Loan Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={loan.loanAmount}
                  onChange={(e) =>
                    updatePositiveNumberItem(
                      setLoanTypes,
                      index,
                      "loanAmount",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="100000"
                />
              </div>

              {/* Time Period */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Time Period (Months)
                </label>
                <input
                  type="number"
                  min="0"
                  value={loan.timePeriod}
                  onChange={(e) =>
                    updatePositiveNumberItem(
                      setLoanTypes,
                      index,
                      "timePeriod",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="12"
                />
              </div>

              {/* Interest */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={loan.loanInterest}
                  onChange={(e) =>
                    updatePositiveNumberItem(
                      setLoanTypes,
                      index,
                      "loanInterest",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="4.4"
                />
              </div>

              {/* Employment */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Employment
                </label>
                <input
                  type="text"
                  value={loan.employment}
                  onChange={(e) =>
                    updateItem(
                      setLoanTypes,
                      index,
                      "employment",
                      e.target.value,
                    )
                  }
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Yes / No"
                />
              </div>

              {/* Approval Levels */}
              <div className="md:col-span-3 flex gap-8 mt-4">
                {/* Level 1 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Level 1 Approval
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition
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
                    Level 2 Approval
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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition
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
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPerformanceTypes = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Performance Types
        </h3>
        <button
          onClick={() => addItem(setPerformanceTypes, tmpl.performanceType)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Performance Type
        </button>
      </div>

      {performanceTypes.map((perf, index) => (
        <div key={index} className="p-4 border rounded-lg bg-gray-50">
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
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={perf.name}
                onChange={(e) =>
                  updateItem(setPerformanceTypes, index, "name", e.target.value)
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Annual Evaluation"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
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
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Select</option>
                <option value="supervisor">Supervisor</option>
                <option value="employee">Employee</option>
                <option value="hr">HR</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
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
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Yearly | December"
              />
            </div>

            {/* Department & Designations builder */}
            <div className="md:col-span-2 p-3 border border-dashed rounded-lg">
              <label className="block text-sm font-medium mb-2">
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
                  className="flex-1 px-4 py-2 border rounded-lg"
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
                  className="flex-1 px-4 py-2 border rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (perf.tempDept && perf.tempDesigs) {
                      const updated = {
                        ...(perf.department_designations || {}),
                        [perf.tempDept]: perf.tempDesigs
                          .split(",")
                          .map((x) => x.trim())
                          .filter(Boolean),
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
              <label className="block text-sm font-medium mb-2">Status</label>
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
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end pt-6 border-t">
        <button
          onClick={handleUpdateOrganization}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Update Organization
        </button>
      </div>
    </div>
  );

  /* ========== AFTER ORG: TABS RENDERS ========== */
  const renderBranches = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Branch Creation</h3>
        <button
          onClick={() => addItem(setBranches, tmpl.branch)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Branch
        </button>
      </div>

      {loadingBranches ? (
        <p className="text-gray-500 text-sm">Loading branches...</p>
      ) : branches.length === 0 ? (
        <p className="text-gray-500 text-sm">No branches found.</p>
      ) : (
        branches.map((branch, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
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
              <label className="block text-sm font-medium mb-2">
                Branch Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={branch.branch_name}
                onChange={(e) =>
                  updateItem(setBranches, index, "branch_name", e.target.value)
                }
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="Head Office"
              />
            </div>
          </div>
        ))
      )}
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
            {/* Branch Header */}
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">
                {group.branchName || `Branch ID: ${group.branchId}`}
              </h4>

              <button
                onClick={() => {
                  setWorkingOfficeGroups((prev) =>
                    prev.map((g, i) =>
                      i === groupIndex
                        ? {
                            ...g,
                            working_offices: [
                              ...g.working_offices,
                              { name: "", description: "" },
                            ],
                          }
                        : g,
                    ),
                  );
                }}
                className="flex items-center  text-blue-500 hover:text-blue-700 text-sm"
              >
                <CiSquarePlus className="w-[30px] h-[30px] mr-1" />
              </button>
            </div>

            {/* Offices under branch */}
            {group.working_offices.length === 0 && (
              <p className="text-sm text-gray-500">
                No working offices added yet for this branch.
              </p>
            )}

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
                        setWorkingOfficeGroups((prev) =>
                          prev.map((g, i) =>
                            i === groupIndex
                              ? {
                                  ...g,
                                  working_offices: g.working_offices.filter(
                                    (_, j) => j !== officeIndex,
                                  ),
                                }
                              : g,
                          ),
                        );
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
                        const value = e.target.value;
                        setWorkingOfficeGroups((prev) =>
                          prev.map((g, i) =>
                            i === groupIndex
                              ? {
                                  ...g,
                                  working_offices: g.working_offices.map(
                                    (o, j) =>
                                      j === officeIndex
                                        ? { ...o, name: value }
                                        : o,
                                  ),
                                }
                              : g,
                          ),
                        );
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
                        const value = e.target.value;
                        setWorkingOfficeGroups((prev) =>
                          prev.map((g, i) =>
                            i === groupIndex
                              ? {
                                  ...g,
                                  working_offices: g.working_offices.map(
                                    (o, j) =>
                                      j === officeIndex
                                        ? { ...o, description: value }
                                        : o,
                                  ),
                                }
                              : g,
                          ),
                        );
                      }}
                      placeholder="Handles software development"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/*  Save Button for this Branch */}
            <div className="flex justify-end pt-4">
              <button
                onClick={async () => {
                  const token = Cookies.get("accessToken");
                  const API_URL = process.env.REACT_APP_FRONTEND_URL;
                  const branchId = group.branchId;

                  // Build payload
                  const payload = {
                    branches: [
                      {
                        branchId,
                        working_offices: group.working_offices.map((o) => ({
                          name: o.name?.trim() || "",
                          description: o.description?.trim() || "",
                        })),
                      },
                    ],
                  };

                  // Skip empty
                  const hasChanges = payload.branches[0].working_offices.some(
                    (o) => o.name.trim() !== "",
                  );
                  if (!hasChanges) {
                    toast.info("No changes detected for this branch.");
                    return;
                  }

                  try {
                    const orgId = orgData?.id;

                    if (!orgId) {
                      toast.error("Organization ID not found.");
                      return;
                    }

                    const res = await axios.put(
                      `${API_URL}/v1/hris/organizations/branch/${orgId}/working-offices`,
                      payload,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );

                    if (res.data.success) {
                      toast.success(
                        `Working offices for ${group.branchName} saved successfully!`,
                      );
                    } else {
                      toast.error(
                        `Failed to save working offices for ${group.branchName}.`,
                      );
                    }
                  } catch (err) {
                    console.error("❌ Error saving working offices:", err);
                    toast.error(
                      "Error saving working offices. Check console for details.",
                    );
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Save Working Offices
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDepartments = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Department Creation
      </h3>

      {loadingDepartments ? (
        <p className="text-gray-500 text-sm">Loading departments...</p>
      ) : departmentGroups.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No departments found. Please complete working offices first.
        </p>
      ) : (
        departmentGroups.map((group, groupIndex) => (
          <div
            key={group.officeId}
            className="border border-gray-200 rounded-lg bg-gray-50 p-5 space-y-4"
          >
            {/* Office Header */}
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">
                {group.officeName || `Office ID: ${group.officeId}`}
              </h4>

              {/* ➕ Add Department Button */}
              <button
                onClick={() => {
                  setDepartmentGroups((prev) =>
                    prev.map((g, i) =>
                      i === groupIndex
                        ? {
                            ...g,
                            departments: [
                              ...g.departments,
                              { name: "", description: "" },
                            ],
                          }
                        : g,
                    ),
                  );
                }}
                className="flex items-center text-blue-500 hover:text-blue-700 text-sm"
              >
                <CiSquarePlus className="w-[30px] h-[30px] mr-1" />
              </button>
            </div>

            {/* Departments under Office */}
            {group.departments.length === 0 && (
              <p className="text-sm text-gray-500">
                No departments added yet for this office.
              </p>
            )}

            {group.departments.map((dept, deptIndex) => (
              <div
                key={dept.id || `${groupIndex}-${deptIndex}`}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Department {deptIndex + 1}
                  </span>
                  {group.departments.length > 1 && (
                    <button
                      onClick={() => {
                        setDepartmentGroups((prev) =>
                          prev.map((g, i) =>
                            i === groupIndex
                              ? {
                                  ...g,
                                  departments: g.departments.filter(
                                    (_, j) => j !== deptIndex,
                                  ),
                                }
                              : g,
                          ),
                        );
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
                        const value = e.target.value;
                        setDepartmentGroups((prev) =>
                          prev.map((g, i) =>
                            i === groupIndex
                              ? {
                                  ...g,
                                  departments: g.departments.map((d, j) =>
                                    j === deptIndex ? { ...d, name: value } : d,
                                  ),
                                }
                              : g,
                          ),
                        );
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
                        const value = e.target.value;
                        setDepartmentGroups((prev) =>
                          prev.map((g, i) =>
                            i === groupIndex
                              ? {
                                  ...g,
                                  departments: g.departments.map((d, j) =>
                                    j === deptIndex
                                      ? { ...d, description: value }
                                      : d,
                                  ),
                                }
                              : g,
                          ),
                        );
                      }}
                      placeholder="Frontend / Backend / QA"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            {/*  Save Button for this Office */}
            <div className="flex justify-end pt-4">
              <button
                onClick={async () => {
                  const token = Cookies.get("accessToken");
                  const API_URL = process.env.REACT_APP_FRONTEND_URL;

                  const officeId = group.officeId;
                  const payload = {
                    offices: [
                      {
                        officeId,
                        departments: group.departments.map((d) => ({
                          name: d.name?.trim() || "",
                          description: d.description?.trim() || "",
                        })),
                      },
                    ],
                  };

                  console.log(
                    "📤 PUT Single Office Department Payload:",
                    payload,
                  );

                  const hasValidDept = payload.offices[0].departments.some(
                    (d) => d.name.trim() !== "",
                  );

                  if (!hasValidDept) {
                    toast.info("Please fill at least one department name.");
                    return;
                  }

                  try {
                    const res = await axios.put(
                      `${API_URL}/v1/hris/organizations/working-office/departments`,
                      payload,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );

                    if (res.data.success) {
                      toast.success(
                        `Departments for ${group.officeName} saved successfully!`,
                      );
                      console.log(" Departments updated:", res.data);
                    } else {
                      toast.error(
                        `Failed to save departments for ${group.officeName}.`,
                      );
                      console.error("⚠️ Save failed:", res.data);
                    }
                  } catch (err) {
                    console.error("❌ Error saving departments:", err);
                    toast.error(
                      "Error saving departments. Check console for details.",
                    );
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Save Departments
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDesignations = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">
        Designation Creation
      </h3>

      {loadingDesignations ? (
        <p className="text-gray-500 text-sm">Loading designations...</p>
      ) : designationGroups.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No designations found. Please complete department creation first.
        </p>
      ) : (
        designationGroups.map((group, groupIndex) => (
          <div
            key={group.deptId}
            className="border border-gray-200 rounded-lg bg-gray-50 p-5 space-y-4"
          >
            {/* Department Header */}
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-gray-700">
                {group.deptName || `Department ID: ${group.deptId}`}
              </h4>

              {/* ➕ Add Designation */}
              <button
                onClick={() => {
                  setDesignationGroups((prev) =>
                    prev.map((g, i) =>
                      i === groupIndex
                        ? {
                            ...g,
                            designations: [...g.designations, { title: "" }],
                          }
                        : g,
                    ),
                  );
                }}
                className="flex items-center text-blue-500 hover:text-blue-700 text-sm"
              >
                <CiSquarePlus className="w-[30px] h-[30px] mr-1" />
              </button>
            </div>

            {/* Designations List */}
            {group.designations.length === 0 && (
              <p className="text-sm text-gray-500">
                No designations added yet for this department.
              </p>
            )}

            {group.designations.map((desig, desigIndex) => (
              <div
                key={desig.id || `${groupIndex}-${desigIndex}`}
                className="p-4 bg-white rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-600">
                    Designation {desigIndex + 1}
                  </span>
                  {group.designations.length > 1 && (
                    <button
                      onClick={() => {
                        setDesignationGroups((prev) =>
                          prev.map((g, i) =>
                            i === groupIndex
                              ? {
                                  ...g,
                                  designations: g.designations.filter(
                                    (_, j) => j !== desigIndex,
                                  ),
                                }
                              : g,
                          ),
                        );
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Designation Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={desig.title}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDesignationGroups((prev) =>
                        prev.map((g, i) =>
                          i === groupIndex
                            ? {
                                ...g,
                                designations: g.designations.map((d, j) =>
                                  j === desigIndex ? { ...d, title: value } : d,
                                ),
                              }
                            : g,
                        ),
                      );
                    }}
                    placeholder="Software Engineer"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}

            {/*  Save Button for this Department */}
            <div className="flex justify-end pt-4">
              <button
                onClick={async () => {
                  const token = Cookies.get("accessToken");
                  const API_URL = process.env.REACT_APP_FRONTEND_URL;
                  const orgId = orgData?.id;
                  const deptId = group.deptId;

                  if (!orgId) {
                    toast.error("Organization ID not found.");
                    return;
                  }

                  const payload = {
                    departments: [
                      {
                        deptId,
                        designations: group.designations.map((d) => ({
                          title: d.title?.trim() || "",
                        })),
                      },
                    ],
                  };

                  console.log(
                    "📤 PUT Single Department Designation Payload:",
                    payload,
                  );

                  const hasValidDesig =
                    payload.departments[0].designations.some(
                      (d) => d.title.trim() !== "",
                    );

                  if (!hasValidDesig) {
                    toast.info("Please fill at least one designation title.");
                    return;
                  }

                  try {
                    const res = await axios.put(
                      `${API_URL}/v1/hris/organizations/${orgId}/designations`,
                      payload,
                      { headers: { Authorization: `Bearer ${token}` } },
                    );

                    if (res.data.success) {
                      toast.success(
                        `Designations for ${group.deptName} saved successfully!`,
                      );
                      console.log(" Designations updated:", res.data);
                    } else {
                      toast.error(
                        `Failed to save designations for ${group.deptName}.`,
                      );
                      console.error("⚠️ Save failed:", res.data);
                    }
                  } catch (err) {
                    console.error("❌ Error saving designations:", err);
                    toast.error(
                      "Error saving designations. Check console for details.",
                    );
                  }
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
              >
                Save Designations
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderEmploymentTypes = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-800">Employment Types</h3>

      {loadingEmploymentTypes ? (
        <p className="text-gray-500 text-sm">Loading employment types...</p>
      ) : (
        <>
          {/* ➕ Add Employment Type Button */}
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">
              Add, edit, or remove employment types.
            </p>
            <button
              onClick={() =>
                setEmploymentTypesData((prev) => [...prev, { type_name: "" }])
              }
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Employment Type
            </button>
          </div>

          {employmentTypesData.length === 0 ? (
            <p className="text-gray-500 text-sm">No employment types found.</p>
          ) : (
            employmentTypesData.map((emp, index) => (
              <div
                key={emp.id || index}
                className="p-4 border rounded-lg bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-medium text-gray-600">
                    Employment Type {index + 1}
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
                    const value = e.target.value;
                    setEmploymentTypesData((prev) =>
                      prev.map((t, i) =>
                        i === index ? { ...t, type_name: value } : t,
                      ),
                    );
                  }}
                  placeholder="e.g. Permanent"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))
          )}

          {/*  Save Employment Types Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={async () => {
                const token = Cookies.get("accessToken");
                const API_URL = process.env.REACT_APP_FRONTEND_URL;
                const orgId = orgData?.id;

                if (!orgId) {
                  toast.error("Organization ID not found.");
                  return;
                }

                const payload = {
                  employment_types: employmentTypesData.map((t) => ({
                    type_name: t.type_name?.trim() || "",
                  })),
                };

                console.log("📤 PUT Employment Types Payload:", payload);

                const hasValidType = payload.employment_types.some(
                  (t) => t.type_name.trim() !== "",
                );

                if (!hasValidType) {
                  toast.info("Please enter at least one employment type.");
                  return;
                }

                try {
                  const res = await axios.put(
                    `${API_URL}/v1/hris/organizations/organization/employment-types/${orgId}`,
                    payload,
                    { headers: { Authorization: `Bearer ${token}` } },
                  );

                  if (res.data.success) {
                    toast.success("Employment types saved successfully!");
                    console.log(" Employment types updated:", res.data);
                  } else {
                    toast.error("Failed to save employment types.");
                    console.error("⚠️ Save failed:", res.data);
                  }
                } catch (err) {
                  console.error("❌ Error saving employment types:", err);
                  toast.error(
                    "Error saving employment types. Check console for details.",
                  );
                }
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
            >
              Save Employment Types
            </button>
          </div>
        </>
      )}
    </div>
  );

  const Toggle = ({ enabled, onChange, label }) => (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition
        ${enabled ? "bg-green-500" : "bg-gray-300"}`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition
          ${enabled ? "translate-x-5" : "translate-x-1"}`}
        />
      </button>
      <span className="text-xs font-semibold">{enabled ? "Yes" : "No"}</span>
    </div>
  );

  const renderLeaveCategoriesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          Leave Categories
        </h3>
        <button
          onClick={() => {
            const user =
              Cookies.get("username") ||
              Cookies.get("user_name") ||
              Cookies.get("user") ||
              Cookies.get("email");

            addItem(setLeaveCategories, {
              ...tmpl.leaveCategory,
              create_by: user || "Unknown",
            });
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Leave Category
        </button>
      </div>

      {loadingLeaveCategories ? (
        <p className="text-gray-500 text-sm">Loading leave categories...</p>
      ) : leaveCategories.length === 0 ? (
        <p className="text-gray-500 text-sm">No leave categories found.</p>
      ) : (
        leaveCategories.map((cat, index) => (
          <div key={index} className="p-4 border rounded-lg bg-gray-50">
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
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Annual Leave"
                />
              </div>

              {/* Recurrence Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="ANNUAL">Annual</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              {/* Apply Before */}
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="7"
                />
              </div>

              {/* Created By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Created By
                </label>

                <input
                  type="text"
                  value={leaveCategories[index].create_by}
                  readOnly
                  className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Employment Type
                </label>

                <Select
                  isMulti
                  options={employmentTypesData.map((et) => ({
                    value: et.id,
                    label: et.type_name,
                  }))}
                  value={(cat.employeement_type_id || [])
                    .map((id) => {
                      const type = employmentTypesData.find((t) => t.id === id);
                      return type
                        ? { value: type.id, label: type.type_name }
                        : null;
                    })
                    .filter(Boolean)}
                  onChange={(selectedOptions) => {
                    const selectedIds = selectedOptions.map((opt) => opt.value);
                    updateItem(
                      setLeaveCategories,
                      index,
                      "employeement_type_id",
                      selectedIds,
                    );
                  }}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  placeholder="Select employment types"
                />
              </div>

              {/* Eligible Gender */}
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select</option>
                  <option value="Both">Both</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium mb-2">Weight</label>
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
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="1.0"
                />
              </div>

              {/* No. of Days */}
              <div>
                <label className="block text-sm font-medium mb-2">
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
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="14"
                />
              </div>

              {/* ---- BOOLEAN OPTIONS ---- */}
              <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <Toggle
                  label="Half Day Allowed"
                  enabled={cat.half_day_allowed}
                  onChange={() =>
                    updateItem(
                      setLeaveCategories,
                      index,
                      "half_day_allowed",
                      !cat.half_day_allowed,
                    )
                  }
                />

                <Toggle
                  label="Exclude Holidays"
                  enabled={cat.exclude_holidays}
                  onChange={() =>
                    updateItem(
                      setLeaveCategories,
                      index,
                      "exclude_holidays",
                      !cat.exclude_holidays,
                    )
                  }
                />

                <Toggle
                  label="Encash Allowed"
                  enabled={cat.encash_allowed}
                  onChange={() =>
                    updateItem(
                      setLeaveCategories,
                      index,
                      "encash_allowed",
                      !cat.encash_allowed,
                    )
                  }
                />

                <Toggle
                  label="Carry Forward Allowed"
                  enabled={cat.carry_forward_allowed}
                  onChange={() =>
                    updateItem(
                      setLeaveCategories,
                      index,
                      "carry_forward_allowed",
                      !cat.carry_forward_allowed,
                    )
                  }
                />
              </div>

              {cat.encash_allowed && (
                <div>
                  <label className="block text-sm font-medium mb-2">
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
                    className="w-full px-4 py-2 border rounded-lg"
                    placeholder="10"
                  />
                </div>
              )}

              {cat.carry_forward_allowed && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Reset Date
                  </label>
                  <input
                    type="date"
                    value={cat.reset_date}
                    onChange={(e) =>
                      updateItem(
                        setLeaveCategories,
                        index,
                        "reset_date",
                        e.target.value,
                      )
                    }
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  /* ========== ORG STEP CONTAINER ========== */
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

  /* ========== TAB CONTAINER ========== */
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
                    className={`h-1 flex-1 mx-2 ${
                      index < orgStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          {renderOrgStepContent()}

          {/* Prev/Next/Save */}
          {/* Prev/Next/Save */}
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

            {
              orgStep < orgSteps.length - 1 ? (
                <button
                  onClick={() => setOrgStep((p) => p + 1)}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              ) : null /*  remove Save & Continue */
            }
          </div>
        </div>
      );
    }

    if (activeTab === 1) return renderBranches();
    if (activeTab === 2) return renderWorkingOffices();
    if (activeTab === 3) return renderDepartments();
    if (activeTab === 4) return renderDesignations();
    if (activeTab === 5) return renderEmploymentTypes();
    if (activeTab === 6) return renderLeaveCategoriesTab();
    return null;
  };

  /* ========== FOOTER PER TAB (except Org wizard) ========== */
  const renderFooter = () => {
    if (activeTab === 0) return null; // no footer for org wizard
    if (activeTab === 2) return null; // ❌ remove Save & Continue for Working Office section

    const prev = () => setActiveTab((t) => Math.max(0, t - 1));
    const next = () => setActiveTab((t) => Math.min(6, t + 1));

    const canNext =
      (activeTab === 1 && branches.some((b) => (b.branch_name || "").trim())) ||
      (activeTab === 3 &&
        departmentGroups.some((g) =>
          (g.departments || []).some((d) => (d.name || "").trim()),
        )) ||
      (activeTab === 4 &&
        designationGroups.some((g) =>
          (g.designations || []).some((d) => (d.title || "").trim()),
        )) ||
      (activeTab === 5 &&
        employmentTypesData.some((t) => (t.type_name || "").trim())) ||
      (activeTab === 6 &&
        leaveCategories.some((l) => (l.category_name || "").trim()));

    const onSave = () => {
      switch (activeTab) {
        case 1:
          handleUpdateBranches();
          return;
        case 3:
          handleUpdateDepartments();
          return;
        case 4:
          handleUpdateDesignations();
          return;
        case 5:
          handleUpdateEmploymentTypes();
          return;
        case 6:
          handleUpdateEmploymentTypesAndLeaveCategories(); // ← combined PUT
          return;
        default:
          break;
      }
      next();
    };

    return (
      <div className="flex justify-between pt-6 border-t mt-6">
        <button
          onClick={prev}
          className="px-8 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 font-medium"
        >
          Previous
        </button>

        <button
          onClick={onSave}
          disabled={!canNext}
          className={`px-8 py-2 rounded-lg font-medium ${
            !canNext
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {activeTab === 6 ? "Save & Finish" : "Save & Continue"}
        </button>
      </div>
    );
  };

  /* ========== LAYOUT ========== */
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Edit: Organization Setup
          </h1>
          <p className="text-gray-600 mt-2">
            Update organization configuration, structure, and master data.
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="flex overflow-x-auto border-b">
            {tabs.map((tab, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
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
          {renderFooter()}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default OrganizationSetupEdit;
