/** @format */

import React, { useEffect, useState } from "react";
import { FaEdit } from "react-icons/fa";
import Cookies from "js-cookie";
import { apiFetch } from "../../../../utils/apiClient"
const ViewLeaveTable = () => {
  const [leaveCategories, setLeaveCategories] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(leaveCategories.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = leaveCategories.slice(indexOfFirstItem, indexOfLastItem);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Fetch leave categories data
  const fetchLeaveCategories = async () => {
    const token = Cookies.get("accessToken");
    try {
      const response = await apiFetch(
        `${API_URL}/v1/hris/leave/getLeaveCategory`,
        {
          credentials: "include",
        }
      );
      const result = await response.json();
      if (result.success) {
        setLeaveCategories(result.data);
      } else {
        console.error("Failed to fetch leave categories:", result.message);
      }
    } catch (error) {
      console.error("Error fetching leave categories:", error);
    }
  };

  // Fetch employment types data
  const fetchEmploymentTypes = async () => {
    const token = Cookies.get("accessToken");
    try {
      const response = await apiFetch(`${API_URL}/v1/hris/employmentType/all`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        const typesMap = {};
        result.data.forEach((type) => {
          typesMap[type.id] = type.employment_type_name;
        });
        setEmploymentTypes(typesMap);
      } else {
        console.error("Failed to fetch employment types:", result.message);
      }
    } catch (error) {
      console.error("Error fetching employment types:", error);
    }
  };

  useEffect(() => {
    fetchLeaveCategories();
    fetchEmploymentTypes();
  }, []);

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
  };

  const handleSave = () => {
    console.log("Saving category:", selectedCategory);
    closeModal();
  };

  return (
    <div className="font-montserrat">
      <p className="text-[24px]">
        Leave Management Settings / Leave Allocation /{" "}
        <span className="font-semibold">Table View</span>
      </p>

      <div className="mt-5 bg-white shadow p-2 rounded-xl">
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-4 font-medium text-gray-900">
                Leave Type
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Employment Type
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">
                No. of Days
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Apply Before (days)
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">Gender</th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Nationality
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">Religion</th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Leave Weight
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">Per</th>
              <th className="px-3 py-4 font-medium text-gray-900">Month-Day</th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Half Day Allowed
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Exclude Holidays
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Encash Option
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Maximum Encash Days
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">
                Minimum Days to Apply
              </th>
              <th className="px-3 py-4 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-t border-gray-200">
            {currentItems.length > 0 ? (
              currentItems.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4">{category.category_name}</td>
                  <td className="px-3 py-4">
                    {category.eligible_employeement_type &&
                    category.eligible_employeement_type.length > 0
                      ? category.eligible_employeement_type
                          .map((emp) => emp.name)
                          .join(", ")
                      : "Unknown"}
                  </td>
                  <td className="px-3 py-4">{category.no_of_days}</td>
                  <td className="px-3 py-4">{category.apply_before_day}</td>
                  <td className="px-3 py-4">{category.eligible_gender}</td>
                  <td className="px-3 py-4">
                    {Array.isArray(category.eligible_country)
                      ? category.eligible_country.join(", ")
                      : "Unknown"}
                  </td>

                  <td className="px-3 py-4">
                    {Array.isArray(category.eligible_region)
                      ? category.eligible_region.join(", ")
                      : "Unknown"}
                  </td>

                  <td className="px-3 py-4">{category.weight || "-"}</td>
                  <td className="px-3 py-4">{category.per || "Year"}</td>
                  <td className="px-3 py-4">
                    {category.reset_month_day || "-"}
                  </td>
                  <td className="px-3 py-4">
                    {category.half_day_allowed ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-4">
                    {category.exclude_holidays ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-4">
                    {category.encash_option ? "Yes" : "No"}
                  </td>
                  <td className="px-3 py-4">
                    {category.maximum_encash_days || "-"}
                  </td>
                  <td className="px-3 py-4">
                    {category.minimum_days_to_apply || "Not Applicable"}
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex items-center gap-6">
                      <div
                        className="rounded-lg bg-orange-300 p-2 text-orange-600 cursor-pointer"
                        onClick={() => handleEdit(category)}
                      >
                        <FaEdit />
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="16" className="text-center py-4">
                  No leave categories available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex justify-center mt-4">
          <ul className="flex space-x-2">
            <li
              className={`px-3 py-1 border rounded cursor-pointer ${
                currentPage === 1
                  ? "bg-gray-200 text-gray-400"
                  : "bg-gray-100 text-black"
              }`}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Previous
            </li>
            {[...Array(totalPages).keys()]
              .slice(
                Math.max(currentPage - 3, 0),
                Math.min(currentPage + 2, totalPages)
              )
              .map((page) => (
                <li
                  key={page}
                  className={`px-3 py-1 border rounded cursor-pointer ${
                    currentPage === page + 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-black"
                  }`}
                  onClick={() => handlePageChange(page + 1)}
                >
                  {page + 1}
                </li>
              ))}
            <li
              className={`px-3 py-1 border rounded cursor-pointer ${
                currentPage === totalPages
                  ? "bg-gray-200 text-gray-400"
                  : "bg-gray-100 text-black"
              }`}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Next
            </li>
          </ul>
        </div>
      </div>

      {/* Modal for editing */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-md w-3/4">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Update Leave Type
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label>Leave Type</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={selectedCategory.category_name || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      category_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>No. of Days</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={selectedCategory.no_of_days || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      no_of_days: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Apply Before (days)</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={selectedCategory.apply_before_day || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      apply_before_day: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Gender</label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedCategory.eligible_gender || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      eligible_gender: e.target.value,
                    })
                  }
                >
                  <option value="Both">Both</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label>Nationality</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={selectedCategory.eligible_country.join(", ") || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      eligible_country: e.target.value.split(","),
                    })
                  }
                />
              </div>
              <div>
                <label>Religion</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={selectedCategory.eligible_region.join(", ") || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      eligible_region: e.target.value.split(","),
                    })
                  }
                />
              </div>
              <div>
                <label>Leave Weight</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={selectedCategory.weight || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      weight: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Per</label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedCategory.per || "Year"}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      per: e.target.value,
                    })
                  }
                >
                  <option value="Year">Year</option>
                  <option value="Month">Month</option>
                </select>
              </div>
              <div>
                <label>Half Day Allowed</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      name="halfDay"
                      value="Yes"
                      checked={selectedCategory.half_day_allowed === true}
                      onChange={() =>
                        setSelectedCategory({
                          ...selectedCategory,
                          half_day_allowed: true,
                        })
                      }
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="halfDay"
                      value="No"
                      checked={selectedCategory.half_day_allowed === false}
                      onChange={() =>
                        setSelectedCategory({
                          ...selectedCategory,
                          half_day_allowed: false,
                        })
                      }
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label>Exclude Holidays</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      name="excludeHolidays"
                      value="Yes"
                      checked={selectedCategory.exclude_holidays === true}
                      onChange={() =>
                        setSelectedCategory({
                          ...selectedCategory,
                          exclude_holidays: true,
                        })
                      }
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="excludeHolidays"
                      value="No"
                      checked={selectedCategory.exclude_holidays === false}
                      onChange={() =>
                        setSelectedCategory({
                          ...selectedCategory,
                          exclude_holidays: false,
                        })
                      }
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label>Encash Option</label>
                <div className="flex gap-4">
                  <label>
                    <input
                      type="radio"
                      name="encashOption"
                      value="Yes"
                      checked={selectedCategory.encash_option === true}
                      onChange={() =>
                        setSelectedCategory({
                          ...selectedCategory,
                          encash_option: true,
                        })
                      }
                    />
                    Yes
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="encashOption"
                      value="No"
                      checked={selectedCategory.encash_option === false}
                      onChange={() =>
                        setSelectedCategory({
                          ...selectedCategory,
                          encash_option: false,
                        })
                      }
                    />
                    No
                  </label>
                </div>
              </div>
              <div>
                <label>Maximum Encash Days</label>
                <input
                  type="number"
                  className="w-full border rounded p-2"
                  value={selectedCategory.maximum_encash_days || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      maximum_encash_days: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label>Minimum Days to Apply</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={selectedCategory.minimum_days_to_apply || ""}
                  onChange={(e) =>
                    setSelectedCategory({
                      ...selectedCategory,
                      minimum_days_to_apply: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewLeaveTable;
