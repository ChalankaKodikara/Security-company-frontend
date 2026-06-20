import React, { useState, useEffect } from "react";
import {
  FaFileInvoiceDollar,
  FaPlus,
  FaTimes,
  FaUsers,
  FaClock,
  FaCalendar,
} from "react-icons/fa";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import usePermissions from "../../permissions/permission";
import { apiFetch } from "../../../utils/apiClient";
const OTManagement = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({
    organization_id: "",
    category_code: "",
    category_name: "",
    description: "",
    employment_type: "",
    ot_rate: "",
    holiday_rate: "",
    poya_rate: "",
    max_ot_hours_per_week: "",
    max_ot_hours_per_month: "",
    settlement_type: "",
    payroll_component_code: "",
    hourly_divisor: 240,
    is_active: 1,
    effective_from: "",
    payroll_type: "",
    employees: [],
  });
  const [organizations, setOrganizations] = useState([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;
  const navigate = useNavigate();
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [popupMode, setPopupMode] = useState("add"); // add | view | edit
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const { hasPermission } = usePermissions();

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  };

  const handleViewCategory = async (categoryId) => {
    setPopupMode("view");
    setShowPopup(true);
    setViewLoading(true);
    setEditingCategoryId(categoryId);

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/overtime/category-master/${categoryId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const { master, employees } = result.data;

        const selectedOrg = organizations.find(
          (org) => org.value === master.organization_id,
        );

        setFormData({
          organization_id: selectedOrg?.value || "",
          category_code: master.category_code,
          category_name: master.category_name,
          description: master.description || "",
          employment_type: master.employment_type,
          ot_rate: master.ot_rate,
          holiday_rate: master.holiday_rate,
          poya_rate: master.poya_rate,
          max_ot_hours_per_week: master.max_ot_hours_per_week,
          max_ot_hours_per_month: master.max_ot_hours_per_month,
          settlement_type: master.settlement_type,
          payroll_component_code: master.payroll_component_code,
          hourly_divisor: master.hourly_divisor,
          is_active: master.is_active,
          effective_from: employees?.[0]?.effective_from || "",
          payroll_type: master.payroll_type,
          employees: employees.map((e) => e.employee_no),
        });

        setEmployeeOptions(
          employees.map((e) => ({
            value: e.employee_no,
            label: `${e.employee_no} - ${e.employee_fullname}`,
          })),
        );
      } else {
        toast.error("Failed to load category details");
        handleClosePopup();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading category");
      handleClosePopup();
    } finally {
      setViewLoading(false);
    }
  };

  const fetchEmployees = async (searchText = "") => {
    if (!searchText || searchText.length < 2) {
      setEmployeeOptions([]);
      return;
    }

    setLoadingEmployees(true);
    try {
      const userToken = getCookie("accessToken");

      const response = await apiFetch(
        `${API_URL}/v1/hris/employees/employee/all-details?search=${encodeURIComponent(searchText)}`,
        {
          method: "GET",
          credentials: "include",
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        const options = result.data.map((emp) => ({
          value: emp.employee_no,
          label: `${emp.employee_no} - ${emp.employee_fullname} (${emp.department_name})`,
        }));

        setEmployeeOptions(options);
      }
    } catch (error) {
      console.error("Failed to fetch employees", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchCategories = async (orgId) => {
    if (!orgId) {
      setCategories([]);
      return;
    }

    setLoadingCategories(true);
    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/overtime/category-master?organization_id=${orgId}`,
        {
          method: "GET",
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        setCategories(result.data);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error("Failed to fetch categories", error);
      setCategories([]);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    const fetchOrganizations = async () => {
      setLoadingOrganizations(true);
      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/organizations/organization`,
          {
            method: "GET",
          },
        );

        const result = await response.json();

        if (response.ok && result.success) {
          const options = result.data.map((org) => ({
            value: org.id,
            label: `${org.code} - ${org.organization_name}`,
          }));
          setOrganizations(options);
        }
      } catch (error) {
        console.error("Failed to fetch organizations", error);
      } finally {
        setLoadingOrganizations(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/overtime/category-master/${categoryToDelete.id}`,
        {
          method: "DELETE",
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("OT Category deleted successfully");

        // Refresh list
        if (selectedOrganization) {
          fetchCategories(selectedOrganization.value);
        }
      } else {
        toast.error(result.message || "Failed to delete OT Category");
      }
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("An error occurred while deleting");
    } finally {
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    }
  };

  const handleOrganizationChange = (selectedOption) => {
    setSelectedOrganization(selectedOption);
    if (selectedOption) {
      fetchCategories(selectedOption.value);
    } else {
      setCategories([]);
    }
  };

  const cards = [
    {
      title: "OT Assignment",
      label: "Assigned Employees for OT",
      gradient: "from-blue-500 to-indigo-600",
      icon: <FaFileInvoiceDollar className="text-white text-3xl" />,
      onClick: () => navigate("/ot-assignment"),
      description: "Assign employees for overtime work",
      permission: 1028,
    },
    {
      title: "OT Authorization",
      label: "Authorize Employees for OT",
      gradient: "from-purple-500 to-pink-600",
      icon: <FaFileInvoiceDollar className="text-white text-3xl" />,
      onClick: () => navigate("/ot-authorization"),
      description: "Authorize overtime for assigned employees",
      permission: 1029,
    },
    {
      title: "OT Verification",
      label: "Verify Employees for OT",
      gradient: "from-slate-500 to-slate-600",
      icon: <FaFileInvoiceDollar className="text-white text-3xl" />,
      onClick: () => navigate("/ot-verification"),
      description: "Verify overtime for authorized employees",
      permission: 1030,
    },
  ];

  const employmentTypeOptions = [
    { value: "SHOP_OFFICE", label: "Shop Office" },
    { value: "WAGES_BOARD", label: "Wages Board" },
    { value: "PUBLIC", label: "Public" },
  ];

  const settlementTypeOptions = [
    { value: "PAY", label: "Pay" },
    { value: "COMP_OFF", label: "Comp Off" },
    { value: "BOTH", label: "Both" },
  ];

  const payrollTypeOptions = [
    { value: "INCENTIVE", label: "Incentive" },
    { value: "MONTHEND", label: "Month End" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name, selectedOption) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleEmployeesChange = (selectedOptions) => {
    const employeeIds = selectedOptions
      ? selectedOptions.map((opt) => opt.value)
      : [];
    setFormData((prev) => ({
      ...prev,
      employees: employeeIds,
    }));
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      ot_rate: parseFloat(formData.ot_rate),
      holiday_rate: parseFloat(formData.holiday_rate),
      poya_rate: parseFloat(formData.poya_rate),
      max_ot_hours_per_week: parseInt(formData.max_ot_hours_per_week),
      max_ot_hours_per_month: parseInt(formData.max_ot_hours_per_month),
      hourly_divisor: parseInt(formData.hourly_divisor),
    };

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/overtime/category-master`,
        {
          method: "POST",

          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("OT Category created successfully");
        handleClosePopup();

        setFormData({
          organization_id: "",
          category_code: "",
          category_name: "",
          description: "",
          employment_type: "",
          ot_rate: "",
          holiday_rate: "",
          poya_rate: "",
          max_ot_hours_per_week: "",
          max_ot_hours_per_month: "",
          settlement_type: "",
          payroll_component_code: "",
          hourly_divisor: 240,
          is_active: 1,
          effective_from: "",
          payroll_type: "",
          employees: [],
        });

        // Refresh categories if organization is selected
        if (selectedOrganization) {
          fetchCategories(selectedOrganization.value);
        }
      } else {
        toast.error(result.message || "Failed to create OT Category");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred");
    }
  };
  const handleUpdate = async () => {
    if (!editingCategoryId) {
      toast.error("Invalid category");
      return;
    }

    const payload = {
      category_code: formData.category_code,
      category_name: formData.category_name,
      description: formData.description,
      employment_type: formData.employment_type,
      ot_rate: Number(formData.ot_rate),
      holiday_rate: Number(formData.holiday_rate),
      poya_rate: Number(formData.poya_rate),
      max_ot_hours_per_week: Number(formData.max_ot_hours_per_week),
      max_ot_hours_per_month: Number(formData.max_ot_hours_per_month),
      settlement_type: formData.settlement_type,
      payroll_type: formData.payroll_type,
      payroll_component_code: formData.payroll_component_code,
      hourly_divisor: Number(formData.hourly_divisor),
      is_active: formData.is_active,
      effective_from: formData.effective_from,
      employees: formData.employees, // employee_no array
    };

    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/overtime/category-master/${editingCategoryId}`,
        {
          method: "PUT",

          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success("OT Category updated successfully");

        handleClosePopup();

        // Refresh category list
        if (selectedOrganization) {
          fetchCategories(selectedOrganization.value);
        }
      } else {
        toast.error(result.message || "Failed to update category");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating category");
    }
  };

  const handleClosePopup = () => {
    setShowPopup(false); //  CLOSE modal
    setPopupMode("add"); // reset mode
    setViewLoading(false); // safety

    setFormData({
      organization_id: "",
      category_code: "",
      category_name: "",
      description: "",
      employment_type: "",
      ot_rate: "",
      holiday_rate: "",
      poya_rate: "",
      max_ot_hours_per_week: "",
      max_ot_hours_per_month: "",
      settlement_type: "",
      payroll_component_code: "",
      hourly_divisor: 240,
      is_active: 1,
      effective_from: "",
      payroll_type: "",
      employees: [],
    });

    setEmployeeOptions([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-3xl mb-3 font-semibold text-gray-800">
            OT Management
          </h1>
          <p className="text-gray-600 text-lg">
            Manage overtime assignment and authorization
          </p>
        </div>
        <button
          onClick={() => setShowPopup(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium"
        >
          <FaPlus />
          <span>Add OT Category</span>
        </button>
      </div>

      {/* Organization Filter */}
      <div className="mb-8 bg-white rounded-2xl p-6 shadow-lg">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Select Organization to View Categories
        </label>
        <Select
          options={organizations}
          isLoading={loadingOrganizations}
          onChange={handleOrganizationChange}
          value={organizations.find(
            (o) => o.value === formData.organization_id,
          )}
          placeholder="Select an organization..."
          isClearable
          className="react-select-container"
          classNamePrefix="react-select"
          isDisabled={popupMode === "view"}
        />
      </div>

      {/* Categories List */}
      {selectedOrganization && (
        <div className="mb-10">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            OT Categories
            {categories.length > 0 && (
              <span className="ml-3 text-sm font-normal text-gray-500">
                ({categories.length}{" "}
                {categories.length === 1 ? "category" : "categories"})
              </span>
            )}
          </h2>

          {loadingCategories ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="mt-4 text-gray-600">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No Categories Found
              </h3>
              <p className="text-gray-500">
                Create your first OT category to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-800">
                            {category.category_name}
                          </h3>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {category.category_code}
                          </span>
                          {category.is_active ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                              Inactive
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {category.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleViewCategory(category.id)}
                          className="px-4 py-2 text-sm font-semibold text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          View
                        </button>

                        <button
                          onClick={() => {
                            setCategoryToDelete(category);
                            setShowDeleteConfirm(true);
                          }}
                          className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <FaUsers className="text-blue-600" />
                          <p className="text-xs text-gray-600 font-medium">
                            Employees
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {category.employee_count}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Employment Type
                        </p>
                        <p className="text-sm font-bold text-purple-700">
                          {category.employment_type}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          OT Rate
                        </p>
                        <p className="text-xl font-bold text-green-700">
                          {category.ot_rate}x
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Holiday Rate
                        </p>
                        <p className="text-xl font-bold text-orange-700">
                          {category.holiday_rate}x
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Poya Rate
                        </p>
                        <p className="text-xl font-bold text-pink-700">
                          {category.poya_rate}x
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Settlement
                        </p>
                        <p className="text-sm font-bold text-indigo-700">
                          {category.settlement_type}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Max Weekly Hours
                        </p>
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          <FaClock className="text-gray-400" />
                          {category.max_ot_hours_per_week}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Max Monthly Hours
                        </p>
                        <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                          <FaCalendar className="text-gray-400" />
                          {category.max_ot_hours_per_month}h
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Payroll Type
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {category.payroll_type || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Hourly Divisor
                        </p>
                        <p className="text-sm font-semibold text-gray-700">
                          {category.hourly_divisor}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cards Grid */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards
            .filter((card) => hasPermission(card.permission))
            .map((card, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer"
                onClick={card.onClick}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative p-6 z-10">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div
                        className={`relative bg-gradient-to-br ${card.gradient} p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        {card.icon}
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-2">
                      <svg
                        className="w-6 h-6 text-gray-400 group-hover:text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-800 group-hover:text-white transition-colors duration-300 mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300 mb-4">
                    {card.description}
                  </p>
                  <div className="mb-4 p-3 bg-gray-50 group-hover:bg-white/20 rounded-xl transition-colors duration-300">
                    <p className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 font-medium">
                      {card.label}
                    </p>
                  </div>
                  <button className="w-full bg-blue-500 text-white rounded-xl px-6 py-3 shadow-lg flex items-center justify-center gap-2">
                    <span>View</span>
                    <svg
                      className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center z-10">
              <h2 className="text-2xl font-bold">
                {popupMode === "view"
                  ? "View OT Category"
                  : popupMode === "edit"
                    ? "Edit OT Category"
                    : "Add OT Category"}
              </h2>

              <div className="flex items-center gap-3">
                {popupMode === "view" && (
                  <button
                    onClick={() => setPopupMode("edit")}
                    className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Edit
                  </button>
                )}

                <button
                  onClick={handleClosePopup}
                  className="hover:bg-white/20 p-2 rounded-lg transition-colors"
                >
                  <FaTimes size={22} />
                </button>
              </div>
            </div>

            {/* Popup Form */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization *
                  </label>
                  <Select
                    options={organizations}
                    value={organizations.find(
                      (org) => org.value === formData.organization_id,
                    )}
                    onChange={(option) =>
                      setFormData((prev) => ({
                        ...prev,
                        organization_id: option ? option.value : "",
                      }))
                    }
                    placeholder="Select organization"
                    isDisabled={popupMode === "view"}
                    classNamePrefix="react-select"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Category Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    name="category_code"
                    value={formData.category_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Unique OT category code"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Category Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    name="category_name"
                    value={formData.category_name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Display name"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                    placeholder="Enter description"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Employment Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employment Type *
                  </label>
                  <Select
                    options={employmentTypeOptions}
                    value={employmentTypeOptions.find(
                      (opt) => opt.value === formData.employment_type,
                    )}
                    onChange={(option) =>
                      handleSelectChange("employment_type", option)
                    }
                    isDisabled={popupMode === "view"}
                    classNamePrefix="react-select"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* OT Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OT Rate *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="ot_rate"
                    value={formData.ot_rate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Normal OT multiplier (e.g. 1.5x)"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Holiday Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Holiday Rate *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="holiday_rate"
                    value={formData.holiday_rate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Holiday OT multiplier (e.g. 2.0x)"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Poya Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poya Rate *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="poya_rate"
                    value={formData.poya_rate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Poya day OT multiplier"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Max OT Hours Per Week */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max OT Hours Per Week *
                  </label>
                  <input
                    type="number"
                    name="max_ot_hours_per_week"
                    value={formData.max_ot_hours_per_week}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Max allowed OT hours per week"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Max OT Hours Per Month */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max OT Hours Per Month *
                  </label>
                  <input
                    type="number"
                    name="max_ot_hours_per_month"
                    value={formData.max_ot_hours_per_month}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Max allowed OT hours per month"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Settlement Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Settlement Type
                  </label>
                  <Select
                    options={settlementTypeOptions}
                    value={settlementTypeOptions.find(
                      (opt) => opt.value === formData.settlement_type,
                    )}
                    onChange={(option) =>
                      handleSelectChange("settlement_type", option)
                    }
                    placeholder="Select settlement type"
                    isDisabled={popupMode === "view"}
                    classNamePrefix="react-select"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Payroll Component Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payroll Component Code *
                  </label>
                  <input
                    type="text"
                    name="payroll_component_code"
                    value={formData.payroll_component_code}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="e.g., OT_NORMAL"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Hourly Divisor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Divisor *
                  </label>
                  <input
                    type="number"
                    name="hourly_divisor"
                    value={formData.hourly_divisor}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Monthly working hours (e.g. 30×8)"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Effective From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Effective From *
                  </label>
                  <input
                    type="date"
                    name="effective_from"
                    value={formData.effective_from}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Payroll Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payroll Type
                  </label>
                  <Select
                    options={payrollTypeOptions}
                    value={payrollTypeOptions.find(
                      (opt) => opt.value === formData.payroll_type,
                    )}
                    onChange={(option) =>
                      handleSelectChange("payroll_type", option)
                    }
                    placeholder="Select payroll type"
                    isDisabled={popupMode === "view"}
                    classNamePrefix="react-select"
                    disabled={popupMode === "view"}
                  />
                </div>

                {/* Employees Multi-Select */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employees *
                  </label>
                  <Select
                    isMulti
                    isDisabled={popupMode === "view"}
                    options={employeeOptions}
                    value={employeeOptions.filter((opt) =>
                      formData.employees.includes(opt.value),
                    )}
                    onChange={handleEmployeesChange}
                    /*  THIS IS THE FIX */
                    onInputChange={(inputValue, { action }) => {
                      if (action === "input-change") {
                        fetchEmployees(inputValue);
                      }
                    }}
                    placeholder="Search employees by name / employee no"
                    noOptionsMessage={() => "Type at least 2 characters"}
                    filterOption={null} // keep this since backend search
                    classNamePrefix="react-select"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  className="bg-red-500 text-white p-2 rounded-md"
                  onClick={handleClosePopup}
                >
                  Close
                </button>

                {popupMode === "add" && (
                  <button
                    className="bg-blue-500 text-white p-2 rounded-md"
                    onClick={handleSubmit}
                  >
                    Create Category
                  </button>
                )}

                {popupMode === "edit" && (
                  <button
                    className="bg-blue-500 text-white p-2 rounded-md"
                    onClick={handleUpdate}
                  >
                    Update Category
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
      />
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Confirm Delete
              </h3>

              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the OT category
                <span className="font-semibold text-gray-800">
                  {" "}
                  “{categoryToDelete?.category_name}”
                </span>
                ?
                <br />
                <span className="text-sm text-red-600">
                  This action cannot be undone.
                </span>
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setCategoryToDelete(null);
                  }}
                  className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteCategory}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OTManagement;
