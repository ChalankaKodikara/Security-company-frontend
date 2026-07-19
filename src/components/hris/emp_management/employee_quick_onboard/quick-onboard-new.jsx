import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { apiFetch } from "../../../../utils/apiClient";
import "react-toastify/dist/ReactToastify.css";

const EMPLOYEE_CATEGORY_OPTIONS = [
  { value: "Direct", label: "Direct" },
  { value: "Indirect", label: "Indirect" },
  { value: "JSO", label: "JSO" },
  { value: "OIC", label: "OIC" },
  { value: "VO", label: "VO" },
  { value: "LSO", label: "LSO" },
  { value: "HO_STAFF", label: "HO STAFF" },
];

const PAYROLL_GROUP_OPTIONS = [
  { value: "HO", label: "HO" },
  { value: "SECURITY", label: "SECURITY" },
];

const PAYROLL_SCHEME_OPTIONS = [
  { value: "STANDARD", label: "STANDARD" },
  { value: "EXEMPT", label: "EXEMPT" },
];

const initialForm = {
  organization_id: "",
  unique_key: "",
  employee_fullname: "",
  employee_name_initial: "",
  employee_calling_name: "",
  employee_nic: "",
  employee_dob: "",
  employee_gender: "",
  employee_contact_no: "",
  employee_permanent_address: "",
  payroll_group: "HO",
  payroll_scheme: "STANDARD",
  employee_category: "",
  checkpoint_id: "",
};

export default function QuickOnboardEmployee() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [saving, setSaving] = useState(false);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [loadingCheckpoints, setLoadingCheckpoints] = useState(false);

  const [organizationOptions, setOrganizationOptions] = useState([]);
  const [checkpointOptions, setCheckpointOptions] = useState([]);
  const [form, setForm] = useState(initialForm);

  const selectedOrganization = useMemo(() => {
    return (
      organizationOptions.find(
        (org) => String(org.value) === String(form.organization_id),
      ) || null
    );
  }, [organizationOptions, form.organization_id]);

  const selectedPayrollGroup = useMemo(() => {
    return (
      PAYROLL_GROUP_OPTIONS.find(
        (option) => option.value === form.payroll_group,
      ) || null
    );
  }, [form.payroll_group]);

  const selectedPayrollScheme = useMemo(() => {
    return (
      PAYROLL_SCHEME_OPTIONS.find(
        (option) => option.value === form.payroll_scheme,
      ) || null
    );
  }, [form.payroll_scheme]);

  const selectedEmployeeCategory = useMemo(() => {
    return (
      EMPLOYEE_CATEGORY_OPTIONS.find(
        (option) => option.value === form.employee_category,
      ) || null
    );
  }, [form.employee_category]);

  const selectedCheckpoint = useMemo(() => {
    return (
      checkpointOptions.find(
        (checkpoint) => String(checkpoint.value) === String(form.checkpoint_id),
      ) || null
    );
  }, [checkpointOptions, form.checkpoint_id]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoadingOrganizations(true);

        const response = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || "Failed to load organizations");
        }

        const organizations = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.organizations)
              ? json.organizations
              : [];

        const options = organizations.map((organization) => ({
          value: organization.id,
          code: organization.code || organization.unique_key || "",
          label: `${
            organization.organization_name ||
            organization.name ||
            "Organization"
          } ${
            organization.code || organization.unique_key
              ? `(${organization.code || organization.unique_key})`
              : ""
          }`,
        }));

        setOrganizationOptions(options);
      } catch (error) {
        console.error("fetchOrganizations error:", error);
        toast.error(error.message || "Failed to load organizations");
      } finally {
        setLoadingOrganizations(false);
      }
    };

    if (API_URL) {
      fetchOrganizations();
    }
  }, [API_URL]);

  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        setLoadingCheckpoints(true);

        const response = await apiFetch(
          `${API_URL}/v1/hris/client/checkpoints`,
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json?.message || "Failed to load checkpoints");
        }

        const checkpoints = Array.isArray(json)
          ? json
          : Array.isArray(json?.checkpoints)
            ? json.checkpoints
            : Array.isArray(json?.data)
              ? json.data
              : [];

        const options = checkpoints.map((checkpoint) => ({
          value: checkpoint.id,
          label: `${checkpoint.checkpoint_name || "Checkpoint"} - ${
            checkpoint.client_name || "No Client"
          }`,
        }));

        setCheckpointOptions(options);
      } catch (error) {
        console.error("fetchCheckpoints error:", error);
        toast.error(error.message || "Failed to load checkpoints");
      } finally {
        setLoadingCheckpoints(false);
      }
    };

    if (API_URL) {
      fetchCheckpoints();
    }
  }, [API_URL]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleOrganizationChange = (option) => {
    setForm((previous) => ({
      ...previous,
      organization_id: option?.value || "",
      unique_key: option?.code || "",
    }));
  };

  const handlePayrollGroupChange = (option) => {
    const payrollGroup = option?.value || "HO";

    setForm((previous) => ({
      ...previous,
      payroll_group: payrollGroup,

      employee_category:
        payrollGroup === "SECURITY" ? previous.employee_category : "",

      checkpoint_id: payrollGroup === "SECURITY" ? previous.checkpoint_id : "",
    }));
  };

  const handlePayrollSchemeChange = (option) => {
    setForm((previous) => ({
      ...previous,
      payroll_scheme: option?.value || "STANDARD",
    }));
  };

  const handleEmployeeCategoryChange = (option) => {
    setForm((previous) => ({
      ...previous,
      employee_category: option?.value || "",
    }));
  };

  const handleCheckpointChange = (option) => {
    setForm((previous) => ({
      ...previous,
      checkpoint_id: option?.value || "",
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      ["organization_id", "Organization"],
      ["unique_key", "Organization code"],
      ["employee_fullname", "Full name"],
      ["employee_name_initial", "Name with initial"],
      ["employee_calling_name", "Calling name"],
      ["employee_nic", "NIC"],
      ["employee_dob", "Date of birth"],
      ["employee_gender", "Gender"],
      ["employee_contact_no", "Contact number"],
      ["employee_permanent_address", "Permanent address"],
      ["payroll_group", "Payroll group"],
      ["payroll_scheme", "Payroll scheme"],
    ];

    for (const [field, label] of requiredFields) {
      const value = form[field];

      if (!String(value || "").trim()) {
        toast.warning(`${label} is required`);
        return false;
      }
    }

    if (form.payroll_group === "SECURITY") {
      if (!form.employee_category) {
        toast.warning("Employee category is required for security employees");
        return false;
      }

      if (!form.checkpoint_id) {
        toast.warning("Checkpoint is required for security employees");
        return false;
      }
    }

    return true;
  };

  const resetForm = () => {
    setForm({ ...initialForm });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const isSecurityEmployee = form.payroll_group === "SECURITY";

      const payload = {
        organization_id: Number(form.organization_id),
        unique_key: form.unique_key.trim(),

        employee_fullname: form.employee_fullname.trim(),
        employee_name_initial: form.employee_name_initial.trim(),
        employee_calling_name: form.employee_calling_name.trim(),
        employee_nic: form.employee_nic.trim(),
        employee_dob: form.employee_dob,
        employee_gender: form.employee_gender,
        employee_contact_no: form.employee_contact_no.trim(),
        employee_permanent_address: form.employee_permanent_address.trim(),

        payroll_group: form.payroll_group,
        payroll_scheme: form.payroll_scheme,

        employee_category: isSecurityEmployee ? form.employee_category : null,

        checkpoint_id: isSecurityEmployee ? Number(form.checkpoint_id) : null,
      };

      const response = await apiFetch(
        `${API_URL}/v1/hris/employees/quick-onboard`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
      );

      const json = await response.json();

      if (!response.ok || !json?.success) {
        throw new Error(json?.message || "Failed to quick onboard employee");
      }

      toast.success(
        `Employee onboarded successfully. Employee No: ${
          json?.data?.employee_no || ""
        }`,
      );

      resetForm();
    } catch (error) {
      console.error("handleSubmit error:", error);
      toast.error(error.message || "Failed to onboard employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Quick Onboard</h1>

          <p className="mt-1 text-sm text-slate-500">
            Create an employee with minimum personal and payroll details.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <div className="md:col-span-2">
              <SectionTitle title="Organization" />
            </div>

            <div>
              <FieldLabel label="Organization" required />

              <Select
                options={organizationOptions}
                value={selectedOrganization}
                onChange={handleOrganizationChange}
                placeholder={
                  loadingOrganizations
                    ? "Loading organizations..."
                    : "Select organization"
                }
                isLoading={loadingOrganizations}
                isDisabled={loadingOrganizations || saving}
                isSearchable
                isClearable
              />
            </div>

            <Input
              label="Organization Code"
              name="unique_key"
              value={form.unique_key}
              onChange={handleChange}
              disabled
              required
            />

            <div className="mt-3 md:col-span-2">
              <SectionTitle title="Personal Details" />
            </div>

            <Input
              label="Full Name"
              name="employee_fullname"
              value={form.employee_fullname}
              onChange={handleChange}
              required
            />

            <Input
              label="Name With Initial"
              name="employee_name_initial"
              value={form.employee_name_initial}
              onChange={handleChange}
              required
            />

            <Input
              label="Calling Name"
              name="employee_calling_name"
              value={form.employee_calling_name}
              onChange={handleChange}
              required
            />

            <Input
              label="NIC"
              name="employee_nic"
              value={form.employee_nic}
              onChange={handleChange}
              required
            />

            <Input
              label="Date of Birth"
              type="date"
              name="employee_dob"
              value={form.employee_dob}
              onChange={handleChange}
              required
            />

            <div>
              <FieldLabel label="Gender" required />

              <select
                name="employee_gender"
                value={form.employee_gender}
                onChange={handleChange}
                disabled={saving}
                className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <Input
              label="Contact Number"
              name="employee_contact_no"
              value={form.employee_contact_no}
              onChange={handleChange}
              required
            />

            <div className="md:col-span-2">
              <FieldLabel label="Permanent Address" required />

              <textarea
                name="employee_permanent_address"
                value={form.employee_permanent_address}
                onChange={handleChange}
                disabled={saving}
                rows={3}
                className="w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div className="mt-3 md:col-span-2">
              <SectionTitle title="Payroll Details" />
            </div>

            <div>
              <FieldLabel label="Payroll Group" required />

              <Select
                options={PAYROLL_GROUP_OPTIONS}
                value={selectedPayrollGroup}
                onChange={handlePayrollGroupChange}
                placeholder="Select payroll group"
                isDisabled={saving}
                isSearchable={false}
              />
            </div>

            <div>
              <FieldLabel label="Payroll Scheme" required />

              <Select
                options={PAYROLL_SCHEME_OPTIONS}
                value={selectedPayrollScheme}
                onChange={handlePayrollSchemeChange}
                placeholder="Select payroll scheme"
                isDisabled={saving}
                isSearchable={false}
              />
            </div>

            {form.payroll_group === "SECURITY" && (
              <>
                <div>
                  <FieldLabel label="Employee Category" required />

                  <Select
                    options={EMPLOYEE_CATEGORY_OPTIONS}
                    value={selectedEmployeeCategory}
                    onChange={handleEmployeeCategoryChange}
                    placeholder="Select employee category"
                    isDisabled={saving}
                    isSearchable
                    isClearable
                  />
                </div>

                <div>
                  <FieldLabel label="Checkpoint" required />

                  <Select
                    options={checkpointOptions}
                    value={selectedCheckpoint}
                    onChange={handleCheckpointChange}
                    placeholder={
                      loadingCheckpoints
                        ? "Loading checkpoints..."
                        : "Select checkpoint"
                    }
                    isLoading={loadingCheckpoints}
                    isDisabled={loadingCheckpoints || saving}
                    isSearchable
                    isClearable
                  />
                </div>
              </>
            )}

            <div className="mt-4 flex justify-end gap-3 border-t pt-4 md:col-span-2">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-6 py-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving..." : "Quick Onboard"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ title }) {
  return (
    <div className="border-b border-slate-200 pb-2">
      <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
        {title}
      </h2>
    </div>
  );
}

function FieldLabel({ label, required = false }) {
  return (
    <label className="mb-1 block text-sm font-medium text-slate-600">
      {label}

      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled = false,
  required = false,
}) {
  return (
    <div>
      <FieldLabel label={label} required={required} />

      <input
        type={type}
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={`w-full rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? "cursor-not-allowed bg-slate-100" : ""
        }`}
      />
    </div>
  );
}
