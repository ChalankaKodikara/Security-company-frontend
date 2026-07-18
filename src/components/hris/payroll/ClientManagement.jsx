import React, { useCallback, useEffect, useMemo, useState } from "react";

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
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { toast, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { apiFetch } from "../../../utils/apiClient";

const DEFAULT_PER_SHIFT_RATE = "1700.00";
const DEFAULT_OT_HOUR_RATE = "130.00";

const createEmptyCheckpoint = () => ({
  checkpoint_name: "",
  address: "",
  latitude: "",
  longitude: "",
  qr_code: "",
  invoice_order: "",
  is_active: true,

  // JSO standard rates
  jso_per_shift_rate: DEFAULT_PER_SHIFT_RATE,
  jso_ot_hour_rate: DEFAULT_OT_HOUR_RATE,

  // JSO approved rates
  jso_approved_per_shift_rate: DEFAULT_PER_SHIFT_RATE,
  jso_approved_ot_hour_rate: DEFAULT_OT_HOUR_RATE,

  // LSO standard rates
  lso_per_shift_rate: DEFAULT_PER_SHIFT_RATE,
  lso_ot_hour_rate: DEFAULT_OT_HOUR_RATE,

  // LSO approved rates
  lso_approved_per_shift_rate: DEFAULT_PER_SHIFT_RATE,
  lso_approved_ot_hour_rate: DEFAULT_OT_HOUR_RATE,

  // OIC standard rates
  oic_per_shift_rate: DEFAULT_PER_SHIFT_RATE,
  oic_ot_hour_rate: DEFAULT_OT_HOUR_RATE,

  // OIC approved rates
  oic_approved_per_shift_rate: DEFAULT_PER_SHIFT_RATE,
  oic_approved_ot_hour_rate: DEFAULT_OT_HOUR_RATE,
});

const createEmptyForm = () => ({
  name: "",
  email: "",
  phone: "",
  address: "",
  vat_no: "",
  checkpoints: [createEmptyCheckpoint()],
});

const RATE_FIELDS = [
  "jso_per_shift_rate",
  "jso_ot_hour_rate",
  "jso_approved_per_shift_rate",
  "jso_approved_ot_hour_rate",

  "lso_per_shift_rate",
  "lso_ot_hour_rate",
  "lso_approved_per_shift_rate",
  "lso_approved_ot_hour_rate",

  "oic_per_shift_rate",
  "oic_ot_hour_rate",
  "oic_approved_per_shift_rate",
  "oic_approved_ot_hour_rate",
];

const toNumber = (value, fallback = 0) => {
  if (value === "" || value === null || value === undefined) {
    return fallback;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

const valueOrDefault = (value, defaultValue) => {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }

  return String(value);
};

export default function ClientCheckpointManager() {
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const apiBase = useMemo(() => `${API_URL}/v1/hris/client`, [API_URL]);

  const [clients, setClients] = useState([]);
  const [form, setForm] = useState(createEmptyForm());

  const [editingId, setEditingId] = useState(null);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [expandedCheckpoints, setExpandedCheckpoints] = useState({});

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);

      const response = await apiFetch(`${apiBase}/get`, {
        credentials: "include",
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Failed to fetch clients");
      }

      const data = Array.isArray(json)
        ? json
        : Array.isArray(json?.clients)
          ? json.clients
          : [];

      setClients(data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return clients;
    }

    return clients.filter((client) => {
      const checkpointText = (client.checkpoints || [])
        .map(
          (checkpoint) =>
            `${checkpoint.checkpoint_name || ""} ${checkpoint.address || ""}`,
        )
        .join(" ")
        .toLowerCase();

      return (
        String(client.name || "")
          .toLowerCase()
          .includes(query) ||
        String(client.email || "")
          .toLowerCase()
          .includes(query) ||
        String(client.phone || "")
          .toLowerCase()
          .includes(query) ||
        String(client.address || "")
          .toLowerCase()
          .includes(query) ||
        String(client.vat_no || "")
          .toLowerCase()
          .includes(query) ||
        checkpointText.includes(query)
      );
    });
  }, [clients, search]);

  const totalCheckpoints = useMemo(
    () =>
      clients.reduce(
        (sum, client) => sum + Number(client.checkpoints?.length || 0),
        0,
      ),
    [clients],
  );

  const handleClientChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCheckpointChange = (index, field, value) => {
    setForm((previous) => {
      const checkpoints = [...previous.checkpoints];

      checkpoints[index] = {
        ...checkpoints[index],
        [field]: value,
      };

      return {
        ...previous,
        checkpoints,
      };
    });
  };

  const addCheckpointRow = () => {
    setForm((previous) => ({
      ...previous,
      checkpoints: [...previous.checkpoints, createEmptyCheckpoint()],
    }));
  };

  const removeCheckpointRow = (index) => {
    setForm((previous) => {
      const checkpoints = previous.checkpoints.filter(
        (_, currentIndex) => currentIndex !== index,
      );

      return {
        ...previous,
        checkpoints:
          checkpoints.length > 0 ? checkpoints : [createEmptyCheckpoint()],
      };
    });
  };

  const resetForm = () => {
    setForm(createEmptyForm());
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

    const validCheckpoints = form.checkpoints.filter((checkpoint) =>
      String(checkpoint.checkpoint_name || "").trim(),
    );

    if (validCheckpoints.length === 0) {
      toast.warning("At least one checkpoint name is required");
      return false;
    }

    for (const checkpoint of validCheckpoints) {
      for (const field of RATE_FIELDS) {
        const value = checkpoint[field];

        if (value !== "" && value !== null && value !== undefined) {
          const number = Number(value);

          if (!Number.isFinite(number) || number < 0) {
            toast.warning(
              `Invalid rate in checkpoint: ${checkpoint.checkpoint_name}`,
            );

            return false;
          }
        }
      }
    }

    return true;
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    address: form.address.trim() || null,
    vat_no: form.vat_no.trim() || null,

    checkpoints: form.checkpoints
      .filter((checkpoint) => String(checkpoint.checkpoint_name || "").trim())
      .map((checkpoint, index) => ({
        checkpoint_name: checkpoint.checkpoint_name.trim(),

        address: checkpoint.address?.trim() || null,

        latitude:
          checkpoint.latitude === ""
            ? null
            : toNumber(checkpoint.latitude, null),

        longitude:
          checkpoint.longitude === ""
            ? null
            : toNumber(checkpoint.longitude, null),

        qr_code: checkpoint.qr_code?.trim() || null,

        invoice_order:
          checkpoint.invoice_order === ""
            ? index + 1
            : toNumber(checkpoint.invoice_order, index + 1),

        is_active: Boolean(checkpoint.is_active),

        jso_per_shift_rate: toNumber(checkpoint.jso_per_shift_rate, 1700),

        jso_ot_hour_rate: toNumber(checkpoint.jso_ot_hour_rate, 130),

        jso_approved_per_shift_rate: toNumber(
          checkpoint.jso_approved_per_shift_rate,
          1700,
        ),

        jso_approved_ot_hour_rate: toNumber(
          checkpoint.jso_approved_ot_hour_rate,
          130,
        ),

        lso_per_shift_rate: toNumber(checkpoint.lso_per_shift_rate, 1700),

        lso_ot_hour_rate: toNumber(checkpoint.lso_ot_hour_rate, 130),

        lso_approved_per_shift_rate: toNumber(
          checkpoint.lso_approved_per_shift_rate,
          1700,
        ),

        lso_approved_ot_hour_rate: toNumber(
          checkpoint.lso_approved_ot_hour_rate,
          130,
        ),

        oic_per_shift_rate: toNumber(checkpoint.oic_per_shift_rate, 1700),

        oic_ot_hour_rate: toNumber(checkpoint.oic_ot_hour_rate, 130),

        oic_approved_per_shift_rate: toNumber(
          checkpoint.oic_approved_per_shift_rate,
          1700,
        ),

        oic_approved_ot_hour_rate: toNumber(
          checkpoint.oic_approved_ot_hour_rate,
          130,
        ),
      })),
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${apiBase}/update?id=${editingId}`
        : `${apiBase}/add`;

      const response = await apiFetch(url, {
        method: editingId ? "PUT" : "POST",

        credentials: "include",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(buildPayload()),
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Failed to save client");
      }

      toast.success(
        editingId
          ? "Client updated successfully"
          : "Client created successfully",
      );

      resetForm();
      await fetchClients();
    } catch (error) {
      toast.error(error.message || "Failed to save client");
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
      vat_no: client.vat_no || "",

      checkpoints:
        Array.isArray(client.checkpoints) && client.checkpoints.length > 0
          ? client.checkpoints.map((checkpoint) => ({
              checkpoint_name: checkpoint.checkpoint_name || "",

              address: checkpoint.address || "",

              latitude: checkpoint.latitude ?? "",

              longitude: checkpoint.longitude ?? "",

              qr_code: checkpoint.qr_code || "",

              invoice_order: checkpoint.invoice_order ?? "",

              is_active:
                checkpoint.is_active === true ||
                checkpoint.is_active === 1 ||
                checkpoint.is_active === "1",

              jso_per_shift_rate: valueOrDefault(
                checkpoint.jso_per_shift_rate,
                DEFAULT_PER_SHIFT_RATE,
              ),

              jso_ot_hour_rate: valueOrDefault(
                checkpoint.jso_ot_hour_rate,
                DEFAULT_OT_HOUR_RATE,
              ),

              jso_approved_per_shift_rate: valueOrDefault(
                checkpoint.jso_approved_per_shift_rate,
                DEFAULT_PER_SHIFT_RATE,
              ),

              jso_approved_ot_hour_rate: valueOrDefault(
                checkpoint.jso_approved_ot_hour_rate,
                DEFAULT_OT_HOUR_RATE,
              ),

              lso_per_shift_rate: valueOrDefault(
                checkpoint.lso_per_shift_rate,
                DEFAULT_PER_SHIFT_RATE,
              ),

              lso_ot_hour_rate: valueOrDefault(
                checkpoint.lso_ot_hour_rate,
                DEFAULT_OT_HOUR_RATE,
              ),

              lso_approved_per_shift_rate: valueOrDefault(
                checkpoint.lso_approved_per_shift_rate,
                DEFAULT_PER_SHIFT_RATE,
              ),

              lso_approved_ot_hour_rate: valueOrDefault(
                checkpoint.lso_approved_ot_hour_rate,
                DEFAULT_OT_HOUR_RATE,
              ),

              oic_per_shift_rate: valueOrDefault(
                checkpoint.oic_per_shift_rate,
                DEFAULT_PER_SHIFT_RATE,
              ),

              oic_ot_hour_rate: valueOrDefault(
                checkpoint.oic_ot_hour_rate,
                DEFAULT_OT_HOUR_RATE,
              ),

              oic_approved_per_shift_rate: valueOrDefault(
                checkpoint.oic_approved_per_shift_rate,
                DEFAULT_PER_SHIFT_RATE,
              ),

              oic_approved_ot_hour_rate: valueOrDefault(
                checkpoint.oic_approved_ot_hour_rate,
                DEFAULT_OT_HOUR_RATE,
              ),
            }))
          : [createEmptyCheckpoint()],
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this client and all checkpoints?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await apiFetch(`${apiBase}/delete/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.message || "Failed to delete client");
      }

      toast.success("Client deleted successfully");

      if (editingId === id) {
        resetForm();
      }

      await fetchClients();
    } catch (error) {
      toast.error(error.message || "Failed to delete client");
    }
  };

  const toggleCheckpointDetails = (checkpointId) => {
    setExpandedCheckpoints((previous) => ({
      ...previous,
      [checkpointId]: !previous[checkpointId],
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">
          Client & Checkpoint Management
        </h1>

        <p className="mt-1 text-slate-500">
          Create clients, manage checkpoints, and configure standard and
          approved payroll rates.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
          title="Category Rates"
          value="JSO / LSO / OIC"
          icon={<DollarSign />}
          color="purple"
        />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {editingId ? "Update Client" : "Add New Client"}
            </h2>

            <p className="text-sm text-slate-500">
              Add client information and checkpoint category rates.
            </p>
          </div>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50"
            >
              <X size={18} />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="Client Name"
            value={form.name}
            onChange={(value) => handleClientChange("name", value)}
            placeholder="Enter client name"
          />

          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => handleClientChange("email", value)}
            placeholder="client@email.com"
          />

          <Input
            label="Phone"
            value={form.phone}
            onChange={(value) => handleClientChange("phone", value)}
            placeholder="0770000000"
          />

          <Input
            label="Address"
            value={form.address}
            onChange={(value) => handleClientChange("address", value)}
            placeholder="Client address"
          />

          <Input
            label="VAT Number"
            value={form.vat_no}
            onChange={(value) => handleClientChange("vat_no", value)}
            placeholder="VAT number"
          />
        </div>

        <div className="border-t border-slate-200 pt-5">
          <div className="mb-4 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h3 className="font-bold text-slate-800">Checkpoints</h3>

              <p className="text-sm text-slate-500">
                Configure standard and approved rates for JSO, LSO, and OIC.
              </p>
            </div>

            <button
              type="button"
              onClick={addCheckpointRow}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Plus size={18} />
              Add Checkpoint
            </button>
          </div>

          <div className="space-y-5">
            {form.checkpoints.map((checkpoint, index) => (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <p className="font-semibold text-slate-700">
                    Checkpoint #{index + 1}
                  </p>

                  <button
                    type="button"
                    onClick={() => removeCheckpointRow(index)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    label="Checkpoint Name"
                    value={checkpoint.checkpoint_name}
                    onChange={(value) =>
                      handleCheckpointChange(index, "checkpoint_name", value)
                    }
                    placeholder="Main Gate"
                  />

                  <Input
                    label="Checkpoint Address"
                    value={checkpoint.address}
                    onChange={(value) =>
                      handleCheckpointChange(index, "address", value)
                    }
                    placeholder="Checkpoint address"
                  />

                  <Input
                    label="Invoice Order"
                    type="number"
                    min="1"
                    value={checkpoint.invoice_order}
                    onChange={(value) =>
                      handleCheckpointChange(index, "invoice_order", value)
                    }
                    placeholder={`${index + 1}`}
                  />

                  <SelectInput
                    label="Status"
                    value={checkpoint.is_active ? "1" : "0"}
                    onChange={(value) =>
                      handleCheckpointChange(index, "is_active", value === "1")
                    }
                    options={[
                      {
                        value: "1",
                        label: "Active",
                      },
                      {
                        value: "0",
                        label: "Inactive",
                      },
                    ]}
                  />
                </div>

                <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Input
                    label="Latitude"
                    type="number"
                    step="any"
                    value={checkpoint.latitude}
                    onChange={(value) =>
                      handleCheckpointChange(index, "latitude", value)
                    }
                    placeholder="7.25130000"
                  />

                  <Input
                    label="Longitude"
                    type="number"
                    step="any"
                    value={checkpoint.longitude}
                    onChange={(value) =>
                      handleCheckpointChange(index, "longitude", value)
                    }
                    placeholder="80.34640000"
                  />

                  <Input
                    label="QR Code"
                    value={checkpoint.qr_code}
                    onChange={(value) =>
                      handleCheckpointChange(index, "qr_code", value)
                    }
                    placeholder="QR code value"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                  <CategoryRateSection
                    title="JSO Rates"
                    checkpoint={checkpoint}
                    index={index}
                    prefix="jso"
                    onChange={handleCheckpointChange}
                  />

                  <CategoryRateSection
                    title="LSO Rates"
                    checkpoint={checkpoint}
                    index={index}
                    prefix="lso"
                    onChange={handleCheckpointChange}
                  />

                  <CategoryRateSection
                    title="OIC Rates"
                    checkpoint={checkpoint}
                    index={index}
                    prefix="oic"
                    onChange={handleCheckpointChange}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="rounded-lg border border-slate-300 px-5 py-2 hover:bg-slate-50 disabled:opacity-60"
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Client List</h2>

            <p className="text-sm text-slate-500">
              View and manage existing clients and checkpoints.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-2.5 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clients..."
                className="w-full rounded-lg border border-slate-300 py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={fetchClients}
              disabled={loading}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            Loading clients...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No clients found.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="overflow-hidden rounded-xl border border-slate-200"
              >
                <div className="flex flex-col justify-between gap-4 bg-slate-50 p-5 lg:flex-row lg:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                      <Building2 size={22} />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {client.name}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {client.address || "No address"}
                      </p>

                      {client.vat_no && (
                        <p className="text-xs text-slate-500">
                          VAT: {client.vat_no}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Mail size={16} />
                      {client.email}
                    </span>

                    <span className="flex items-center gap-1">
                      <Phone size={16} />
                      {client.phone}
                    </span>

                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {client.checkpoints?.length || 0} checkpoints
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(client)}
                      className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                    >
                      <Edit size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(client.id)}
                      className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <h4 className="mb-3 font-semibold text-slate-700">
                    Checkpoints
                  </h4>

                  {!client.checkpoints || client.checkpoints.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No checkpoints added.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {client.checkpoints.map((checkpoint) => {
                        const isExpanded = Boolean(
                          expandedCheckpoints[checkpoint.id],
                        );

                        return (
                          <div
                            key={checkpoint.id}
                            className="rounded-xl border border-slate-200 p-4 transition hover:shadow-sm"
                          >
                            <div className="mb-3 flex justify-between gap-3">
                              <div>
                                <h5 className="font-bold text-slate-800">
                                  {checkpoint.checkpoint_name}
                                </h5>

                                <p className="text-sm text-slate-500">
                                  {checkpoint.address || "No address"}
                                </p>

                                {checkpoint.invoice_order !== null &&
                                  checkpoint.invoice_order !== undefined && (
                                    <p className="mt-1 text-xs text-slate-500">
                                      Invoice order: {checkpoint.invoice_order}
                                    </p>
                                  )}
                              </div>

                              <span
                                className={`h-fit rounded-full px-2 py-1 text-xs font-semibold ${
                                  checkpoint.is_active
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {checkpoint.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <CompactCategoryRate
                                title="JSO"
                                standardShift={checkpoint.jso_per_shift_rate}
                                approvedShift={
                                  checkpoint.jso_approved_per_shift_rate
                                }
                              />

                              <CompactCategoryRate
                                title="LSO"
                                standardShift={checkpoint.lso_per_shift_rate}
                                approvedShift={
                                  checkpoint.lso_approved_per_shift_rate
                                }
                              />

                              <CompactCategoryRate
                                title="OIC"
                                standardShift={checkpoint.oic_per_shift_rate}
                                approvedShift={
                                  checkpoint.oic_approved_per_shift_rate
                                }
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                toggleCheckpointDetails(checkpoint.id)
                              }
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={16} />
                                  Hide all rates
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={16} />
                                  View all rates
                                </>
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                <CategoryRateDisplay
                                  title="JSO"
                                  standardShift={checkpoint.jso_per_shift_rate}
                                  standardOt={checkpoint.jso_ot_hour_rate}
                                  approvedShift={
                                    checkpoint.jso_approved_per_shift_rate
                                  }
                                  approvedOt={
                                    checkpoint.jso_approved_ot_hour_rate
                                  }
                                />

                                <CategoryRateDisplay
                                  title="LSO"
                                  standardShift={checkpoint.lso_per_shift_rate}
                                  standardOt={checkpoint.lso_ot_hour_rate}
                                  approvedShift={
                                    checkpoint.lso_approved_per_shift_rate
                                  }
                                  approvedOt={
                                    checkpoint.lso_approved_ot_hour_rate
                                  }
                                />

                                <CategoryRateDisplay
                                  title="OIC"
                                  standardShift={checkpoint.oic_per_shift_rate}
                                  standardOt={checkpoint.oic_ot_hour_rate}
                                  approvedShift={
                                    checkpoint.oic_approved_per_shift_rate
                                  }
                                  approvedOt={
                                    checkpoint.oic_approved_ot_hour_rate
                                  }
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
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

function CategoryRateSection({ title, checkpoint, index, prefix, onChange }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h4 className="mb-4 font-bold text-slate-800">{title}</h4>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Standard Shift Rate"
          type="number"
          min="0"
          step="0.01"
          value={checkpoint[`${prefix}_per_shift_rate`]}
          onChange={(value) =>
            onChange(index, `${prefix}_per_shift_rate`, value)
          }
          placeholder="1700.00"
        />

        <Input
          label="Standard OT Rate"
          type="number"
          min="0"
          step="0.01"
          value={checkpoint[`${prefix}_ot_hour_rate`]}
          onChange={(value) => onChange(index, `${prefix}_ot_hour_rate`, value)}
          placeholder="130.00"
        />

        <Input
          label="Approved Shift Rate"
          type="number"
          min="0"
          step="0.01"
          value={checkpoint[`${prefix}_approved_per_shift_rate`]}
          onChange={(value) =>
            onChange(index, `${prefix}_approved_per_shift_rate`, value)
          }
          placeholder="1700.00"
        />

        <Input
          label="Approved OT Rate"
          type="number"
          min="0"
          step="0.01"
          value={checkpoint[`${prefix}_approved_ot_hour_rate`]}
          onChange={(value) =>
            onChange(index, `${prefix}_approved_ot_hour_rate`, value)
          }
          placeholder="130.00"
        />
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  min,
  step,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <input
        type={type}
        value={value ?? ""}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function SelectInput({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function RateBox({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>

      <p className="font-bold text-slate-800">Rs. {formatMoney(value)}</p>
    </div>
  );
}

function CompactCategoryRate({ title, standardShift, approvedShift }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="mb-2 text-sm font-bold text-slate-700">{title}</p>

      <p className="text-xs text-slate-500">Standard shift</p>

      <p className="font-semibold text-slate-800">
        Rs. {formatMoney(standardShift)}
      </p>

      <p className="mt-2 text-xs text-slate-500">Approved shift</p>

      <p className="font-semibold text-emerald-700">
        Rs. {formatMoney(approvedShift)}
      </p>
    </div>
  );
}

function CategoryRateDisplay({
  title,
  standardShift,
  standardOt,
  approvedShift,
  approvedOt,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <h6 className="mb-3 font-bold text-slate-800">{title}</h6>

      <div className="space-y-2">
        <RateBox label="Standard Shift" value={standardShift} />

        <RateBox label="Standard OT / Hour" value={standardOt} />

        <RateBox label="Approved Shift" value={approvedShift} />

        <RateBox label="Approved OT / Hour" value={approvedOt} />
      </div>
    </div>
  );
}
