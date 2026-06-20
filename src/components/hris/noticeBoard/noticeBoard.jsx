/** @format */

import React, { useEffect, useMemo, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import usePermissions from "../../permissions/permission";
import { Bell, Plus, Edit2, Trash2, X, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { motion } from "framer-motion";

const API_URL = process.env.REACT_APP_FRONTEND_URL;

// ---- Endpoints ----
const LIST_ENDPOINT = `${API_URL}/v1/hris/noticeboard/all`;
const ADD_ENDPOINT = `${API_URL}/v1/hris/noticeboard/add`;
const UPDATE_ENDPOINT = (id) => `${API_URL}/v1/hris/noticeboard/update/${id}`;
const DELETE_ENDPOINT = (id) => `${API_URL}/v1/hris/noticeboard/delete/${id}`;

// ---- Helpers ----
const toApiDateTime = (val) => {
  if (!val) return "";
  const [date, time] = val.split("T");
  const seconds = time?.length === 5 ? ":00" : "";
  return `${date} ${time}${seconds}`;
};

const toInputDateTime = (apiVal) => {
  if (!apiVal) return "";
  if (apiVal.includes("T")) {
    const d = new Date(apiVal);
    if (isNaN(d)) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }
  const [date, time] = apiVal.split(" ");
  const [hh = "00", mm = "00"] = (time || "").split(":");
  return `${date}T${hh}:${mm}`;
};

const formatDisplayDate = (val) => {
  if (!val) return "-";
  const d = val.includes("T") ? new Date(val) : new Date(val.replace(" ", "T"));
  if (isNaN(d)) return val;
  return d.toLocaleString();
};

const Badge = ({ children, tone = "green" }) => {
  const tones = {
    green: "bg-green-100 text-green-700 border-green-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    red: "bg-red-100 text-red-700 border-red-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${tones[tone] || tones.gray
        }`}
    >
      {tone === "green" && <CheckCircle className="w-3.5 h-3.5" />}
      {tone === "gray" && <XCircle className="w-3.5 h-3.5" />}
      {children}
    </span>
  );
};

const NoticeBoard = () => {
  const { hasPermission } = usePermissions();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const isEditing = useMemo(() => editingId !== null, [editingId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [publishAt, setPublishAt] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [notices, setNotices] = useState([]);

  // ---- Load list (from /all) ----
  const fetchNotices = async () => {
    const token = Cookies.get("accessToken");

    if (!token) {
      toast.error("Authentication token not found. Please login again.");
      return;
    }

    try {
      setListLoading(true);
      const res = await fetch(LIST_ENDPOINT, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch notices (${res.status})`);
      const data = await res.json();
      const items = Array.isArray(data) ? data : data?.data ?? [];
      setNotices(items);
    } catch (e) {
      toast.error(e.message || "Failed to load notices");
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  // ---- Modal helpers ----
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPublishAt("");
    setStatus("ACTIVE");
    setEditingId(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setPublishAt(toInputDateTime(item.published_date));
    setStatus(item.status || "ACTIVE");
    setOpen(true);
  };

  // ---- Create/Update ----
  const handleSave = async () => {
    if (!title.trim() || !description.trim() || !publishAt) {
      toast.error("Please fill in Title, Description, and Publish Date.");
      return;
    }

    const token = Cookies.get("accessToken");

    if (!token) {
      toast.error("Authentication token not found. Please login again.");
      return;
    }

    const payload = {
      title: title.trim(),
      description: description.trim(),
      published_date: toApiDateTime(publishAt),
      status: status || "ACTIVE",
    };

    try {
      setLoading(true);
      const url = isEditing ? UPDATE_ENDPOINT(editingId) : ADD_ENDPOINT;
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Request failed with status ${res.status}`);
      }

      toast.success(isEditing ? "Notice updated." : "Notice created.");
      setOpen(false);
      resetForm();
      fetchNotices();
    } catch (e) {
      toast.error(e.message || "Failed to save notice.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (notice) => {
    setDeleteTarget(notice);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    const token = Cookies.get("accessToken");

    if (!token) {
      toast.error("Authentication token not found. Please login again.");
      return;
    }

    const id = deleteTarget.id;
    const toastId = toast.loading("Deleting notice...");
    setDeletingId(id);

    try {
      const res = await fetch(DELETE_ENDPOINT(id), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Delete failed with status ${res.status}`);
      }

      setNotices((prev) => prev.filter((n) => n.id !== id));

      toast.update(toastId, {
        render: "Notice deleted.",
        type: "success",
        isLoading: false,
        autoClose: 2000,
        closeOnClick: true,
      });

      setDeleteTarget(null);
    } catch (e) {
      toast.update(toastId, {
        render: e.message || "Failed to delete notice.",
        type: "error",
        isLoading: false,
        autoClose: 4000,
        closeOnClick: true,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
    >

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8 font-montserrat">
        <ToastContainer
          position="top-right"
          autoClose={2500}
          closeOnClick
          pauseOnHover
          theme="colored"
        />

        {/* Header */}
        <div className="mb-10 " >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-[25px]  mb-3 flex items-center gap-3">
                Notice Board
              </h1>
              <p className="text-gray-600 text-lg">Manage and publish company announcements</p>
            </div>
            {hasPermission(1020) && (
              <button
                className="flex items-center gap-2 bg-blue-500 text-white px-6 py-3 rounded-xl "
                onClick={openCreate}
              >
                <Plus className="w-5 h-5" />
                Add Notice
              </button>
            )}
          </div>

          {/* Stats Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Notices</p>
                  <p className="text-4xl font-bold text-blue-600">{notices.length}</p>
                </div>
                <Bell className="w-12 h-12 text-blue-500 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Active Notices</p>
                  <p className="text-4xl font-bold text-green-600">
                    {notices.filter(n => n.status === "ACTIVE").length}
                  </p>
                </div>
                <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-gray-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Inactive Notices</p>
                  <p className="text-4xl font-bold text-gray-600">
                    {notices.filter(n => n.status !== "ACTIVE").length}
                  </p>
                </div>
                <XCircle className="w-12 h-12 text-gray-500 opacity-20" />
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {listLoading ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-500 mt-4">Loading notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notices published yet.</p>
              <p className="text-gray-400 text-sm mt-2">Click "Add Notice" to create your first announcement</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className=" bg-blue-500  p-2 rounded-lg">
                            <Bell className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-800">{n.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDisplayDate(n.published_date)}</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-700 mt-4 whitespace-pre-wrap leading-relaxed">
                          {n.description}
                        </p>

                        <div className="mt-4">
                          <Badge tone={n.status === "ACTIVE" ? "green" : "gray"}>
                            {n.status || "UNKNOWN"}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0">
                        {hasPermission(10011) && (
                          <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 text-blue-600 hover:bg-blue-50 transition-all "
                            onClick={() => openEdit(n)}
                          >
                            <Edit2 className="w-4 h-4" />
                            Edit
                          </button>
                        )}
                        {hasPermission(10012) && (
                          <button
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg transition-all  disabled:opacity-50"
                            onClick={() => confirmDelete(n)}
                            disabled={deletingId === n.id}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {open && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            aria-labelledby="notice-modal-title"
            role="dialog"
            aria-modal="true"
          >
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            />

            <div className="relative w-full max-w-2xl mx-auto rounded-lg bg-white shadow-2xl transform transition-all">
              <div className="flex items-center justify-between bg-blue-500 px-8 py-6 rounded-t-lg">
                <h2 id="notice-modal-title" className="text-2xl font-bold text-white flex items-center gap-3">
                  <Bell className="w-7 h-7" />
                  {isEditing ? "Edit Notice" : "Add Notice"}
                </h2>
                <button
                  className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="px-8 py-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter notice title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 h-32 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Enter notice description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Publish Date & Time</label>
                    <input
                      type="datetime-local"
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={publishAt}
                      onChange={(e) => setPublishAt(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                    <select
                      className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 bg-gray-50 px-8 py-6 rounded-b-2xl">
                <button
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-100 transition-all font-semibold"
                  onClick={() => {
                    setOpen(false);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className={`px-6 py-3 rounded-xl text-white font-semibold transition-all ${loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-blue-600 hover:shadow-lg transform hover:scale-105"
                    }`}
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading
                    ? isEditing
                      ? "Updating..."
                      : "Publishing..."
                    : isEditing
                      ? "Update Notice"
                      : "Publish Notice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-center">Delete Notice</h3>
              <p className="text-gray-700 text-center mb-6">
                Are you sure you want to delete{" "}
                <strong className="text-gray-900">"{deleteTarget.title}"</strong>? This action cannot be undone.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:bg-gray-100 transition-all font-semibold"
                  onClick={() => setDeleteTarget(null)}
                  disabled={deletingId === deleteTarget.id}
                >
                  Cancel
                </button>
                <button
                  className={`px-6 py-3 rounded-xl text-white font-semibold transition-all ${deletingId === deleteTarget.id
                    ? "bg-red-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg transform hover:scale-105"
                    }`}
                  onClick={handleDelete}
                  disabled={deletingId === deleteTarget.id}
                >
                  {deletingId === deleteTarget.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>

  );
};

export default NoticeBoard;