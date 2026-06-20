/** @format */

import axios from "axios";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;

// Utility to get access token from cookies
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

const bankService = {
  getAllBanks: async (page, limit, bankName, bankCode) => {
    try {
      const token = getToken();
      let url = `${API_URL}/banks?page=${page}&pageSize=${limit}`;
      if (bankName) url += `&bankName=${bankName}`;
      if (bankCode) url += `&bankCode=${bankCode}`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching banks:", error);
      toast.error(`Failed to fetch banks: ${error.message}`);
      throw error;
    }
  },

  getBankById: async (id) => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/banks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching bank:", error);
      toast.error(`Failed to fetch bank: ${error.message}`);
      throw error;
    }
  },

  createBank: async (formData) => {
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/banks`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error("Error creating bank:", error);
      toast.error(`Failed to create bank: ${error.message}`);
      throw error;
    }
  },

  updateBank: async (id, formData) => {
    try {
      const token = getToken();
      const response = await axios.put(`${API_URL}/banks/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error(`Error updating bank ${id}:`, error);
      toast.error(`Failed to update bank: ${error.message}`);
      throw error;
    }
  },

  deleteBank: async (id) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/banks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error(`Error deleting bank ${id}:`, error);
      toast.error(`Failed to delete bank: ${error.message}`);
      throw error;
    }
  },
  getAllBanksForDropdown: async () => {
    try {
      const token = getToken();
      let url = `${API_URL}/banks/without-pagination`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching banks:", error);
      toast.error(`Failed to fetch banks: ${error.message}`);
      throw error;
    }
  },
};

export default bankService;
