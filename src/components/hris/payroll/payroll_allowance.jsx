import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuUsers } from "react-icons/lu";
import { apiFetch } from "../../../utils/apiClient"; 
const PayrollAllowance = () => {
  const [cardData, setCardData] = useState([]);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_FRONTEND_URL;

  useEffect(() => {
    const fetchCardData = async () => {
      try {
        const response = await apiFetch(
          `${API_URL}/v1/hris/payroll/allowancesanddeductions?type=allowance`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCardData(data);
      } catch (error) {
        console.error("Error fetching card data:", error);
      }
    };

    fetchCardData();
  }, []);

  const handleCardClick = (actualColumnName, suggestedName, type) => {
    navigate("/allowance-component", {
      state: {
        actual_column_name: actualColumnName,
        suggested_name: suggestedName,
        type: type,
      },
    });
  };

  return (
    <div className="mx-5 mt-5 font-montserrat">
      <p className="text-[24px]">Payroll / Payroll Allowance</p>

      <div className="grid grid-cols-4 grid-flow-row gap-4">
        {cardData.map((item) => (
          <div
            key={item.id}
            className="shadow-lg p-5 rounded-md border-b-4 border-green-500"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-lg p-4 bg-blue-200 text-blue-600 text-2xl w-16 h-16">
                <LuUsers />
              </div>
            </div>

            <div className="mt-2">
              <p className="text-[18px] font-semibold">{item.suggested_name}</p>
              <div className="mt-2">
                <button
                  className="border border-blue-400 bg-white text-blue-400 p-2 rounded-lg text-[15px]"
                  onClick={() =>
                    handleCardClick(
                      item.actual_column_name,
                      item.suggested_name,
                      item.type // passing item.type
                    )
                  }
                >
                  Click Here
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayrollAllowance;
