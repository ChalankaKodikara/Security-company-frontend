import axios from 'axios';
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

const WelfareBenifitsService = {
  getAllWelfareType: async () => {
    try { const token = getToken();
      const response = await axios.get(`${API_URL}/masterdata/welfarebenefit/`, 
        {
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

  createNewWelfareType: async (formData) => {
    try { const token = getToken();
      const response = await axios.post(`${API_URL}/masterdata/welfarebenefit`, formData,  
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      console.log("API Response:", response);
      // toast.success("Maternity Criteria created successfully!");
      return response.data;
    } catch (error) {
      console.error("Error creating Welfare Type :", error);
      // toast.error(`Failed to create Welfare Type  : ${error.message}`);
      throw error;
    }
  },


  deleteWelfareType: async (id) => {
    try { const token = getToken();
      await axios.delete(`${API_URL}/masterdata/welfarebenefit/delete/${id}`, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      // toast.success("Welfare Type Deleted successfully!");
    } catch (error) {
      console.error(`Error deleting Welfare Type ${id}:`, error);
      toast.error(`Failed to delete Welfare Type : ${error.message}`);
      throw error;
    }
  },
};

export default WelfareBenifitsService;