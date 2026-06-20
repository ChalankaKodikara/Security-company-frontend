import axios from "axios";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];

const OtherClaimsService = {
  getAllClaimsSetup: async () => {
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/masterdata/otherclaims/`, {
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

  createNewOtherClaimsSetup: async (formData) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/masterdata/otherclaim/`,
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

  deleteotherClaimsSetup: async (id) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/masterdata/otherclaim/delete/${id}`, {
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

  //table

  fetchAllOtherClaimApplications: async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/otherClaim/summary-other-claims-count`,
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
  fetchOtherlClaimApplicationById: async (id) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/otherClaim/get-by-id/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response OtherClaim:", response);
      return response.data?.data;
    } catch (error) {
      console.error("Error fetching OtherClaim application by ID:", error);
      throw error;
    }
  },

  recommendOtherClaim: async (id, payload) => {
    try {
      const token = getToken();

      const response = await axios.put(
        `${API_URL}/otherClaim/recommend-other/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error recommending OtherClaim grant:", error);
      throw error;
    }
  },

  ApproveOtherClaim: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/otherClaim/approve-other-by-superadmin/${id}`,
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
      console.error("Error approving OtherClaim:", error);
      if (error.response && error.response.data) {
        console.error("Error data:", error.response.data); // Log the error data
      }
      throw error;
    }
  },
  RejectOtherClaim: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/otherClaim/reject-other/${id}`,
        payload, // Send rejection reason in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting OtherClaim:", error);
      throw error;
    }
  },

  RejectOtherClaimSuperAdmin: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/otherClaim/reject-superadmin-other/${id}`,
        payload, // Send rejection reason in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting OtherClaim:", error);
      throw error;
    }
  },
  SendBackOtherClaim: async (id, payload) => {
    //Add payload argument
    try {
      const token = getToken();

      const response = await axios.put(
        `${API_URL}/otherClaim/sendback-other/${id}`,
        payload, // Send empty object as request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Error recommending OtherClaim grant:", error);
      throw error;
    }
  },

  fetchOtherClaimDocuments: async (filePath) => {
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
  fetchOtherClaimApplicationCounts: async () => {
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
        `${API_URL}/otherClaim/summary-other-claims-count`,
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
  searchOtherClaimsApplications: async (filters, page = 1, limit = 10) => {
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
        status: filters.status,
      };

      if (filters.memberId) {
        params.member_id = filters.memberId;
      } else if (filters.memberName) {
        params.member_name = filters.memberName;
      }

      const response = await axios.get(
        `${API_URL}/otherClaim/search-other-claims`,
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
  fetchOtherClaimApplicationsByStatus: async (status, page = 1, limit = 10) => {
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
        `${API_URL}/otherClaim/filter-by-status`,
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

  ApplyOtherClaims: async (formData) => {
    const accessToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("accessToken="))
      ?.split("=")[1];

    const refreshToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("refreshToken="))
      ?.split("=")[1];
   
    const response = await axios.post(
      `${API_URL}/otherClaim/add-other-claim`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          RefreshToken: refreshToken,
         
        },
      }
    );

    return response.data;
  },

 getAllMembers: async (logged_user, logged_user_role) => {
  try {
    const token = getToken();
    const refreshToken = document.cookie
      .split("; ")
      .find((row) => row.startsWith("refreshToken="))
      ?.split("=")[1];

    // Construct the URL using path parameters
    const url = `${API_URL}/member/same-branch/${logged_user}/${logged_user_role}`;

    const response = await axios.get(url, {  // Remove the `params` object
      headers: {
        Authorization: `Bearer ${token}`,
        RefreshToken: refreshToken,
      },
    });

    console.log("API Response:", response);
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
    throw error; // Re-throw to be handled by component
  }
},
};

export default OtherClaimsService;
