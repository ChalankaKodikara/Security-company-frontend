import axios from 'axios';
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;

// Utility to get access token from cookies
const getToken = () =>
  document.cookie.split("; ").find(row => row.startsWith("accessToken="))?.split("=")[1];

const branchService = {
    // getAllBanks: async (page, limit) => {
    //     try {
    //       const response = await axios.get(`${API_URL}/banks?page=${page}&pageSize=${limit}`);
    //       console.log("API Response:", response);
    //       return response.data;
    //     } catch (error) {
    //       console.error("Error fetching data:", error);
    //       toast.error(`Failed to fetch data: ${error.message}`);
    //       throw error;
    //     }
    //   },
 getAllBranches: async (branchName, bankCode, branchCode, bankName, page, pageSize) => {
    try {
        const token = getToken();
        const params = new URLSearchParams();

        params.append('page', page);
        params.append('pageSize', pageSize);

        if (branchName) {
            params.append('branchName', branchName);
        }
        if (bankCode) {
            params.append('bankCode', bankCode);
        }
        if (branchCode) {
            params.append('branchCode', branchCode);
        }
        if (bankName) {
            params.append('bankName', bankName);
        }

        const queryString = params.toString();
        let url = `${API_URL}/branch`;

        if (queryString) {
            url += `?${queryString}`; // Add ? before the query string
        }

        const response = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        console.log("API Response:", response);
        return response.data;
    } catch (error) {
        console.error("Error fetching branches:", error);
        toast.error(`Failed to fetch branches: ${error.message}`);
        throw error;
    }
},

  getBranchById: async (id) => {
    try {
        const token = getToken();
      const response = await axios.get(`${API_URL}/branch/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
    });
      console.log("API Response:", response);
      return response.data;
    } catch (error) {
      console.error("Error fetching branch:", error);
      toast.error(`Failed to fetch branch: ${error.message}`);
      throw error;
    }
  },

  createBranch: async (formData) => {
    try {
        const token = getToken();
      const response = await axios.post(`${API_URL}/branch`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
    });
      console.log("API Response:", response);
      //toast.success("Bank created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating Branch :", error);
      toast.error(`Failed to create Branch  : ${error.message}`);
      throw error;
    }
  },

 updateBranch: async (id, formData) => {
    try {
      const token = getToken();
      const response = await axios.put(`${API_URL}/branch/${id}`, formData, {
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

   deleteBranch: async (id) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/branch/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error(`Error deleting branch ${id}:`, error);
      toast.error(`Failed to delete branch: ${error.message}`);
      throw error;
    }
  },
};

export default branchService;