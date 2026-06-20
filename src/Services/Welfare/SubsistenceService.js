import axios from 'axios';
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];
const SubsistenceService = {
  getAllSubsistenceSetup: async () => {
    try {      const token = getToken();
      const response = await axios.get(`${API_URL}/masterdata/subsistences/`, {
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

  createNewSubsistenceSetup: async (formData) => {
    try {      const token = getToken();
      const response = await axios.post(`${API_URL}/masterdata/subsistences/`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      console.log("API Response:", response);
      // toast.success("Maternity Criteria created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating Subsistence :", error);
      toast.error(`Failed to create Subsistence  : ${error.message}`);
      throw error;
    }
  },

  updateSubsistenceSetup: async (id, formData) => {
    try {      const token = getToken();
      const response = await axios.put(`${API_URL}/masterdata/subsistence/${id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }); // Use axios.put
      console.log("API Response:", response);
      // toast.success("Subsistence updated successfully!");
      return response.data;
    } catch (error) {
      console.error(`Error Updating Subsistence ${id}:`, error);
      toast.error(`Failed to update Subsistence  : ${error.message}`);
      throw error;
    }
  },

  deleteSubsistenceSetup: async (id) => {
    try {      const token = getToken();
      await axios.delete(`${API_URL}/masterdata/subsistence/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      // toast.success("Subsistence Deleted successfully!");
    } catch (error) {
      console.error(`Error deleting Subsistence ${id}:`, error);
      toast.error(`Failed to delete Subsistence : ${error.message}`);
      throw error;
    }
  },
};

export default SubsistenceService;