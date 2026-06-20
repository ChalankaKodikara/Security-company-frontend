import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { Plus, DollarSign, X, CheckCircle, AlertCircle, Loader } from "lucide-react";

const SalaryComponentManagement = () => {
  const [tableData, setTableData] = useState([]);
  const [currencyData, setCurrencyData] = useState([]);
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false);
  const [isAddCurrencyPopupOpen, setIsAddCurrencyPopupOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [suggestedName, setSuggestedName] = useState("");
  const [valueType, setValueType] = useState("");
  const [actualColumnName, setActualColumnName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("success");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState("");

  const API_URL = process.env.REACT_APP_FRONTEND_URL || "https://api.example.com";

  const toggleAddPopup = () => setIsAddPopupOpen(!isAddPopupOpen);
  const toggleAddCurrencyPopup = () => setIsAddCurrencyPopupOpen(!isAddCurrencyPopupOpen);

  const fetchTableData = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/hris/payroll/columns`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error("Error fetching table data:", error.message);
      setPopupMessage("Failed to fetch salary components. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  const fetchCurrencyData = async () => {
    try {
      const response = await fetch(`${API_URL}/v1/hris/currency/list`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setCurrencyData(data.data);
    } catch (error) {
      console.error("Error fetching currency data:", error.message);
      setPopupMessage("Failed to fetch currency components. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    }
  };

  useEffect(() => {
    fetchTableData();
    fetchCurrencyData();
  }, []);

  const handleCurrencyChange = (event) => {
    setSelectedCurrency(event.target.value);
  };

  const handleTypeChange = async (event) => {
    const selectedValue = event.target.value;
    setSelectedType(selectedValue);

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/payroll/getRemainingColumns?type=${selectedValue.toLowerCase()}`
      );
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
      const data = await response.json();
      setActualColumnName(data.next_column);
    } catch (error) {
      console.error("Error fetching actual column name:", error.message);
    }
  };
  const handleSave = async () => {
    const payload = {
      suggested_name: suggestedName.trim(),
      actual_column_name: actualColumnName,
      type: valueType,
    };

    setIsSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/v1/hris/payroll/column-suggestions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        setPopupMessage("Salary component added successfully!");
        setPopupType("success");
        setShowPopup(true);
        setIsAddPopupOpen(false);

        setTimeout(() => {
          window.location.reload();
        }, 1200);
      }
    } catch (error) {
      setPopupMessage("Failed to add salary component.");
      setPopupType("error");
      setShowPopup(true);
    } finally {
      setIsSaving(false);
    }
  };



  const handleCurrencySave = async () => {
    if (!selectedCurrency) {
      setPopupMessage("Please select a currency before saving.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    const selectedCurrencyData = currencyData.find(
      (currency) => currency.symbol === selectedCurrency
    );

    if (!selectedCurrencyData) {
      setPopupMessage("Invalid currency selection.");
      setPopupType("error");
      setShowPopup(true);
      return;
    }

    const postData = {
      currency: selectedCurrencyData.currency,
      symbol: selectedCurrencyData.symbol,
    };

    try {
      setIsSaving(true);

      const response = await fetch(`${API_URL}/v1/hris/currency/update/1`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        Cookies.set("currency", postData.currency);
        Cookies.set("symbol", postData.symbol);
        setPopupMessage("Currency updated successfully!");
        setPopupType("success");
        setShowPopup(true);
        toggleAddCurrencyPopup();
      } else {
        const errorText = await response.text();
        setPopupMessage(`Failed to update currency: ${errorText}`);
        setPopupType("error");
        setShowPopup(true);
      }
    } catch (error) {
      console.error("Error saving currency:", error);
      setPopupMessage("Failed to update currency. Please try again.");
      setPopupType("error");
      setShowPopup(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold  from-blue-600 to-blue-600">
            Salary Component Management
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
            onClick={toggleAddCurrencyPopup}
          >
            <DollarSign className="w-5 h-5" />
            <span>Change Currency</span>
          </button>
          <button
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
            onClick={toggleAddPopup}
          >
            <Plus className="w-5 h-5" />
            <span>Add Component</span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-blue-50 border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">NO</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Component Name</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Component Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-slate-700">Value Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gradient-to-r hover:from-cyan-50 hover:to-blue-50 transition-all duration-200">
                    <td className="px-6 py-4 text-slate-600 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">{item.suggested_name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.actual_column_name.startsWith("allowance")
                        ? "bg-green-100 text-green-700"
                        : item.actual_column_name.startsWith("deduction")
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                        }`}>
                        {item.actual_column_name.startsWith("allowance")
                          ? "Allowance"
                          : item.actual_column_name.startsWith("deduction")
                            ? "Deduction"
                            : "Unknown"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Success/Error Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6 relative animate-scaleIn">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex flex-col items-center text-center">
              {popupType === "success" ? (
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
              )}

              <h2 className={`text-2xl font-bold mb-2 ${popupType === "success" ? "text-green-600" : "text-red-600"
                }`}>
                {popupType === "success" ? "Success!" : "Error"}
              </h2>

              <p className="text-slate-600 mb-6">{popupMessage}</p>

              <button
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                onClick={() => setShowPopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Salary Component Modal */}
      {isAddPopupOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-[550px] p-8 animate-scaleIn">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-6 text-center">
              Add Salary Component
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Component Name*
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all outline-none"
                  placeholder="Enter component name"
                  value={suggestedName}
                  onChange={(e) => setSuggestedName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Component Type*
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all outline-none"
                  onChange={handleTypeChange}
                  value={selectedType}
                >
                  <option value="">Select the Type</option>
                  <option value="Allowance">Allowance</option>
                  <option value="Deduction">Deduction</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Value Type*
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100 transition-all outline-none"
                  onChange={(e) => setValueType(e.target.value)}
                  value={valueType}
                >
                  <option value="">Select the Value Type</option>
                  <option value="Amount">Amount</option>
                  <option value="Rate">Rate</option>
                </select>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <button
                  type="button"
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all duration-300"
                  onClick={toggleAddPopup}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Currency Modal */}
      {isAddCurrencyPopupOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-[550px] p-8 animate-scaleIn">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent mb-6 text-center">
              Change Currency
            </h2>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Currency*
                </label>
                <select
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                  value={selectedCurrency || Cookies.get("symbol") || ""}
                  onChange={handleCurrencyChange}
                >
                  {currencyData.length > 0 ? (
                    currencyData.map((currency) => (
                      <option key={currency.symbol} value={currency.symbol}>
                        {currency.currency} - {currency.symbol}
                      </option>
                    ))
                  ) : (
                    <option disabled>No Currency types</option>
                  )}
                </select>
              </div>
              <div className="flex justify-center gap-4 pt-4">
                <button
                  type="button"
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-all duration-300"
                  onClick={toggleAddCurrencyPopup}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center gap-2"
                  onClick={handleCurrencySave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SalaryComponentManagement;