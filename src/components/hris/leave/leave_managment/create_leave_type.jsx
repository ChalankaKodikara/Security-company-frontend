/** @format */

import React, { useEffect, useState } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient";
const API_URL = process.env.REACT_APP_FRONTEND_URL;

const CreateLeaveType = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [categories, setCategories] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [selectedEmploymentTypes, setSelectedEmploymentTypes] = useState([]);
  const [createdBy, setCreatedBy] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const token = Cookies.get("accessToken");

  // Replace your current handleViewCategory
  const handleViewCategory = async (id) => {
    try {
      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/getLeaveCategoryById?id=${id}`,
       
      );
      if (!res.ok) throw new Error("Failed to fetch category details");
      const json = await res.json();
      const data = json.data;

      // normalize field names
      setEditData({
        ...data,
        recurrence_type:
          data.recurrence_type?.toString().toUpperCase() === "ANNUAL"
            ? "Annual"
            : "Monthly", // fallback to Monthly
        employment_type: data.employeement_type || data.employment_type || [],
      });


      setIsModalOpen(true);
      setIsEditMode(false);
    } catch (err) {
      toast.error(err.message || "Error loading category details");
    }
  };


  const handleFieldChange = (field, value) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  useEffect(() => {
    const fetchEmploymentTypes = async () => {
      try {
        const res = await apiFetch(`${API_URL}/v1/hris/employmentType/all`);
        if (!res.ok) throw new Error("Failed to fetch employment types");
        const json = await res.json();
        setEmploymentTypes(
          (json?.data || []).map((et) => ({
            value: et.id,
            label: et.type_name,
          }))
        );
      } catch (err) {
        toast.error("Error loading employment types.");
      }
    };
    fetchEmploymentTypes();
  }, []);

  useEffect(() => {
    const username = Cookies.get("username") || "";
    setCreatedBy(username);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = e.target;

    const payload = {
      category_name: form.category_name.value.trim(),
      create_by: createdBy,
      recurrence_type: form.recurrence_type.value === "annual",
      eligible_gender: form.eligible_gender.value.toLowerCase(), // standardize
      weight: parseFloat(form.leave_weight.value),
      apply_before_day: parseInt(form.apply_before_day.value, 10),
      no_of_days: parseInt(form.no_of_days.value, 10),
      employment_type: selectedEmploymentTypes.map((opt) => opt.value),
    };

    try {
      const res = await apiFetch(`${API_URL}/v1/hris/leave/add-leaveCategory/`, {
        method: "POST",
      
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to create leave category");
      }

      const data = await res.json();
      toast.success("Leave category created successfully!");
      setCategories((prev) => [...prev, data?.data || payload]);
      form.reset();
      setSelectedEmploymentTypes([]);
    } catch (err) {
      toast.error(err.message || "Error creating leave category");
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setLoadError("");
        const res = await apiFetch(`${API_URL}/v1/hris/leave/getLeaveCategory`);
        if (!res.ok)
          throw new Error(`Failed to fetch leave categories (${res.status})`);
        const json = await res.json();
        setCategories(json?.data || []);
      } catch (err) {
        setLoadError(err.message || "Failed to load leave categories.");
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleUpdateCategory = async () => {
    try {
      const payload = {
        category_name: editData.category_name,
        recurrence_type: editData.recurrence_type, // "Monthly" or "Annual"
        eligible_gender: editData.eligible_gender,
        weight: parseFloat(editData.weight),
        apply_before_day: parseInt(editData.apply_before_day, 10),
        no_of_days: parseInt(editData.no_of_days, 10),
        employment_type: editData.employment_type || [],
      };


      const res = await apiFetch(
        `${API_URL}/v1/hris/leave/updateLeaveCategory?id=${editData.id}`,
        {
          method: "PUT",
       
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to update leave category");
      }

      const data = await res.json();
      toast.success("Leave category updated successfully!");

      // update UI
      setCategories((prev) =>
        prev.map((c) => (c.id === data.data.id ? data.data : c))
      );

      setEditData(data.data);
      setIsEditMode(false);
    } catch (err) {
      toast.error(err.message || "Error updating leave category");
    }
  };



  return (
    <div className="font-montserrat mt-5">
      <p className="text-[25px]">Leave Category Settings</p>

      {/* Tabs */}
      <div className="flex border-b mb-4">
       
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 font-medium ${activeTab === "create"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
              }`}
          >
            Create Leave Category
          </button>
      
       
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 font-medium ${activeTab === "list"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600"
              }`}
          >
            Leave Categories
          </button>
       
      </div>

      {/* Tab Content */}
     
        <div>
          <h2 className="text-lg font-semibold mb-3">Add New Leave Category</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Grid Layout */}
            <div className="grid grid-cols-3 grid-rows-2 gap-4">
              <div>
                <label className="block text-sm font-medium">
                  Category Name
                </label>
                <input
                  type="text"
                  name="category_name"
                  className="w-full border rounded p-2 mt-1"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Created By</label>
                <input
                  type="text"
                  name="create_by"
                  value={createdBy} // auto-filled from cookies
                  readOnly // prevent editing if you want it locked
                  className="w-full border rounded p-2 mt-1 bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Annual Recurring
                </label>
                <Select
                  name="recurrence_type"
                  options={[
                    { value: "monthly", label: "Monthly" },
                    { value: "annual", label: "Annual" },
                  ]}
                  defaultValue={{ value: "annual", label: "Annual" }}
                  className="mt-1"
                />
              </div>

              <div className="row-start-2">
                <label className="block text-sm font-medium">
                  Apply Before (days)
                </label>
                <input
                  type="number"
                  name="apply_before_day"
                  className="w-full border rounded p-2 mt-1"
                  placeholder="Enter no. of days"
                />
              </div>

              <div className="row-start-2">
                <label className="block text-sm font-medium">No of Days</label>
                <input
                  type="number"
                  name="no_of_days"
                  className="w-full border rounded p-2 mt-1"
                  placeholder="Enter leave days"
                />
              </div>

              <div className="row-start-2">
                <label className="block text-sm font-medium">
                  Employment Types
                </label>
                <Select
                  isMulti
                  options={employmentTypes}
                  value={selectedEmploymentTypes}
                  onChange={setSelectedEmploymentTypes}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Leave Weight
                </label>
                <input
                  type="text"
                  name="leave_weight"
                  className="w-full border rounded p-2 mt-1"
                  placeholder="Enter leave weight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Eligible Gender
                </label>
                <Select
                  name="eligible_gender"
                  options={[
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                    { value: "both", label: "Both" },
                  ]}
                  defaultValue={{ value: "both", label: "Both" }}
                  className="mt-1"
                />
              </div>
            </div>

          
              <button
                type="submit"
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save
              </button>
           
          </form>
        </div>
      

     
        <div>
          <h2 className="text-lg font-semibold mb-3">Leave Categories List</h2>
          <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category Name
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurring Type
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  No of Days
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Weight
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {loadError ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-sm text-red-600"
                  >
                    {loadError}
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-6 text-center text-sm text-gray-500"
                  >
                    Loading…
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td
                    colSpan="9"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No categories found.
                  </td>
                </tr>
              ) : (
                categories
                  .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                  .map((cat) => (
                    <tr key={cat.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cat.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cat.recurrence_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cat.no_of_days}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cat.weight}
                      </td>

                      <td className="py-2  flex items-center space-x-2">
                        <div>
                         
                            <button
                              className="bg-blue-600 text-white p-2 rounded-md"
                              onClick={() => handleViewCategory(cat.id)} // 👈 pass id, not whole object
                            >
                              View Category
                            </button>
                         
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>

          {/* Pager */}
          <div className="flex items-center justify-between px-6 py-4 text-sm text-gray-600">
            <div>
              Showing{" "}
              {categories.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}{" "}
              to {Math.min(currentPage * pageSize, categories.length)} of{" "}
              {categories.length} entries
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from(
                { length: Math.ceil(categories.length / pageSize) },
                (_, i) => i + 1
              ).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`px-3 py-1 rounded ${currentPage === p
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(Math.ceil(categories.length / pageSize), p + 1)
                  )
                }
                disabled={
                  currentPage === Math.ceil(categories.length / pageSize)
                }
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
    
      {isModalOpen && editData && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-[600px] max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-xl font-semibold mb-4">
              {isEditMode ? "Edit Category" : "Category Details"}
            </h2>

            <div className="space-y-4">
              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editData.category_name}
                  onChange={(e) =>
                    handleFieldChange("category_name", e.target.value)
                  }
                  readOnly={!isEditMode}
                  className={`w-full border rounded p-2 mt-1 ${!isEditMode ? "bg-gray-100" : ""
                    }`}
                />
              </div>

              {/* Annual Recurring */}
              <div>
                <label className="block text-sm font-medium">
                  Annual Recurring
                </label>
                <Select
                  value={{
                    value: editData.recurrence_type ? "annual" : "monthly",
                    label: editData.recurrence_type ? "Annual" : "Monthly",
                  }}
                  options={[
                    { value: "Monthly", label: "Monthly" },
                    { value: "Annual", label: "Annual" },
                  ]}
                  isDisabled={!isEditMode}
                  onChange={(opt) =>
                    handleFieldChange("recurrence_type", opt.value === "annual")
                  }
                />
              </div>

              {/* Eligible Gender */}
              <div>
                <label className="block text-sm font-medium">
                  Eligible Gender
                </label>
                <Select
                  value={{
                    value: editData.eligible_gender,
                    label: editData.eligible_gender,
                  }}
                  options={[
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Both", label: "Both" },
                  ]}
                  isDisabled={!isEditMode}
                  onChange={(opt) =>
                    handleFieldChange("eligible_gender", opt.value)
                  }
                />
              </div>

              {/* Numeric Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Weight</label>
                  <input
                    type="number"
                    value={editData.weight}
                    onChange={(e) =>
                      handleFieldChange("weight", parseFloat(e.target.value))
                    }
                    readOnly={!isEditMode}
                    className={`w-full border rounded p-2 mt-1 ${!isEditMode ? "bg-gray-100" : ""
                      }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium">
                    Apply Before (days)
                  </label>
                  <input
                    type="number"
                    value={editData.apply_before_day}
                    onChange={(e) =>
                      handleFieldChange(
                        "apply_before_day",
                        parseInt(e.target.value, 10)
                      )
                    }
                    readOnly={!isEditMode}
                    className={`w-full border rounded p-2 mt-1 ${!isEditMode ? "bg-gray-100" : ""
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">No of Days</label>
                <input
                  type="number"
                  value={editData.no_of_days}
                  onChange={(e) =>
                    handleFieldChange(
                      "no_of_days",
                      parseInt(e.target.value, 10)
                    )
                  }
                  readOnly={!isEditMode}
                  className={`w-full border rounded p-2 mt-1 ${!isEditMode ? "bg-gray-100" : ""
                    }`}
                />
              </div>
              {/* Annual Recurring */}
              {/* Recurrence Type */}
              <div>
                <label className="block text-sm font-medium">Recurrence Type</label>
                <Select
                  value={
                    editData.recurrence_type
                      ? { value: editData.recurrence_type, label: editData.recurrence_type }
                      : { value: "Monthly", label: "Monthly" }
                  }
                  options={[
                    { value: "Monthly", label: "Monthly" },
                    { value: "Annual", label: "Annual" },
                  ]}
                  isDisabled={!isEditMode}
                  onChange={(opt) => handleFieldChange("recurrence_type", opt.value)}
                />
              </div>



              {/* Employment Types */}
              <div>
                <label className="block text-sm font-medium">Employment Types</label>
                {isEditMode ? (
                  <Select
                    isMulti
                    value={employmentTypes.filter((et) =>
                      editData.employment_type?.includes(et.value)
                    )}
                    options={employmentTypes}
                    onChange={(opts) =>
                      handleFieldChange(
                        "employment_type",
                        opts.map((o) => o.value) // collect selected IDs
                      )
                    }
                  />
                ) : (
                  <div className="w-full border rounded p-2 mt-1 bg-gray-100">
                    {editData.employment_type?.length > 0
                      ? employmentTypes
                        .filter((et) => editData.employment_type.includes(et.value))
                        .map((et) => et.label)
                        .join(", ")
                      : "—"}
                  </div>
                )}
              </div>


            </div>

            {/* Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleUpdateCategory}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditMode(false)}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
              )}
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CreateLeaveType;
