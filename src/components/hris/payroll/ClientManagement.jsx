import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  MapPin,
  Building2,
  Phone,
  Mail,
  Search,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { apiFetch } from "../../../utils/apiClient";

const emptyCheckpoint = {
  checkpoint_name: "",
  address: "",
  is_active: true,
  per_shift_rate: "",
  ot_hour_rate: "",
};

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  address: "",
  checkpoints: [{ ...emptyCheckpoint }],
};

export default function ClientCheckpointManager() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const apiBase = `${API_URL}/v1/hris/client`;

  const fetchClients = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(`${apiBase}/get`, {
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Failed to fetch clients");
      }

      const data = Array.isArray(json) ? json : json.clients || [];
      setClients(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return clients;

    return clients.filter((client) => {
      const checkpointText = (client.checkpoints || [])
        .map((cp) => `${cp.checkpoint_name} ${cp.address}`)
        .join(" ")
        .toLowerCase();

      return (
        String(client.name || "")
          .toLowerCase()
          .includes(q) ||
        String(client.email || "")
          .toLowerCase()
          .includes(q) ||
        String(client.phone || "")
          .toLowerCase()
          .includes(q) ||
        String(client.address || "")
          .toLowerCase()
          .includes(q) ||
        checkpointText.includes(q)
      );
    });
  }, [clients, search]);

  const handleClientChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckpointChange = (index, field, value) => {
    setForm((prev) => {
      const checkpoints = [...prev.checkpoints];

      checkpoints[index] = {
        ...checkpoints[index],
        [field]: value,
      };

      return {
        ...prev,
        checkpoints,
      };
    });
  };

  const addCheckpointRow = () => {
    setForm((prev) => ({
      ...prev,
      checkpoints: [...prev.checkpoints, { ...emptyCheckpoint }],
    }));
  };

  const removeCheckpointRow = (index) => {
    setForm((prev) => {
      const checkpoints = prev.checkpoints.filter((_, i) => i !== index);

      return {
        ...prev,
        checkpoints: checkpoints.length
          ? checkpoints
          : [{ ...emptyCheckpoint }],
      };
    });
  };

  const resetForm = () => {
    setForm({
      ...emptyForm,
      checkpoints: [{ ...emptyCheckpoint }],
    });
    setEditingId(null);
  };

  const validateForm = () => {
    if (!form.name.trim()) {
      toast.warning("Client name is required");
      return false;
    }

    if (!form.email.trim()) {
      toast.warning("Client email is required");
      return false;
    }

    if (!form.phone.trim()) {
      toast.warning("Client phone is required");
      return false;
    }

    const validCheckpoints = form.checkpoints.filter((cp) =>
      cp.checkpoint_name.trim(),
    );

    if (!validCheckpoints.length) {
      toast.warning("At least one checkpoint name is required");
      return false;
    }

    return true;
  };

  const buildPayload = () => {
    return {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim() || null,
      checkpoints: form.checkpoints
        .filter((cp) => cp.checkpoint_name.trim())
        .map((cp) => ({
          checkpoint_name: cp.checkpoint_name.trim(),
          address: cp.address?.trim() || null,
          is_active: Boolean(cp.is_active),
          per_shift_rate:
            cp.per_shift_rate === "" ? 0 : Number(cp.per_shift_rate),
          ot_hour_rate: cp.ot_hour_rate === "" ? 0 : Number(cp.ot_hour_rate),
        })),
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const url = editingId
        ? `${apiBase}/update?id=${editingId}`
        : `${apiBase}/add`;

      const res = await apiFetch(url, {
        method: editingId ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload()),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Failed to save client");
      }

      toast.success(
        editingId
          ? "Client updated successfully"
          : "Client created successfully",
      );

      resetForm();
      fetchClients();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (client) => {
    setEditingId(client.id);

    setForm({
      name: client.name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      checkpoints:
        client.checkpoints && client.checkpoints.length
          ? client.checkpoints.map((cp) => ({
              checkpoint_name: cp.checkpoint_name || "",
              address: cp.address || "",
              is_active: Boolean(cp.is_active),
              per_shift_rate: cp.per_shift_rate || "",
              ot_hour_rate: cp.ot_hour_rate || "",
            }))
          : [{ ...emptyCheckpoint }],
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client?")) return;

    try {
      const res = await apiFetch(`${apiBase}/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json?.message || "Failed to delete client");
      }

      toast.success("Client deleted successfully");

      if (editingId === id) resetForm();

      fetchClients();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const totalCheckpoints = clients.reduce(
    (sum, client) => sum + Number(client.checkpoints?.length || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Client & Checkpoint Management
        </h1>
        <p className="text-slate-500 mt-1">
          Create clients, manage checkpoints, and configure payroll rates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard
          title="Total Clients"
          value={clients.length}
          icon={<Building2 />}
          color="blue"
        />

        <SummaryCard
          title="Total Checkpoints"
          value={totalCheckpoints}
          icon={<MapPin />}
          color="emerald"
        />

        <SummaryCard
          title="Payroll Rates"
          value="Enabled"
          icon={<DollarSign />}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {editingId ? "Update Client" : "Add New Client"}
            </h2>
            <p className="text-sm text-slate-500">
              Add client details and checkpoint shift rates.
            </p>
          </div>

          {editingId && (
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
            >
              <X size={18} />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Input
            label="Client Name"
            value={form.name}
            onChange={(v) => handleClientChange("name", v)}
            placeholder="Enter client name"
          />

          <Input
            label="Email"
            value={form.email}
            onChange={(v) => handleClientChange("email", v)}
            placeholder="client@email.com"
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(v) => handleClientChange("phone", v)}
            placeholder="0770000000"
          />

          <Input
            label="Address"
            value={form.address}
            onChange={(v) => handleClientChange("address", v)}
            placeholder="Client address"
          />
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800">Checkpoints</h3>
              <p className="text-sm text-slate-500">
                Add per shift rate and OT hour rate for payroll calculation.
              </p>
            </div>

            <button
              onClick={addCheckpointRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Checkpoint
            </button>
          </div>

          <div className="space-y-4">
            {form.checkpoints.map((cp, index) => (
              <div
                key={index}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-slate-700">
                    Checkpoint #{index + 1}
                  </p>

                  <button
                    onClick={() => removeCheckpointRow(index)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Input
                    label="Checkpoint Name"
                    value={cp.checkpoint_name}
                    onChange={(v) =>
                      handleCheckpointChange(index, "checkpoint_name", v)
                    }
                    placeholder="Main Gate"
                  />

                  <Input
                    label="Checkpoint Address"
                    value={cp.address}
                    onChange={(v) =>
                      handleCheckpointChange(index, "address", v)
                    }
                    placeholder="Checkpoint address"
                  />

                  <Input
                    label="Per Shift Rate"
                    type="number"
                    value={cp.per_shift_rate}
                    onChange={(v) =>
                      handleCheckpointChange(index, "per_shift_rate", v)
                    }
                    placeholder="1600"
                  />

                  <Input
                    label="OT Hour Rate"
                    type="number"
                    value={cp.ot_hour_rate}
                    onChange={(v) =>
                      handleCheckpointChange(index, "ot_hour_rate", v)
                    }
                    placeholder="200"
                  />

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Status
                    </label>
                    <select
                      value={cp.is_active ? "1" : "0"}
                      onChange={(e) =>
                        handleCheckpointChange(
                          index,
                          "is_active",
                          e.target.value === "1",
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={resetForm}
            className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            Clear
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-60"
          >
            {saving ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {editingId ? "Update Client" : "Save Client"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Client List</h2>
            <p className="text-sm text-slate-500">
              View and manage existing clients and checkpoints.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-2.5 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <button
              onClick={fetchClients}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No clients found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="p-5 bg-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                        <Building2 size={22} />
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">
                          {client.name}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {client.address || "No address"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Mail size={16} /> {client.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone size={16} /> {client.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={16} /> {client.checkpoints?.length || 0}{" "}
                      checkpoints
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Edit size={16} />
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(client.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="font-semibold text-slate-700 mb-3">
                    Checkpoints
                  </h4>

                  {!client.checkpoints || client.checkpoints.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No checkpoints added.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {client.checkpoints.map((cp) => (
                        <div
                          key={cp.id}
                          className="border border-slate-200 rounded-xl p-4 hover:shadow-sm transition"
                        >
                          <div className="flex justify-between gap-3 mb-3">
                            <div>
                              <h5 className="font-bold text-slate-800">
                                {cp.checkpoint_name}
                              </h5>
                              <p className="text-sm text-slate-500">
                                {cp.address || "No address"}
                              </p>
                            </div>

                            <span
                              className={`h-fit px-2 py-1 rounded-full text-xs font-semibold ${
                                cp.is_active
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {cp.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <RateBox
                              label="Per Shift"
                              value={cp.per_shift_rate}
                            />
                            <RateBox
                              label="OT / Hour"
                              value={cp.ot_hour_rate}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colorMap = {
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-600 mb-2">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
      />
    </div>
  );
}

function RateBox({ label, value }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-bold text-slate-800">
        Rs.{" "}
        {Number(value || 0).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
    </div>
  );
}
