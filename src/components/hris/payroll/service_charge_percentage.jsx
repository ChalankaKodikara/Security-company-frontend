import React, { useState, useEffect } from "react";
import Cookies from "js-cookie"; // Cookie handling for authentication

const Service_Charge_Percentage = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success"); // "success" or "error"
  const [showPopup, setShowPopup] = useState(false);

   const API_URL = process.env.REACT_APP_FRONTEND_URL;


  // Fetch Employee Data using GET request
  const fetchEmployeeData = async () => {
    const authToken = Cookies.get("auth_token"); // Assuming the auth token is stored as 'auth_token' in the cookies
    try {
      const response = await fetch(
        `${API_URL}/v1/hris/employees/getemployeebasicdetails`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`, // Add token to headers if available
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log(data); // Log data to inspect structure

      // Initialize employee service charge percentages to the default service charge rate
      const updatedEmployeeData = data.map((employee) => ({
        ...employee,
        percentage: "", // Default to empty or a default value
      }));
      setEmployeeData(updatedEmployeeData);
    } catch (error) {
      console.error("Error fetching employee data:", error.message);

      // Error Popup
      setPopupMessage("Failed to fetch employee data. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const handleRevenueChange = (event) => {
    setTotalRevenue(event.target.value);
  };

  // Handle individual service charge rate changes for each employee
  const handleServiceChargeRateChange = (empNo, event) => {
    const updatedEmployeeData = employeeData.map((employee) =>
      employee.employee_no === empNo
        ? { ...employee, percentage: event.target.value }
        : employee
    );
    setEmployeeData(updatedEmployeeData);
  };

  // Handle saving the data to the backend via POST request
  const handleSave = async () => {
    // Validate total revenue
    if (!totalRevenue || isNaN(totalRevenue) || parseFloat(totalRevenue) <= 0) {
      setPopupMessage("Please provide a valid total revenue.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    // Filter employees with valid percentages
    const employeesWithValidData = employeeData.filter(
      (employee) =>
        employee.percentage &&
        !isNaN(employee.percentage) &&
        parseFloat(employee.percentage) > 0
    );

    if (employeesWithValidData.length === 0) {
      setPopupMessage("Please provide valid percentages for employees.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    // Prepare the payload to send in the POST request
    const payload = {
      total_service_charge: parseFloat(totalRevenue), // Ensure totalRevenue is numeric
      employees: employeesWithValidData.map((employee) => ({
        employee_id: employee.employee_no, // Use employee_no as employee_id in the payload
        percentage: parseFloat(employee.percentage), // Convert to numeric
      })),
    };

    setIsSaving(true);

    // Perform the actual POST request to save data
    try {
      const authToken = Cookies.get("auth_token"); // Get auth token from cookies
      const response = await fetch(`${API_URL}/v1/hris/serviceCharge/addServiceCharge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload), // Send the payload as JSON
      });

      if (!response.ok) {
        throw new Error(`Failed to save data: ${response.status}`);
      }

      // Success handling
      setPopupMessage("Service Charge data saved successfully!");
      setPopupType("success");
      setShowPopup(true);

      // Reset fields on successful save
      setTotalRevenue("");
      setEmployeeData((prevData) =>
        prevData.map((employee) => ({
          ...employee,
          percentage: "", // Reset service charge rate
        }))
      );
    } catch (error) {
      console.error("Error saving service charge data:", error.message);

      // Error Popup
      setPopupMessage("Failed to save service charge data. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <div>
        <p className="text-[24px] font-semibold">Service Charge Management</p>

        {/* Revenue Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Total Revenue*
          </label>
          <input
            type="number"
            className="w-full px-4 py-2 border rounded-lg"
            placeholder="Enter Total Revenue"
            value={totalRevenue}
            onChange={handleRevenueChange}
          />
        </div>

        {/* Table to display employee details */}
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-900">Emp No</th>
              <th className="px-6 py-4 font-medium text-gray-900">Emp Name</th>
              <th className="px-6 py-4 font-medium text-gray-900">
                Service Charge Eligible Percentage
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-t border-gray-200">
            {employeeData.map((employee) => (
              <tr key={employee.employee_no} className="hover:bg-gray-50">
                <td className="px-6 py-4">{employee.employee_no}</td>
                <td className="px-6 py-4">{employee.employee_fullname}</td>{" "}
                {/* Ensure correct property names */}
                <td className="px-6 py-4">
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg"
                    value={employee.percentage}
                    onChange={(event) =>
                      handleServiceChargeRateChange(
                        employee.employee_no,
                        event
                      )
                    }
                    placeholder="Enter Percentage"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Save Button */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            type="button"
            className="px-4 py-2 bg-gray-300 rounded-lg"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Popup for success/error */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-[400px] relative">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-2 right-2 text-gray-500 text-xl"
            >
              &times;
            </button>

            <h2
              className={`text-center text-xl font-bold mb-4 ${
                popupType === "success" ? "text-green-500" : "text-red-500"
              }`}
            >
              {popupType === "success" ? "Success" : "Error"}
            </h2>

            <p className="text-center mb-4">{popupMessage}</p>

            <div className="flex justify-center">
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Service_Charge_Percentage;
