import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import { apiFetch } from "../../../../utils/apiClient";
import "react-toastify/dist/ReactToastify.css";

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
  checkpoint_id: "",
};

export default function QuickOnboardEmployee() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [saving, setSaving] = useState(false);
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

  const selectedCheckpoint = useMemo(() => {
    return (
      checkpointOptions.find(
        (cp) => String(cp.value) === String(form.checkpoint_id),
      ) || null
    );
  }, [checkpointOptions, form.checkpoint_id]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
        );

        const json = await res.json();

        const orgs = Array.isArray(json)
          ? json
          : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.organizations)
              ? json.organizations
              : [];

        setOrganizationOptions(
          orgs.map((org) => ({
            value: org.id,
            code: org.code,
            label: `${org.organization_name || org.name || "Organization"} ${
              org.code ? `(${org.code})` : ""
            }`,
          })),
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load organizations");
      }
    };

    fetchOrganizations();
  }, [API_URL]);

  useEffect(() => {
    const fetchCheckpoints = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/client/checkpoints`);
        const json = await res.json();

        if (json?.success && Array.isArray(json.checkpoints)) {
          setCheckpointOptions(
            json.checkpoints.map((cp) => ({
              value: cp.id,
              label: `${cp.checkpoint_name} - ${cp.client_name || "No Client"}`,
            })),
          );
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to load checkpoints");
      }
    };

    fetchCheckpoints();
  }, [API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
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

    for (const [key, label] of requiredFields) {
      if (!String(form[key] || "").trim()) {
        toast.warning(`${label} is required`);
        return false;
      }
    }

    if (form.payroll_group === "SECURITY" && !form.checkpoint_id) {
      toast.warning("Checkpoint is required for security employees");
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setForm(initialForm);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        organization_id: Number(form.organization_id),
        unique_key: form.unique_key,

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
        checkpoint_id:
          form.payroll_group === "SECURITY" ? Number(form.checkpoint_id) : null,
      };

      const res = await apiFetch(`${API_URL}/v1/hris/employees/quick-onboard`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to onboard employee");
      }

      toast.success(
        `Employee onboarded successfully. Employee No: ${
          json?.data?.employee_no || ""
        }`,
      );

      resetForm();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Quick Onboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create employee with minimum personal and payroll details.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow border border-slate-200 p-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2">
              <SectionTitle title="Organization" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Organization
              </label>
              <Select
                options={organizationOptions}
                value={selectedOrganization}
                onChange={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    organization_id: opt?.value || "",
                    unique_key: opt?.code || "",
                  }))
                }
                placeholder="Select organization"
                isSearchable
              />
            </div>

            <Input
              label="Organization Code"
              name="unique_key"
              value={form.unique_key}
              onChange={handleChange}
              disabled
            />

            <div className="md:col-span-2 mt-3">
              <SectionTitle title="Personal Details" />
            </div>

            <Input
              label="Full Name"
              name="employee_fullname"
              value={form.employee_fullname}
              onChange={handleChange}
            />

            <Input
              label="Name With Initial"
              name="employee_name_initial"
              value={form.employee_name_initial}
              onChange={handleChange}
            />

            <Input
              label="Calling Name"
              name="employee_calling_name"
              value={form.employee_calling_name}
              onChange={handleChange}
            />

            <Input
              label="NIC"
              name="employee_nic"
              value={form.employee_nic}
              onChange={handleChange}
            />

            <Input
              label="Date of Birth"
              type="date"
              name="employee_dob"
              value={form.employee_dob}
              onChange={handleChange}
            />

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Gender
              </label>
              <select
                name="employee_gender"
                value={form.employee_gender}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Permanent Address
              </label>
              <textarea
                name="employee_permanent_address"
                value={form.employee_permanent_address}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            <div className="md:col-span-2 mt-3">
              <SectionTitle title="Payroll Details" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Payroll Group
              </label>
              <Select
                value={{
                  value: form.payroll_group,
                  label: form.payroll_group,
                }}
                options={[
                  { value: "HO", label: "HO" },
                  { value: "SECURITY", label: "SECURITY" },
                ]}
                onChange={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    payroll_group: opt?.value || "HO",
                    checkpoint_id:
                      opt?.value === "SECURITY" ? prev.checkpoint_id : "",
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Payroll Scheme
              </label>
              <Select
                value={{
                  value: form.payroll_scheme,
                  label: form.payroll_scheme,
                }}
                options={[
                  { value: "STANDARD", label: "STANDARD" },
                  { value: "EXEMPT", label: "EXEMPT" },
                ]}
                onChange={(opt) =>
                  setForm((prev) => ({
                    ...prev,
                    payroll_scheme: opt?.value || "STANDARD",
                  }))
                }
              />
            </div>

            {form.payroll_group === "SECURITY" && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 mb-1">
                  Checkpoint
                </label>
                <Select
                  options={checkpointOptions}
                  value={selectedCheckpoint}
                  onChange={(opt) =>
                    setForm((prev) => ({
                      ...prev,
                      checkpoint_id: opt?.value || "",
                    }))
                  }
                  placeholder="Select checkpoint"
                  isSearchable
                />
              </div>
            )}

            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"
              >
                Clear
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
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
      <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
        {title}
      </h2>
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  type = "text",
  disabled = false,
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        className={`w-full border border-slate-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? "bg-slate-100 cursor-not-allowed" : ""
        }`}
      />
    </div>
  );
}
