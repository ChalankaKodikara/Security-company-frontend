import axios from "axios";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

const maternityService = {
  getAllMaternityCriteria: async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/masterdata/maternitygrants/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response);

      return response.data;
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(`Failed to fetch data: ${error.message}`);
      throw error;
    }
  },

  createNewMaternityCriteria: async (formData) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/masterdata/maternitygrants/`,
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
      console.error("Error creating Maternity Criteria :", error);
      toast.error(`Failed to create Maternity Criteria  : ${error.message}`);
      throw error;
    }
  },

  updateMaternityCriteria: async (id, formData) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/masterdata/maternitygrant/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ); // Use axios.put
      console.log("API Response:", response);
      // toast.success("Maternity Criteria updated successfully!");
      return response.data;
    } catch (error) {
      console.error(`Error Updating Maternity Criteria ${id}:`, error);
      toast.error(`Failed to update Maternity Criteria  : ${error.message}`);
      throw error;
    }
  },

  deleteScholarshipCriteria: async (criteria_id) => {
    try {
      const token = getToken();
      await axios.delete(
        `${API_URL}/masterdata/maternitygrants/${criteria_id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // toast.success("Maternity Criteria Deleted successfully!");
    } catch (error) {
      console.error(`Error deleting Maternity Criteria ${criteria_id}:`, error);
      toast.error(`Failed to delete Maternity Criteria : ${error.message}`);
      throw error;
    }
  },
};

export default maternityService;
