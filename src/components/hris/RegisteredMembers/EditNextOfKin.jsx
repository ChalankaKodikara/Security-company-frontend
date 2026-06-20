/** @format */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../utils/apiClient";

/** --- Helper: extract DOB + gender from NIC --- */
const extractDOBFromNIC = (nic) => {
  let year = "";
  let dayText = 0;
  let gender = "";
  let month = "";
  let day = "";

  if (!(nic?.length === 10 || nic?.length === 12)) return null;

  if (nic.length === 10 && /^\d{9}[vVxX]$/.test(nic)) {
    year = "19" + nic.substring(0, 2);
    dayText = parseInt(nic.substring(2, 5));
  } else if (nic.length === 12 && /^\d{12}$/.test(nic)) {
    year = nic.substring(0, 4);
    dayText = parseInt(nic.substring(4, 7));
  } else {
    return null;
  }

  if (dayText > 500) {
    gender = "Female";
    dayText -= 500;
  } else {
    gender = "Male";
  }

  if (dayText < 1 || dayText > 366) return null;

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let monthIndex = 0;
  while (dayText > daysInMonth[monthIndex]) {
    dayText -= daysInMonth[monthIndex];
    monthIndex++;
  }

  month = String(monthIndex + 1).padStart(2, "0");
  day = String(dayText).padStart(2, "0");

  return { dob: `${year}-${month}-${day}`, gender };
};

/** --- Component --- */
const EditNextOfKinDetails = ({ kinData, memberNo, onClose, onUpdateSuccess }) => {
  const [kinList, setKinList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const inputStyle = "w-full border border-gray-300 p-2 rounded text-sm";
  const labelStyle = "block text-sm text-gray-600 mb-1";
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (kinData && kinList.length === 0) {
      const initialKin = {
        id: kinData?.id || null,
        relationship: kinData.relationship || "",
        name: kinData.name || "",
        address: kinData.address || "",
        nic: kinData.nic || "",
        date_of_birth: kinData.date_of_birth || "",
        is_guardian: kinData.is_guardian || false,
        birth_certificate: null,
        birth_certificate_path: kinData.birth_certificate_path || null,
      };
      setKinList([initialKin]);
    } else if (!kinData && kinList.length === 0) {
      setKinList([{ ...getEmptyKin() }]);
    }
  }, [kinData]); // eslint-disable-line react-hooks/exhaustive-deps

  const getEmptyKin = () => ({
    id: null,
    relationship: "",
    name: "",
    address: "",
    nic: "",
    date_of_birth: "",
    is_guardian: false,
    birth_certificate: null,
    birth_certificate_path: null,
  });

  const handleChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const updated = [...kinList];
    updated[index][name] = type === "checkbox" ? checked : value;

    if (name === "nic") {
      const result = extractDOBFromNIC(value);
      if (result?.dob) updated[index].date_of_birth = result.dob;
    }

    setKinList(updated);
  };

  const handleFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const updated = [...kinList];
    updated[index].birth_certificate = file;
    setKinList(updated);

    const kin = updated[index];
    const authToken = Cookies.get("accessToken");

    // If the kin already exists (has an id), upload immediately
    if (kin.id) {
      try {
        const form = new FormData();
        form.append("dependent_id", kin.id);
        form.append("file", file);

        const res = await apiFetch(
          `${API_URL}/v1/hris/employees/update-dependent-files`,
          {
            method: "PUT",
            body: form,
          }
        );

        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.success === false) {
          throw new Error(json.message || `Upload failed (HTTP ${res.status})`);
        }

        toast.success("File uploaded successfully");
      } catch (err) {
        console.error("Upload error:", err);
        toast.error(err.message || "Failed to upload file");
      }
    }
  };


  const addNewKin = () => setKinList([...kinList, getEmptyKin()]);
  const removeKin = (index) => setKinList(kinList.filter((_, i) => i !== index));

  const normNic = (s = "") => s.toString().trim().toUpperCase();

  /** --- Submit: PUT updates + POST new + upload files --- */
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const authToken = Cookies.get("accessToken");

    const existingKin = kinList.filter((k) => !!k.id);
    const newKin = kinList.filter(
      (k) => !k.id && (k.name || k.relationship || k.nic || k.date_of_birth)
    );

    try {
      // 1) UPDATE existing
      for (const kin of existingKin) {
        await apiFetch(`${API_URL}/v1/hris/employees/update/${kin.id}`, {
          method: "PUT",
          
          body: JSON.stringify({
            employee_dependent_name: kin.name,
            employee_dependent_relationship: kin.relationship,
            employee_dependent_nic: kin.nic,
            employee_dependent_dob: kin.date_of_birth,
          }),
        });

        if (kin.birth_certificate) {
          const form = new FormData();
          form.append("dependent_id", kin.id);
          form.append("file", kin.birth_certificate);
          await fetch(`${API_URL}/v1/hris/employees/update-dependent-files`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${authToken}` },
            body: form,
          });
        }
      }

      // 2) CREATE new
      if (newKin.length > 0) {
        const payload = {
          employee_no: memberNo,
          dependents: newKin.map((k) => ({
            name: k.name || "",
            relationship: k.relationship || "",
            nic: k.nic || "",
            dob: k.date_of_birth || "",
          })),
        };

        const createRes = await apiFetch(`${API_URL}/v1/hris/employees/add-dependents`, {
          method: "POST",
         
          body: JSON.stringify(payload),
        });

        const createJson = await createRes.json().catch(() => ({}));
        if (!createRes.ok || createJson?.success === false) {
          throw new Error(createJson?.message || `Create dependents failed (HTTP ${createRes.status})`);
        }

        const created = Array.isArray(createJson?.data) ? createJson.data : [];
        const createdByNic = new Map();
        created.forEach((c) => {
          if (c?.id && c?.nic) createdByNic.set(normNic(c.nic), c.id);
        });

        for (let i = 0; i < newKin.length; i++) {
          const k = newKin[i];
          if (!k.birth_certificate) continue;
          let createdId = createdByNic.get(normNic(k.nic));
          if (!createdId && created[i]?.id) createdId = created[i].id;

          if (createdId) {
            const fd = new FormData();
            fd.append("dependent_id", createdId);
            fd.append("file", k.birth_certificate);
            await apiFetch(`${API_URL}/v1/hris/employees/update-dependent-files`, {
              method: "PUT",
              body: fd,
            });
          }
        }
      }

      toast.success("Dependents saved successfully");
      onUpdateSuccess?.();
      onClose?.();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to save dependents");
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);   
    }

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
        className="relative bg-white w-full sm:w-[700px] h-[100%] p-6 shadow-xl overflow-y-auto z-10"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Edit Next of Kin</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-red-500 text-2xl font-bold"
          >
            &times;
          </button>
        </div>

        {kinList.map((kin, index) => (
          <div
            key={index}
            className="mb-6 border rounded p-4 bg-gray-50 relative"
          >
            {kinList.length > 1 && (
              <button
                onClick={() => removeKin(index)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-lg font-bold"
              >
                ×
              </button>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Relationship</label>
                <select
                  name="relationship"
                  value={kin.relationship}
                  onChange={(e) => handleChange(index, e)}
                  className={inputStyle}
                >
                  <option value="">Select</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Guardian">Guardian</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className={labelStyle}>Name</label>
                <input
                  name="name"
                  value={kin.name}
                  onChange={(e) => handleChange(index, e)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>NIC</label>
                <input
                  name="nic"
                  value={kin.nic}
                  onChange={(e) => handleChange(index, e)}
                  className={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Date of Birth</label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={kin.date_of_birth}
                  onChange={(e) => handleChange(index, e)}
                  className={inputStyle}
                />
              </div>

            </div>
          </div>
        ))}

        <button
          onClick={addNewKin}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Add New Next of Kin
        </button>

        <div className="flex justify-end gap-4">
          <button
            onClick={() => setShowConfirm(true)}
            className="bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Update"}
          </button>

        </div>
      </motion.div>

      <ToastContainer />

      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Confirm Update
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to save changes to Next of Kin?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="bg-gray-200 px-4 py-2 rounded text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 px-4 py-2 text-white rounded hover:bg-blue-700"
                >
                  Yes, Update
                </button>
              </div>
            </div>
          </div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default EditNextOfKinDetails;
