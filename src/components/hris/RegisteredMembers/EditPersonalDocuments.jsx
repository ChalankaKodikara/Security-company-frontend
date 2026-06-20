/** @format */
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { FaRegFilePdf, FaCloudUploadAlt } from "react-icons/fa";
import { apiFetch } from "../../../utils/apiClient";

const EditPersonalDocuments = ({ employeeNo, onClose, onUpdateSuccess }) => {
  const [docs, setDocs] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const [showConfirmUpdate, setShowConfirmUpdate] = useState(false);

  // --- Fetch current documents ---
  const fetchDocs = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/files/${employeeNo}`,
      );

      const json = await res.json();
      if (json.success) {
        setDocs(json.data);
      } else {
        setDocs([]);
      }
    } catch (err) {
      console.error("Fetch docs error:", err);
    }
  };

  useEffect(() => {
    if (employeeNo) fetchDocs();
  }, [employeeNo]);

  // --- Handle new files ---
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeNewFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // --- POST upload new files ---
  const handleUpdate = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("employee_no", employeeNo);
      selectedFiles.forEach((file) => formData.append("file", file));

      const token = Cookies.get("accessToken");
      const res = await apiFetch(`${API_URL}/v1/hris/employees/files`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        toast.success("Files updated successfully");
        setSelectedFiles([]);
        fetchDocs();
        onUpdateSuccess?.();

        //  Auto close popup after short delay
        setTimeout(() => {
          onClose?.();
        }, 1000);
      } else {
        toast.error(json.message || "Failed to update files");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error updating files");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Delete confirmation flow ---
  const requestDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/employees/files/${deleteId}`,
        {
          method: "DELETE",
        },
      );
      const json = await res.json();
      if (json.success) {
        toast.success("Document deleted");
        onUpdateSuccess?.();
        setShowDeleteModal(false);
        onClose?.(); //  Close main popup after delete
      } else {
        toast.error(json.message || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting file");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-white/10 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3 }}
        className="relative bg-white w-full sm:w-[650px] h-full p-6 shadow-xl overflow-y-auto z-10"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-700">
            Edit Personal Documents
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {/* Current docs */}
        <h3 className="text-sm text-gray-500 mb-2">Current Documents</h3>
        <div className="space-y-3 mb-6">
          {docs.length === 0 ? (
            <p className="text-gray-400 text-sm">No documents found</p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.employee_upload_files_id}
                className="flex items-center justify-between border rounded-md p-3 bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <FaRegFilePdf className="text-red-500 text-xl" />
                  <span className="text-sm font-medium text-gray-700">
                    {doc.original_file_name}
                  </span>
                </div>
                <button
                  onClick={() => requestDelete(doc.employee_upload_files_id)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>

        {/* Upload new */}
        <h3 className="text-sm text-gray-500 mb-2">Upload New Documents</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6 bg-gray-50">
          <FaCloudUploadAlt className="mx-auto text-4xl text-blue-500 mb-2" />
          <p className="text-gray-600 text-sm mb-2">
            Drag & drop files here or click below
          </p>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer inline-block mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
          >
            Choose Files
          </label>
        </div>

        {/* Preview new files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2 mb-6">
            {selectedFiles.map((file, i) => (
              <div
                key={i}
                className="flex items-center justify-between border p-2 rounded-md"
              >
                <span className="text-sm text-gray-700">{file.name}</span>
                <button
                  onClick={() => removeNewFile(i)}
                  className="text-red-500 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => setShowConfirmUpdate(true)}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            {isSubmitting ? "Updating..." : "Update Files"}
          </button>
        </div>
      </motion.div>

      {showConfirmUpdate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white p-6 rounded-md w-[400px] text-center shadow-xl"
          >
            <h2 className="text-lg font-semibold text-gray-800">
              Confirm Update
            </h2>
            <p className="text-sm text-gray-500 mt-2">
              Are you sure you want to upload/update these files?
            </p>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => {
                  setShowConfirmUpdate(false);
                  handleUpdate();
                }}
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                {isSubmitting ? "Updating..." : "Yes, Update"}
              </button>
              <button
                onClick={() => setShowConfirmUpdate(false)}
                className="bg-gray-200 px-4 py-2 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default EditPersonalDocuments;
