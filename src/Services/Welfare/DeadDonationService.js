import axios from "axios";
import { toast } from "react-toastify";

const API_URL = process.env.REACT_APP_FRONTEND_URL;
const API_URL1 = `${import.meta.env.VITE_API_URL}/member`;

const getToken = () =>
  document.cookie
    .split("; ")
    .find((row) => row.startsWith("accessToken="))
    ?.split("=")[1];
const DeadDonationService = {
  getAllDeadDonationCriteria: async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/masterdata/deaddonations/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response);
      return response.data.data; // Access the 'data' property
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(`Failed to fetch data: ${error.message}`);
      throw error;
    }
  },

  createNewDeadDonationCriteria: async (formData) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/masterdata/deaddonation/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response);
      // toast.success("Dead Donation Criteria created successfully!"); //Updated message
      return response.data;
    } catch (error) {
      console.error("Error creating Dead Donation Criteria :", error); //Updated message
      toast.error(`Failed to create Dead Donation Criteria : ${error.message}`); //Updated message
      throw error;
    }
  },

  updateDeadDonationCriteria: async (id, formData) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/masterdata/deaddonation/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ); // Use axios.put
      console.log("API Response:", response);
      // toast.success("Dead Donation Criteria updated successfully!");//Updated message
      return response.data;
    } catch (error) {
      console.error(`Error Updating Dead Donation Criteria ${id}:`, error); //Updated Message
      toast.error(`Failed to update Dead Donation Criteria : ${error.message}`); //Updated message
      throw error;
    }
  },
  deleteDeadDonationCriteria: async (id) => {
    try {
      const token = getToken();
      await axios.delete(`${API_URL}/masterdata/deaddonation/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // toast.success("Dead Donation Criteria deleted successfully!");//Updated message
    } catch (error) {
      console.error(`Error deleting Dead Donation Criteria ${id}:`, error); //Updated message
      toast.error(`Failed to delete Dead Donation Criteria: ${error.message}`); //Updated message
      throw error;
    }
  },

  getMemberPersonalData: async (memberId) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/member/personal/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Adjust based on your API response structure
    } catch (error) {
      console.error("Error fetching member personal data:", error);
      toast.error(`Failed to fetch member personal data: ${error.message}`);
      throw error;
    }
  },

  getMemberNextOfKinData: async (memberId) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/member/next-of-kin/${memberId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data; // Adjust based on your API response structure
    } catch (error) {
      console.error("Error fetching next of kin data:", error);
      toast.error(`Failed to fetch next of kin data: ${error.message}`);
      throw error;
    }
  },

  applyForDeadDonation: async (formData) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/deathdonation/`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
          
        }
      );
      console.log("API Response:", response);
      
      return response.data;
    } catch (error) {
      console.error("Error creating Dead Donation :", error); //Updated message
      toast.error(`Failed to create Dead Donation : ${error.message}`); //Updated message
      throw error;
    }
  },

  fetchAllDeathApplications: async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/deathdonation`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response:", response);
      return response.data; // Access the 'data' property
    } catch (error) {
      console.error("Error fetching dead data:", error);
      toast.error(`Failed to fetch dead data: ${error.message}`);
      throw error;
    }
  },
  fetchDeathApplicationById: async (id) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/deathdonation/deathdonation/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response death donation:", response);
      return response;
    } catch (error) {
      console.error("Error fetching death application by ID:", error);
      throw error;
    }
  },
  recommendDeathApplication: async (id, payload) => {
    try {
      const token = getToken();

      const response = await axios.patch(
        `${API_URL}/deathdonation/deathdonation/${id}/status/recommended`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    

        if (response.status >= 200 && response.status < 300) {
                return { success: true, message: "Death donation successfully recommended", data: response.data };
            } else {
                console.error("Error recommending death donation:", response.status, response.statusText);
                return { success: false, message: `Failed to recommend death donation. Status: ${response.status} ${response.statusText}` };
            }
    } catch (error) {
      console.error("Error recommending death donation:", error);
      throw error;
    }
  },

  ApproveDeathApplication: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${API_URL}/deathdonation/deathdonation/${id}/status/approve`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Explicitly set content type
          },
        }
      );
         // Check if response.data exists and has the expected structure
    if (response.data) {
      return {
        success: true,
        message: response.message || "Death donation successfully Approved",
        data: response.data,
      };
    }
    } catch (error) {
      console.error("Error approving death application:", error);
      if (error.response && error.response.data) {
        console.error("Error data:", error.response.data); // Log the error data
      }
      throw error;
    }
  },
  rejectDeathApplication: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${API_URL}/deathdonation/deathdonation/${id}/status/rejected`,
        payload, // Send rejection reason in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data) {
      return {
        success: true,
        message: response.message || "Death donation successfully Rejected",
        data: response.data,
      };
    }
    } catch (error) {
      console.error("Error rejecting DeathApplication:", error);
      throw error;
    }
  },

  rejectDeathApplicationBySuperAdmin: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.patch(
        `${API_URL}/deathdonation/deathdonation/${id}/status/reject-by-superadmin`,
        payload, // Send rejection reason in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data) {
      return {
        success: true,
        message: response.message || "Death donation successfully Rejected",
        data: response.data,
      };
    }
    } catch (error) {
      console.error("Error rejecting DeathApplication by super admin:", error);
      throw error;
    }
  },

  sendBackDeathApplication: async (id,payload) => {
    try {
      const token = getToken();

      const response = await axios.patch(
        `${API_URL}/deathdonation/deathdonation/${id}/status/send-back`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data) {
      return {
        success: true,
        message: response.message || "Death donation successfully Sendback",
        data: response.data,
      };
    }
    } catch (error) {
      console.error("Error send back death application:", error);
      throw error;
    }
  },

  getDeadDonationAmount: async (application_date) => {
    try {
      const token = getToken();
      const response = await axios.post(
        `${API_URL}/deathdonation/deathdonation/amount`,
        application_date,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          
        }
      );
      console.log("API Response:", response);
      
      return response.data;
    } catch (error) {
      console.error("Error get death amount :", error); //Updated message
      //toast.error(`Failed to get death amount : ${error.message}`); //Updated message
      throw error;
    }
  },

  fetchDocuments: async (filePath) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/downloads/download?path=${filePath}`, // Append path as query parameter
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: 'blob', // Expect a Blob
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

  searchDeathApplications: async (filters, page, limit ) => {
    try {
        const token = document.cookie.split('; ').find(row => row.startsWith('accessToken=')).split('=')[1];
        const logged_user = document.cookie.split('; ').find(row => row.startsWith('username=')).split('=')[1];
        const logged_user_role = document.cookie.split('; ').find(row => row.startsWith('role=')).split('=')[1];

        const params = {
            page,
            limit,
            logged_user,
            logged_user_role,
            date_from: filters.dateRange?.split('to')[0]?.trim(),
            date_to: filters.dateRange?.split('to')[1]?.trim(),
            spouse_name: filters.spouseName,
            bank_code: filters.bankCode,
            branch_code: filters.branchCode,
            status: filters.status,
            epf_no: filters.epf_no,
        };

        if (filters.memberId) {
            params.member_id = filters.memberId;
        } else if (filters.memberName) {
            params.member_name = filters.memberName;
        }

        const response = await axios.get(`${API_URL}/deathdonation/search-death-donation-applications`, {
            headers: { Authorization: `Bearer ${token}` },
            params,
        });

        return response.data;
    } catch (error) {
        console.error("Error searching death applications:", error);
        throw error;
    }
},

fetchDeathApplicationCounts: async () => {
    try {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('accessToken='))
            ?.split('=')[1];

        const logged_user = document.cookie
            .split('; ')
            .find(row => row.startsWith('username='))
            ?.split('=')[1];

        const logged_user_role = document.cookie
            .split('; ')
            .find(row => row.startsWith('role='))
            ?.split('=')[1];

        const response = await axios.get(`${API_URL}/deathdonation/summary-death-donation-applications-count`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                logged_user,
                logged_user_role,
            },
        });

        return response.data.data; // { pending: 1, recommended: 0, ... }
    } catch (error) {
        console.error("Error fetching death application counts:", error);
        throw error;
    }
  },



/**
 * Search employees by name input.
 * @param {string} query - The search string for member name.
 * @returns {Promise<Array>} List of matching members.
 */
searchEmployeesByName: async (query) => {
    try {
        if (!query) return [];

        const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('accessToken='))
            ?.split('=')[1];

        const logged_user = document.cookie
            .split('; ')
            .find((row) => row.startsWith('username='))
            ?.split('=')[1];

        const logged_user_role = document.cookie
            .split('; ')
            .find((row) => row.startsWith('role='))
            ?.split('=')[1];

        const response = await axios.get(`${API_URL1}/search-employees`, {
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
        console.error("🔴 Error in searchEmployeesByName:", error);
        return [];
    }
},


/**
 * Fetch paginated summary maternity applications
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<Object>} Paginated applications
 */
// Services/MaternityGrants/MaternityGrants.js
fetchDeathApplicationsByStatus: async (status, page = 1, limit = 10) => {
    try {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('accessToken='))
            ?.split('=')[1];

        const logged_user = document.cookie
            .split('; ')
            .find(row => row.startsWith('username='))
            ?.split('=')[1];

        const logged_user_role = document.cookie
            .split('; ')
            .find(row => row.startsWith('role='))
            ?.split('=')[1];

        const response = await axios.get(`${API_URL}/deathdonation/filter-by-status`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { status, page, limit, logged_user, logged_user_role },
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching applications by status:", error);
        throw error;
    }
},
getMemberDetails: async (memberNo) => {
    try {
        const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('accessToken='))
            ?.split('=')[1];

        const response = await axios.get(`${API_URL1}/get-member-details/${memberNo}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; //  Return the whole response data
    } catch (error) {
        console.error("Error fetching member details:", error);
        return { success: false, error: error.message };
    }
},


applyForDeadAdvance: async (data) => {
  try {
    const token = getToken();
    const response = await axios.post(
      `${API_URL}/requestadvance/add-death-advance`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    console.log("API Response:", response);
    return response.data;
  } catch (error) {
    console.error("Error creating Dead Advance:", error);
    toast.error(`Failed to create Dead Advance: ${error.message}`);
    throw error;
  }
},

fetchDeathAdvanceCounts: async () => {
    try {
        const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('accessToken='))
            ?.split('=')[1];

        const logged_user = document.cookie
            .split('; ')
            .find(row => row.startsWith('username='))
            ?.split('=')[1];

        const logged_user_role = document.cookie
            .split('; ')
            .find(row => row.startsWith('role='))
            ?.split('=')[1];

        const response = await axios.get(`${API_URL}/requestadvance/advance-counts?type=death`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                logged_user,
                logged_user_role,
            },
        });

        return response.data.counts; // { pending: 1, recommended: 0, ... }
    } catch (error) {
        console.error("Error fetching death application counts:", error);
        throw error;
    }
  },

searchDeathAdvance: async (filters, page, limit) => {
    try {
        const token = document.cookie.split('; ').find(row => row.startsWith('accessToken=')).split('=')[1];
        const logged_user = document.cookie.split('; ').find(row => row.startsWith('username=')).split('=')[1];
        const logged_user_role = document.cookie.split('; ').find(row => row.startsWith('role=')).split('=')[1];

        const params = {
            page,
            limit,
            logged_user,
            logged_user_role,
            date_from: filters.dateRange?.split('to')[0]?.trim(),
            date_to: filters.dateRange?.split('to')[1]?.trim(),
            bank_code: filters.bankCode,
            branch_code: filters.branchCode,
            status: filters.status,
            epf_no: filters.epf_no,
            type:"death"
        };

        if (filters.memberId) {
            params.member_id = filters.memberId;
        } else if (filters.memberName) {
            params.member_name = filters.memberName;
        }

        const response = await axios.get(`${API_URL}/requestadvance/advance-requests-filter`, {
            headers: { Authorization: `Bearer ${token}` },
            params,
        });

       // console.log("API Response:", response); 
        return response.data;
    } catch (error) {
        console.error("Error searching death advance:", error);
        throw error;
    }
},
fetchDeathAdvanceById: async (id) => {
    try {
      const token = getToken();
      const response = await axios.get(
        `${API_URL}/requestadvance/get-by-id/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("API Response death advance:", response);
      return response;
    } catch (error) {
      console.error("Error fetching death advance by ID:", error);
      throw error;
    }
  },
  recommendDeathAdvance: async (id, payload) => {
    try {
      const token = getToken();

      const response = await axios.put(
        `${API_URL}/requestadvance/recommend/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    

        if (response.status >= 200 && response.status < 300) {
                return { success: true, message: "Death advance successfully recommended", data: response.data };
            } else {
                console.error("Error recommending death advance:", response.status, response.statusText);
                return { success: false, message: `Failed to recommend death advance. Status: ${response.status} ${response.statusText}` };
            }
    } catch (error) {
      console.error("Error recommending death advance:", error);
      throw error;
    }
  },
  rejectDeathAdvance: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/requestadvance/reject/${id}`,
        payload, // Send rejection reason in the request body
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data) {
      return {
        success: true,
        message: response.message || "Death advance successfully Rejected",
        data: response.data,
      };
    }
    } catch (error) {
      console.error("Error rejecting Death Advance:", error);
      throw error;
    }
  },
  ApproveDeathAdvance: async (id, payload) => {
    try {
      const token = getToken();
      const response = await axios.put(
        `${API_URL}/requestadvance/approve/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Explicitly set content type
          },
        }
      );
         // Check if response.data exists and has the expected structure
    if (response.data) {
      return {
        success: true,
        message: response.message || "Death advance successfully Approved",
        data: response.data,
      };
    }
    } catch (error) {
      console.error("Error approving death advance:", error);
      if (error.response && error.response.data) {
        console.error("Error data:", error.response.data); // Log the error data
      }
      throw error;
    }
  },

  getAdvanceForMember: async (memberNo) => {
    try {
        const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('accessToken='))
            ?.split('=')[1];

        const response = await axios.get(`${API_URL}/deathdonation/deathdonation/advanceAmount/${memberNo}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; //  Return the whole response data
    } catch (error) {
        console.error("Error fetching advance:", error);
        return { success: false, error: error.message };
    }
},
getDeathStatus: async (memberNo) => {
    try {
        const token = document.cookie
            .split('; ')
            .find((row) => row.startsWith('accessToken='))
            ?.split('=')[1];

        const response = await axios.get(`${API_URL}/deathdonation/deathdonation/member/status/${memberNo}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data; //  Return the whole response data
    } catch (error) {
        console.error("No records found for this member number:", error);
        return { success: false, error: error.message };
    }
},

};

export default DeadDonationService;
