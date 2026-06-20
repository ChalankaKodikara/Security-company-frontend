import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";

const ServiceChargeComponentManagement = () => {
  const [serviceChargeData, setServiceChargeData] = useState([]);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success"); // "success" or "error"
  const [showPopup, setShowPopup] = useState(false);
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  

  // Fetch Service Charge Data
  const fetchServiceChargeData = async () => {
    const authToken = Cookies.get("auth_token");

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/serviceCharge/getServiceCharge`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`, // Add token to headers
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch. Status code: ${response.status}`);
      }

      const responseData = await response.json();

      // Validate response structure
      if (responseData.success && Array.isArray(responseData.data)) {
        setServiceChargeData(responseData.data); // Set the data array
      } else if (responseData.success && responseData.data) {
        setServiceChargeData([responseData.data]); // Wrap single object in an array
      } else {
        throw new Error("Unexpected response format.");
      }
    } catch (error) {
      console.error("Error fetching service charge data:", error.message);

      // Show error popup
      setPopupMessage("Failed to fetch service charge data. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  useEffect(() => {
    fetchServiceChargeData(); // Fetch data on component mount
  }, []);

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <div>
        <p className="text-[24px] font-semibold">Service Charge Management</p>

        {/* Table to display service charge details */}
        <table className="w-full border-collapse bg-white text-left text-sm text-gray-500">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 font-medium text-gray-900">Emp No</th>
              <th className="px-6 py-4 font-medium text-gray-900">Date</th>
              <th className="px-6 py-4 font-medium text-gray-900">Value</th>
              <th className="px-6 py-4 font-medium text-gray-900">Percentage</th>
              <th className="px-6 py-4 font-medium text-gray-900">
                Total Service Charge
              </th>
              <th className="px-6 py-4 font-medium text-gray-900">
                Employee Fullname
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 border-t border-gray-200">
            {serviceChargeData.map((serviceCharge) => (
              <tr key={serviceCharge.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{serviceCharge.employee_id}</td>
                <td className="px-6 py-4">
                  {new Date(serviceCharge.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">{serviceCharge.value}</td>
                <td className="px-6 py-4">{serviceCharge.percentage}</td>
                <td className="px-6 py-4">
                  {serviceCharge.total_service_charge}
                </td>
                <td className="px-6 py-4">{serviceCharge.employee_fullname}</td>
              </tr>
            ))}
          </tbody>
        </table>
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

export default ServiceChargeComponentManagement;
