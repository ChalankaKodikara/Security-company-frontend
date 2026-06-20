/** @format */

import React, { useState, useEffect } from "react";
import { FaArrowRight, FaTrashAlt } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import { apiFetch } from "../../../utils/apiClient";

const Next_of_kings = ({ data, setData, handleNextStep, handlePrevStep }) => {
  const [formChanged, setFormChanged] = useState(false);

  const [dependentData, setDependentData] = useState(
    Array.isArray(data) && data.length > 0
      ? data
      : [
        {
          relationship: "",
          name: "",
          nic: "",
          dob: "",
          birth_certificate: null,
          dobLocked: false, //  track if DOB is frozen
        },
      ]
  );

  //  NIC → DOB extraction function
  const extractDOBFromNIC = (nic) => {
    let year = "";
    let dayText = 0;

    if (!(nic.length === 10 || nic.length === 12)) return null;

    if (nic.length === 10 && /^\d{9}[vVxX]$/.test(nic)) {
      year = "19" + nic.substring(0, 2);
      dayText = parseInt(nic.substring(2, 5));
    } else if (nic.length === 12 && /^\d{12}$/.test(nic)) {
      year = nic.substring(0, 4);
      dayText = parseInt(nic.substring(4, 7));
    } else {
      return null;
    }

    // gender handling
    if (dayText > 500) {
      dayText -= 500;
    }

    const months = [
      31,
      isLeapYear(year) ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    let month = 0;
    while (dayText > months[month]) {
      dayText -= months[month];
      month++;
    }
    month++;

    const dob = `${year}-${String(month).padStart(2, "0")}-${String(
      dayText
    ).padStart(2, "0")}`;
    return dob;
  };

  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  };

  // --- NIC change handler ---
  const handleNICChange = (index, value) => {
    const updated = [...dependentData];
    updated[index].nic = value;

    const dob = extractDOBFromNIC(value);
    if (dob) {
      updated[index].dob = dob;
      updated[index].dobLocked = true; //  lock DOB after auto-fetch
    } else {
      updated[index].dobLocked = false; //  unlock if NIC invalid/cleared
    }

    setDependentData(updated);
    checkIfChanged(updated);
  };

  // DELETE uploaded birth certificate
  const handleDeleteFile = (index) => {
    const updated = [...dependentData];
    updated[index].birth_certificate = null; // remove file

    setDependentData(updated);
    checkIfChanged(updated);

    // remove from localStorage
    const stored = JSON.parse(localStorage.getItem("nextOfKinData") || "[]");
    if (stored[index]) {
      stored[index].birth_certificate = null;
      localStorage.setItem("nextOfKinData", JSON.stringify(stored));
    }

    toast.success("Document removed");
  };


  const checkIfChanged = (updated) => {
    const stored = localStorage.getItem("nextOfKinData");
    if (!stored) return;
    const parsed = JSON.parse(stored);
    const changed = JSON.stringify(parsed) !== JSON.stringify(updated);
    setFormChanged(changed);
  };



  const handleAddDependent = () => {
    setDependentData([
      ...dependentData,
      {
        relationship: "",
        name: "",
        nic: "",
        dob: "",
        birth_certificate: null,
        dobLocked: false,
      },
    ]);
  };

  const handleRemoveDependent = (index) => {
    const updated = [...dependentData];
    updated.splice(index, 1);
    setDependentData(updated);

    const storedFiles = JSON.parse(
      localStorage.getItem("nextOfKinFiles") || "[]"
    );
    storedFiles.splice(index, 1);
    localStorage.setItem("nextOfKinFiles", JSON.stringify(storedFiles));

    checkIfChanged(updated);
  };

  const handleNext = async () => {
    const isSubmitted = localStorage.getItem("nextOfKinSubmitted") === "true";
    const employee_no = localStorage.getItem("employee_no");

    if (!employee_no) {
      toast.error(
        "Employee number not found. Please complete personal details first."
      );
      return;
    }

    if (isSubmitted && !formChanged) {
      handleNextStep(true);
      return;
    }

    // skip if everything is empty
    const allEmpty = dependentData.every(
      (d) =>
        !d.relationship && !d.name && !d.nic && !d.dob && !d.birth_certificate
    );
    if (allEmpty) {
      handleNextStep(true);
      return;
    }

    setData(dependentData);

    try {
      // 1️⃣ Save dependents
      const dependentsPayload = {
        employee_no,
        dependents: dependentData
          .filter(
            (d) =>
              d.relationship ||
              d.name ||
              d.nic ||
              d.dob ||
              d.birth_certificate
          )
          .map((d) => ({
            relationship: d.relationship,
            name: d.name,
            nic: d.nic,
            dob: d.dob,
          })),
      };

      const response = await apiFetch(
        `${process.env.REACT_APP_FRONTEND_URL}/v1/hris/employees/add-dependents`,
        {
          method: "POST",
          body: JSON.stringify(dependentsPayload),
        }
      );
      const responseData = await response.json();

      const savedDeps = responseData?.data || [];
      const updatedDependents = dependentData.map((dep, index) => {
        const saved =
          savedDeps[index] ||
          savedDeps.find((s) => s.employee_dependent_nic === dep.nic);
        return { ...dep, id: saved?.employee_dependent_details_id || null };
      });

      // 2️⃣ Upload files
      for (const dep of updatedDependents) {
        if (dep?.birth_certificate instanceof File && dep?.id) {
          const formData = new FormData();
          formData.append("employee_dependent_details_id", dep.id);
          formData.append("birth_certificate", dep.birth_certificate);

          await apiFetch(
            `${process.env.REACT_APP_FRONTEND_URL}/v1/hris/employees/update-dependent-files`,
            {
              method: "PUT",
              body: formData,
            }
          );
        }
      }

      // 3️⃣ Cache
      const storedData = updatedDependents.map((d) => ({
        relationship: d.relationship,
        name: d.name,
        nic: d.nic,
        dob: d.dob,
        id: d.id,
        birth_certificate: d.birth_certificate
          ? {
            name: d.birth_certificate.name,
            type: d.birth_certificate.type,
            size: d.birth_certificate.size,
            lastModified: d.birth_certificate.lastModified,
          }
          : null,
      }));
      localStorage.setItem("nextOfKinData", JSON.stringify(storedData));
      localStorage.setItem("nextOfKinSubmitted", "true");

      setDependentData(updatedDependents);
      setFormChanged(false);

      toast.success("Next of kin details submitted successfully!");
      handleNextStep(true);
    } catch (error) {
      console.error("Next of kin submission error:", error);
      const errorMessage = error?.message || "Failed to submit next of kin.";
      toast.error(errorMessage);
    }
  };

  const handlePrev = () => {
    setData(dependentData);
    handlePrevStep(true);
  };

  return (
    <div className="text-[16px]">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold mb-1">
            Next of Kin Details
          </h1>
          <p className="text-gray-500 mb-6">Enter Relationship Details.</p>
        </div>

        <div>
          {localStorage.getItem("nextOfKinSubmitted") === "true" ? (
            <button
              className="border border-gray-300 text-gray-400 px-5 py-2 rounded cursor-not-allowed"
              disabled
            >
              Add Next of Kin +
            </button>
          ) : (
            <button
              onClick={handleAddDependent}
              className="border border-red-500 text-red-500 px-5 py-2 rounded hover:bg-red-100"
            >
              Add Next of Kin +
            </button>
          )}
        </div>
      </div>

      {dependentData.map((dependent, index) => (
        <div
          key={index}
          className="border border-gray-200 p-4 mb-6 rounded relative"
        >
          {dependentData.length > 1 && (
            <button
              onClick={() => handleRemoveDependent(index)}
              className="absolute top-2 right-2 text-red-500"
              title="Remove this entry"
            >
              <FaTrashAlt />
            </button>
          )}

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-1">Relationship</label>
              <select
                value={dependent.relationship}
                onChange={(e) => {
                  const updated = [...dependentData];
                  updated[index].relationship = e.target.value;
                  setDependentData(updated);
                  checkIfChanged(updated);
                }}
                className="w-full border border-gray-300 p-2 rounded"
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
              <label className="block text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={dependent.name}
                onChange={(e) => {
                  const updated = [...dependentData];
                  updated[index].name = e.target.value;
                  setDependentData(updated);
                  checkIfChanged(updated);
                }}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-1">NIC</label>
              <input
                type="text"
                value={dependent.nic}
                onChange={(e) => handleNICChange(index, e.target.value)}
                className="w-full border border-gray-300 p-2 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 mb-1">Date of Birth</label>
              <input
                type="date"
                value={dependent.dob}
                readOnly={dependent.dobLocked}
                onChange={(e) => {
                  if (!dependent.dobLocked) {
                    const updated = [...dependentData];
                    updated[index].dob = e.target.value;
                    setDependentData(updated);
                    checkIfChanged(updated);
                  }
                }}
                className={`w-full border border-gray-300 p-2 rounded ${dependent.dobLocked ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
              />
            </div>

            {/* UPLOADED FILE + DELETE */}
            {/* <div>
              <label className="block text-gray-700 mb-1">Birth Certificate</label>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files[0];
                  const updated = [...dependentData];
                  updated[index].birth_certificate = file;
                  setDependentData(updated);
                  checkIfChanged(updated);
                }}
                className="w-full border border-gray-300 p-2 rounded"
              />

              {dependent.birth_certificate && (
                <div className="mt-2 flex items-center justify-between bg-gray-100 p-2 rounded">
                  <span className="text-sm text-gray-700">
                    {dependent.birth_certificate.name ||
                      "Uploaded document"}
                  </span>

                  <button
                    onClick={() => handleDeleteFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              )}
            </div> */}
          </div>



        </div>
      ))}

      <div className="flex justify-between items-center mt-6">
        <button
          className="bg-gray-400 text-white px-5 py-2 rounded flex items-center"
          onClick={handlePrev}
        >
          <FaArrowRight className="rotate-180 mr-2" /> Previous
        </button>

        <button
          onClick={handleNext}
          className="bg-blue-600 text-white px-6 py-2 rounded flex items-center"
        >
          {formChanged ? "Update & Next" : "Next"}{" "}
          <FaArrowRight className="ml-2" />
        </button>
      </div>
    </div>
  );
};

export default Next_of_kings;