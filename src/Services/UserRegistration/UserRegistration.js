/** @format */

import axios from "axios";
import Cookies from "js-cookie";

const API_URL = process.env.REACT_APP_FRONTEND_URL;

export const submitPersonalDetails = async (formData, token) => {
  const authToken = Cookies.get("accessToken");
  try {
    console.log(
      "Sending request to:",
      `${API_URL}/v1/hris/employees/employee/personal`
    );
    console.log("Token:", token ? "Present" : "Missing");
    console.log("FormData type:", typeof formData);

    const res = await axios.post(
      `${API_URL}/v1/hris/employees/employee/personal`,
      formData,
      {
        headers: {
          "Content-Type": "application/json", // Try JSON first
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("API Error Details:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        data: error.config?.data,
      },
    });
    throw error;
  }
};

/**
 * Update personal details using stored member_no
 */
export const updatePersonalDetails = async (formData, token) => {
  const memberNo = localStorage.getItem("member_no");

  if (!memberNo) {
    throw new Error("Member number not found. Cannot update details.");
  }

  try {
    const res = await axios.put(
      `${API_URL}/personalEmployment/updatePersonalEmploymentDetails/${memberNo}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const submitKinDetails = async (member_no, kinDetails, token) => {
  return await axios.post(
    `${API_URL}/personalEmployment/addNextOfKinDetails`,
    { member_no, kinDetails },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

export const uploadKinFiles = async (nicFileMap, token) => {
  const formData = new FormData();

  for (const nic in nicFileMap) {
    formData.append(nic, nicFileMap[nic]);
  }

  return await axios.post(
    `${API_URL}/personalEmployment/uploadNextOfKinFiles`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// Submit Official Employment Details
export const submitOfficialEmploymentDetails = async (formData, token) => {
  return await axios.post(
    `${API_URL}/personalEmployment/addofficialemploymentdetails`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// Update Official Employment Details
export const updateOfficialEmploymentDetails = async (formData, token) => {
  const memberNo = localStorage.getItem("member_no");
  if (!memberNo) {
    throw new Error("Member number not found. Cannot update official details.");
  }

  return await axios.put(
    `${API_URL}/personalEmployment/updateOfficialEmploymentDetails/${memberNo}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// Fetch Banks (with token)
export const fetchBankOptions = async (token) => {
  const res = await axios.get(`${API_URL}/banks`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const banks = res.data?.data || [];

  return banks.map((bank) => ({
    id: bank.id, // needed to fetch branches
    value: bank.bank_name,
    label: `${bank.bank_name} - ${bank.bank_code}`,
  }));
};

export const fetchBranchesByBank = async (bankId, token) => {
  const res = await axios.get(`${API_URL}/branch/bank/${bankId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data.map((branch) => ({
    id: branch.id, // 👈 Add this line to get branch_id
    value: branch.branch_code,
    label: `${branch.branch_name} - ${branch.branch_code}`,
  }));
};

// Fetch Edit Logs
export const fetchEditLogs = async (page = 1, limit = 5, token) => {
  try {
    const res = await axios.get(
      `${API_URL}/editLog/edit-logs?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    throw error;
  }
};
