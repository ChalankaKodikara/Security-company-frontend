import axios from "axios";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;

const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];
const TravelClaimsService = {
  

  fetchAllTravelClaimApplications: async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/travelClaim/summary-travel-claims`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response);
      return response.data; // Access the 'data' property
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(`Failed to fetch data: ${error.message}`);
      throw error;
    }
  },
  fetchTravelClaimApplicationById: async (id) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/travelClaim/get-by-id/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response TravelClaim:", response);
      return response.data?.data;
    } catch (error) {
      console.error("Error fetching TravelClaim application by ID:", error);
      throw error;
    }
  },

  recommendTravelClaim: async (id, payload) => {
    try {
      const token = getToken();

      const response = await axios.put(
        `${API_URL}/travelClaim/recommend-travel/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error recommending TravelClaim grant:", error);
      throw error;
    }
  },

  ApproveTravelClaim: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/travelClaim/approve-travel-by-superadmin/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Explicitly set content type
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error approving TravelClaim:", error);
      if (error.response && error.response.data) {
        console.error("Error data:", error.response.data); // Log the error data
      }
      throw error;
    }
  },
  RejectTravelClaim: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/travelClaim/reject-travel/${id}`,
        payload, // Send rejection reason in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting TravelClaim:", error);
      throw error;
    }
  },

  RejectTravelClaimSuperAdmin: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/travelClaim/reject-superadmin-travel/${id}`,
        payload, // Send rejection reason in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting TravelClaim:", error);
      throw error;
    }
  },
  SendBackTravelClaim: async (id, payload) => {
    //Add payload argument
    try {
      const token = getToken();

      const response = await axios.put(
        `${API_URL}/travelClaim/sendback-travel/${id}`,
        payload, // Send empty object as request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error recommending TravelClaim grant:", error);
      throw error;
    }
  },

  fetchTravelClaimDocuments: async (filePath) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/downloads/download?path=${filePath}`, // Append path as query parameter
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob", // Expect a Blob
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

  searchEmployeesByName: async (query) => {
    try {
      if (!query) return [];

      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const logged_user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="))
        ?.split("=")[1];

      const logged_user_role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1];

      const response = await axios.get(`${API_URL}/member/search-employees`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          query,
          logged_user,
          logged_user_role,
        },
      });

      return response.data?.data || [];
    } catch (error) {
      console.error(" Error in searchEmployeesByName:", error);
      return [];
    }
  },

  // Get summary counts of each card (pending, recommended, etc.)
  fetchTravelClaimApplicationCounts: async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const logged_user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="))
        ?.split("=")[1];

      const logged_user_role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1];

      const response = await axios.get(
        `${API_URL}/travelClaim/summary-travel-claims-count`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params: {
            logged_user,
            logged_user_role,
          },
        }
      );

      return response.data.data; // { pending: 1, recommended: 0, ... }
    } catch (error) {
      console.error("Error fetching Scholarship application counts:", error);
      throw error;
    }
  },

  // Add this service in Services/ScholarshipGrants/ScholarshipGrants.js
  searchTravelClaimsApplications: async (filters, page = 1, limit = 10) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        .split("=")[1];
      const logged_user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="))
        .split("=")[1];
      const logged_user_role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        .split("=")[1];

      const params = {
        page,
        limit,
        logged_user,
        logged_user_role,
        date_from: filters.dateRange?.split("to")[0]?.trim(),
        date_to: filters.dateRange?.split("to")[1]?.trim(),
        epf_no: filters.epfNo,
        bank_code: filters.bankCode,
        branch_code: filters.branchCode,
        status : filters.status
      };

      if (filters.memberId) {
        params.member_id = filters.memberId;
      } else if (filters.memberName) {
        params.member_name = filters.memberName;
      }

      const response = await axios.get(
        `${API_URL}/travelClaim/search-travel-claims`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params,
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error searching Scholarship applications:", error);
      throw error;
    }
  },
  fetchScholarshipApplicationsByStatus: async (
    status,
    page = 1,
    limit = 10
  ) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("accessToken="))
        ?.split("=")[1];

      const logged_user = document.cookie
        .split("; ")
        .find((row) => row.startsWith("username="))
        ?.split("=")[1];

      const logged_user_role = document.cookie
        .split("; ")
        .find((row) => row.startsWith("role="))
        ?.split("=")[1];

      const response = await axios.get(
        `${API_URL}/travelClaim/filter-by-status`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { status, page, limit, logged_user, logged_user_role },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching applications by status:", error);
      throw error;
    }
  },
};

export default TravelClaimsService;
