import axios from "axios";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

const AdvanceTypesService = {
  getAllAdvanceSetup: async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/advancetype/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API Response:", response);

      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(`Failed to fetch data: ${error.message}`);
      throw error;
    }
  },

  createNewAdvanceTypeSetup: async (formData) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/advancetype/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response);
      // toast.success("Maternity Criteria created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating Other Claim :", error);
      toast.error(`Failed to create Other Claim  : ${error.message}`);
      throw error;
    }
  },

  deleteAdvanceTypeSetup: async (id) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/advancetype/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // toast.success("Other Claim Deleted successfully!");
    } catch (error) {
      console.error(`Error deleting Other Claim ${id}:`, error);
      toast.error(`Failed to delete Other Claim : ${error.message}`);
      throw error;
    }
  },
}

export default AdvanceTypesService;